import { findKeyFor } from "@/lib/keyboard/keyboard-mapping";
import { parseStored, readRaw, removeRaw, writeRaw } from "@/lib/local-progress";
import { emitPetEvent } from "@/lib/pets/pet-events";
import { computeSessionStats } from "@/lib/progress/progress-analytics";
import type { Language } from "@/types";
import {
  ACTIVITY_TYPES,
  PROGRESS_SCHEMA_VERSION,
  type ActivityType,
  type KeyRecord,
  type KeyboardLayoutId,
  type ProgressStore,
  type SessionInput,
  type SessionRecord,
  type SessionTally,
  type Tally,
  type WordRecord,
} from "@/types/progress";

/**
 * Single localStorage entry for all dashboard data. The `v1` suffix and the
 * `version` field inside let a future release migrate (or move to PostgreSQL:
 * `ProgressStore` is plain JSON and every record has a stable id/shape).
 */
export const PROGRESS_KEY = "dlt.progress.v1";
export const MAX_SESSIONS = 1000;
const MAX_PAIRS = 600;
const MAX_WORDS = 300;

export const EMPTY_STORE: ProgressStore = { version: PROGRESS_SCHEMA_VERSION, sessions: [], keys: {}, pairs: {}, words: {} };

// ---- Validation -------------------------------------------------------------
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const num = (v: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): number | null =>
  typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : null;
const isLanguage = (v: unknown): v is Language => v === "english" || v === "khmer";

function validateSession(v: unknown): SessionRecord | null {
  if (!isRecord(v)) return null;
  const { id, activity, language, completedAt, layout, detail, difficulty } = v;
  if (typeof id !== "string" || !id) return null;
  if (!(ACTIVITY_TYPES as readonly unknown[]).includes(activity) || !isLanguage(language)) return null;
  if (typeof completedAt !== "string" || Number.isNaN(Date.parse(completedAt))) return null;
  const durationSec = num(v.durationSec), wpm = num(v.wpm, 0, 400), accuracy = num(v.accuracy, 0, 100);
  const correct = num(v.correct), incorrect = num(v.incorrect);
  if (durationSec === null || wpm === null || accuracy === null || correct === null || incorrect === null) return null;
  return {
    id,
    activity: activity as ActivityType,
    language,
    durationSec,
    wpm,
    accuracy,
    correct,
    incorrect,
    score: num(v.score),
    difficulty: difficulty === "easy" || difficulty === "medium" || difficulty === "hard" ? difficulty : null,
    layout: layout === "khmer-nida" || layout === "english-qwerty" ? layout : layoutFor(language),
    completedAt,
    ...(typeof detail === "string" ? { detail: detail.slice(0, 80) } : {}),
  };
}

function validateTally(v: unknown): Tally | null {
  if (!isRecord(v)) return null;
  const n = num(v.n), c = num(v.c);
  return n === null || c === null ? null : { n, c: Math.min(c, n) };
}

function validateKeys(v: unknown): Record<string, KeyRecord> {
  const out: Record<string, KeyRecord> = {};
  if (!isRecord(v)) return out;
  for (const [id, raw] of Object.entries(v)) {
    const base = validateTally(raw);
    if (!base || !isRecord(raw)) continue;
    const chars: Record<string, Tally> = {};
    if (isRecord(raw.chars)) for (const [ch, t] of Object.entries(raw.chars)) { const tally = validateTally(t); if (tally) chars[ch] = tally; }
    out[id] = { ...base, last: num(raw.last) ?? 0, chars };
  }
  return out;
}

/**
 * Parses whatever is in storage into a safe store. Corrupted entries are dropped
 * individually rather than discarding the whole history.
 */
export function validateStore(value: unknown): ProgressStore | null {
  if (!isRecord(value)) return null;
  const pairs: Record<string, Tally> = {};
  if (isRecord(value.pairs)) for (const [k, t] of Object.entries(value.pairs)) { const tally = validateTally(t); if (tally) pairs[k] = tally; }
  const words: Record<string, WordRecord> = {};
  if (isRecord(value.words)) {
    for (const [k, w] of Object.entries(value.words)) {
      if (!isRecord(w)) continue;
      const n = num(w.n), e = num(w.e);
      if (n !== null && e !== null) words[k] = { n, e: Math.min(e, n) };
    }
  }
  const sessions = Array.isArray(value.sessions) ? value.sessions.map(validateSession).filter((s): s is SessionRecord => s !== null) : [];
  // Version 1 is the only schema so far; future versions add a migration step here.
  return { version: PROGRESS_SCHEMA_VERSION, sessions: sessions.slice(-MAX_SESSIONS), keys: validateKeys(value.keys), pairs, words };
}

export const readStore = (): ProgressStore => parseStored(readRaw(PROGRESS_KEY), EMPTY_STORE, validateStore);
const writeStore = (store: ProgressStore) => writeRaw(PROGRESS_KEY, JSON.stringify(store));
export const clearProgress = () => removeRaw(PROGRESS_KEY);

// ---- Session tally (in memory while an activity runs) -----------------------
export const layoutFor = (language: Language): KeyboardLayoutId => (language === "khmer" ? "khmer-nida" : "english-qwerty");
export const createTally = (): SessionTally => ({ keys: {}, pairs: {}, words: {}, prev: null });
export const isTallyEmpty = (t: SessionTally) => !Object.keys(t.keys).length && !Object.keys(t.words).length;

const bump = (t: Tally, ok: boolean) => {
  t.n += 1;
  if (ok) t.c += 1;
};

