import { parseStored, readRaw, writeRaw } from "@/lib/local-progress";
import type { Language } from "@/types";

/** Per-character typing record. Keyed by the expected character (a Khmer legend like ុំ stays whole). */
export type KeyStat = { n: number; e: number; ms: number; t: number };
export type KeyStats = Record<string, KeyStat>;
export type KeyStatBook = Record<Language, KeyStats>;

export const KEYSTATS_KEY = "dlt.keystats";
export const EMPTY_BOOK: KeyStatBook = { english: {}, khmer: {} };
/** Totals from the account's OTHER devices, written by sync. Never edited locally, so syncing cannot double-count. */
export const KEYSTATS_REMOTE_KEY = "dlt.keystats.remote";

/** This device's history plus the other devices' history. */
export function combineBooks(own: KeyStatBook, remote: KeyStatBook): KeyStatBook {
  const out: KeyStatBook = { english: { ...own.english }, khmer: { ...own.khmer } };
  for (const lang of ["english", "khmer"] as const) {
    for (const [ch, r] of Object.entries(remote[lang])) {
      const o = out[lang][ch];
      out[lang][ch] = o ? { n: o.n + r.n, e: o.e + r.e, ms: o.ms + r.ms, t: o.t + r.t } : r;
    }
  }
  return out;
}

/** Pauses longer than this are thinking time, not key speed. */
const MAX_GAP_MS = 2500;
const MIN_ATTEMPTS = 4;

const isStat = (v: unknown): v is KeyStat =>
  typeof v === "object" && v !== null && ["n", "e", "ms", "t"].every((k) => typeof (v as Record<string, unknown>)[k] === "number" && Number.isFinite((v as Record<string, number>)[k]));

export function validateBook(value: unknown): KeyStatBook | null {
  if (typeof value !== "object" || value === null) return null;
  const out: KeyStatBook = { english: {}, khmer: {} };
  for (const lang of ["english", "khmer"] as const) {
    const src = (value as Record<string, unknown>)[lang];
    if (typeof src !== "object" || src === null) continue;
    for (const [char, stat] of Object.entries(src)) if (isStat(stat)) out[lang][char] = stat;
  }
  return out;
}

/** Add one keystroke to an in-memory session. `gapMs` is the time since the previous keystroke (null = unknown). */
export function addSample(session: KeyStats, expected: string, correct: boolean, gapMs: number | null) {
  const s = (session[expected] ??= { n: 0, e: 0, ms: 0, t: 0 });
  s.n += 1;
  if (!correct) s.e += 1;
  if (gapMs !== null && gapMs > 0 && gapMs <= MAX_GAP_MS) {
    s.ms += gapMs;
    s.t += 1;
  }
}

/** Merge a finished/abandoned session into the stored book. Safe to call with an empty session. */
export function flushSession(language: Language, session: KeyStats) {
  const entries = Object.entries(session);
  if (!entries.length) return;
  const book = parseStored(readRaw(KEYSTATS_KEY), EMPTY_BOOK, validateBook);
  const target = { ...book, [language]: { ...book[language] } };
  for (const [char, s] of entries) {
    const prev = target[language][char] ?? { n: 0, e: 0, ms: 0, t: 0 };
    target[language][char] = { n: prev.n + s.n, e: prev.e + s.e, ms: prev.ms + s.ms, t: prev.t + s.t };
  }
  writeRaw(KEYSTATS_KEY, JSON.stringify(target));
}

export type WeakKey = { char: string; attempts: number; errorRate: number; avgMs: number; score: number };

/** Rank characters by mistakes first, then by being slower than your own average. */
export function weakKeys(stats: KeyStats, limit = 8): WeakKey[] {
  const rows = Object.entries(stats).filter(([ch, s]) => ch.trim() !== "" && s.n >= MIN_ATTEMPTS);
  const timed = rows.reduce((a, [, s]) => ({ ms: a.ms + s.ms, t: a.t + s.t }), { ms: 0, t: 0 });
  const overall = timed.t ? timed.ms / timed.t : 0;
  return rows
    .map(([char, s]): WeakKey => {
      const errorRate = s.e / s.n;
      const avgMs = s.t ? s.ms / s.t : 0;
      const slow = overall && avgMs ? Math.min(1.5, Math.max(0, avgMs / overall - 1)) : 0;
      return { char, attempts: s.n, errorRate, avgMs, score: errorRate * 100 + slow * 30 };
    })
    .filter((k) => k.score >= 10)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** A short practice text made only of the weak characters, in word-like groups. `rand` is injectable for tests. */
export function makeDrill(chars: string[], length = 48, rand: () => number = Math.random): string {
  const pool = chars.filter((c) => c.trim() !== "");
  if (!pool.length) return "";
  const words: string[] = [];
  let count = 0;
  while (count < length) {
    const size = Math.min(length - count, 2 + Math.floor(rand() * 3));
    let word = "";
    for (let i = 0; i < size; i++) word += pool[Math.floor(rand() * pool.length)];
    words.push(word);
    count += size + 1;
  }
  return words.join(" ").trim();
}

/** Record keystrokes typed together (`samples`: [expected, correct]); the gap since the last call times single keystrokes. */
export function recordKeystrokes(session: KeyStats, last: { current: number | null }, samples: [expected: string, correct: boolean][]) {
  const now = Date.now();
  const gap = samples.length === 1 && last.current !== null ? now - last.current : null;
  last.current = now;
  for (const [expected, correct] of samples) addSample(session, expected, correct, gap);
}