/**
 * Records one keystroke. `expected` is the character the learner was asked to
 * type; it is mapped to the physical key that produces it in the active layout.
 * Characters with no key in the layout (e.g. curly quotes) are ignored.
 * `sequence: false` skips combination tracking (for targets that are unrelated, like Letter Jump).
 */
export function tallyKeystroke(tally: SessionTally, language: Language, expected: string, ok: boolean, sequence = true, now = Date.now()) {
  const target = findKeyFor(language, expected);
  if (!target) {
    tally.prev = null;
    return;
  }
  const id = `${language}:${target.code}`;
  const key = (tally.keys[id] ??= { n: 0, c: 0, last: now, chars: {} });
  bump(key, ok);
  key.last = now;
  bump((key.chars[expected] ??= { n: 0, c: 0 }), ok);

  const prev = tally.prev;
  if (sequence && prev && prev.language === language && prev.ok && expected.trim() !== "" && prev.char.trim() !== "") {
    bump((tally.pairs[`${language}:${prev.char}${expected}`] ??= { n: 0, c: 0 }), ok);
  }
  tally.prev = sequence ? { language, char: expected, ok } : null;
}

/** Records that a whole word was typed, and whether it contained a mistake. */
export function tallyWord(tally: SessionTally, language: Language, word: string, hadError: boolean) {
  const clean = word.trim().toLowerCase();
  if (!clean || Array.from(clean).length > 24) return;
  const w = (tally.words[`${language}:${clean}`] ??= { n: 0, e: 0 });
  w.n += 1;
  if (hadError) w.e += 1;
}

/** Splits a text into words and tallies the ones whose characters were mistyped (by index into `target`). */
export function tallyWordsFromText(tally: SessionTally, language: Language, target: string, typed: string) {
  if (language !== "english") return; // Khmer text has no spaces to split on
  const goal = Array.from(target), got = Array.from(typed);
  let start = 0;
  for (let i = 0; i <= goal.length; i++) {
    if (i < goal.length && goal[i] !== " ") continue;
    // A word counts only once the learner typed past its last letter.
    if (got.length >= i && i > start) {
      const word = goal.slice(start, i).join("");
      if (/^[a-z']+$/i.test(word)) tallyWord(tally, language, word, goal.slice(start, i).some((ch, k) => got[start + k] !== ch));
    }
    start = i + 1;
  }
}

function mergeCounts<T extends { n: number }>(into: Record<string, T>, from: Record<string, T>, add: (a: T, b: T) => T, limit: number): Record<string, T> {
  const merged: Record<string, T> = { ...into };
  for (const [k, v] of Object.entries(from)) merged[k] = merged[k] ? add(merged[k], v) : { ...v };
  const entries = Object.entries(merged);
  // Keep the most-practised entries so the stored size stays bounded.
  return entries.length <= limit ? merged : Object.fromEntries(entries.sort((a, b) => b[1].n - a[1].n).slice(0, limit));
}

function applyTally(store: ProgressStore, tally: SessionTally): ProgressStore {
  const keys = { ...store.keys };
  for (const [id, add] of Object.entries(tally.keys)) {
    const prev = keys[id];
    const chars = { ...(prev?.chars ?? {}) };
    for (const [ch, t] of Object.entries(add.chars)) chars[ch] = { n: (chars[ch]?.n ?? 0) + t.n, c: (chars[ch]?.c ?? 0) + t.c };
    keys[id] = { n: (prev?.n ?? 0) + add.n, c: (prev?.c ?? 0) + add.c, last: Math.max(prev?.last ?? 0, add.last), chars };
  }
  return { ...store, keys, pairs: mergeCounts(store.pairs, tally.pairs, (a, b) => ({ n: a.n + b.n, c: a.c + b.c }), MAX_PAIRS), words: mergeCounts(store.words, tally.words, (a, b) => ({ n: a.n + b.n, e: a.e + b.e }), MAX_WORDS) };
}

/** Saves key/word statistics without a session, e.g. when the learner leaves mid-run. */
export function commitTally(tally: SessionTally) {
  if (isTallyEmpty(tally)) return;
  writeStore(applyTally(readStore(), tally));
}

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;

/**
 * Saves a finished session and merges its key statistics in one write, so the
 * dashboard never shows one without the other. Sessions with no input are ignored.
 */
export function recordSession(input: SessionInput, tally?: SessionTally, now = new Date()): SessionRecord | null {
  const correct = Math.max(0, Math.round(input.correct)), incorrect = Math.max(0, Math.round(input.incorrect));
  const durationSec = Math.max(1, Math.round(input.durationSec));
  let store = readStore();
  if (tally) store = applyTally(store, tally);
  if (correct + incorrect === 0) {
    if (tally) writeStore(store);
    return null;
  }
  const computed = computeSessionStats(correct, incorrect, durationSec);
  const session: SessionRecord = {
    id: newId(),
    activity: input.activity,
    language: input.language,
    durationSec,
    wpm: Math.min(400, Math.max(0, Math.round(input.wpm ?? computed.wpm))),
    accuracy: Math.min(100, Math.max(0, Math.round(input.accuracy ?? computed.accuracy))),
    correct,
    incorrect,
    score: typeof input.score === "number" && Number.isFinite(input.score) ? input.score : null,
    difficulty: input.difficulty ?? null,
    layout: layoutFor(input.language),
    completedAt: now.toISOString(),
    ...(input.detail ? { detail: input.detail.slice(0, 80) } : {}),
  };
  writeStore({ ...store, sessions: [...store.sessions, session].slice(-MAX_SESSIONS) });
  // The companion cheers for a finished lesson and encourages after any other session.
  emitPetEvent(session.activity === "lesson" ? { type: "celebrate" } : { type: "encourage", good: session.accuracy >= 90 });
  return session;
}
