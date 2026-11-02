// Browser-only persistence. Everything here is wrapped in try/catch so a
// blocked or full localStorage never breaks the UI, and falls back to memory.
import type { Difficulty } from "@/lib/game-engine";
import type { Language } from "@/types";

const memory = new Map<string, string>();
const listeners = new Set<() => void>();
let storageHooked = false;

export function readRaw(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key) ?? memory.get(key) ?? null;
  } catch {
    return memory.get(key) ?? null;
  }
}

export function writeRaw(key: string, value: string) {
  memory.set(key, value);
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage unavailable: the in-memory copy keeps this session working.
  }
  listeners.forEach((listener) => listener());
}

export function removeRaw(key: string) {
  memory.delete(key);
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Storage unavailable: nothing persisted to remove.
  }
  listeners.forEach((listener) => listener());
}

export function subscribeStorage(listener: () => void) {
  listeners.add(listener);
  if (!storageHooked && typeof window !== "undefined") {
    storageHooked = true;
    window.addEventListener("storage", () => listeners.forEach((l) => l()));
  }
  return () => {
    listeners.delete(listener);
  };
}

export function parseStored<T>(raw: string | null, fallback: T, validate: (value: unknown) => T | null): T {
  if (raw === null) return fallback;
  try {
    return validate(JSON.parse(raw)) ?? fallback;
  } catch {
    return fallback;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

// ---- Settings -------------------------------------------------------------
export type GameSettings = { sound: boolean; animations: boolean; language: Language; difficulty: Difficulty };
export const SETTINGS_KEY = "dlt.settings";
export const DEFAULT_SETTINGS: GameSettings = { sound: true, animations: true, language: "english", difficulty: "easy" };

export function validateSettings(value: unknown): GameSettings | null {
  if (!isRecord(value)) return null;
  return {
    sound: typeof value.sound === "boolean" ? value.sound : DEFAULT_SETTINGS.sound,
    animations: typeof value.animations === "boolean" ? value.animations : DEFAULT_SETTINGS.animations,
    language: value.language === "khmer" ? "khmer" : "english",
    difficulty: value.difficulty === "medium" || value.difficulty === "hard" ? value.difficulty : "easy",
  };
}

// ---- High scores ----------------------------------------------------------
export type ScoreEntry = { best: number; bestWpm: number; bestAccuracy: number; plays: number };
export type ScoreBook = Record<string, ScoreEntry>;
export const SCORES_KEY = "dlt.scores";

export function validateScores(value: unknown): ScoreBook | null {
  if (!isRecord(value)) return null;
  const book: ScoreBook = {};
  for (const [key, entry] of Object.entries(value)) {
    if (!isRecord(entry)) continue;
    const num = (n: unknown) => (typeof n === "number" && Number.isFinite(n) ? n : 0);
    book[key] = { best: num(entry.best), bestWpm: num(entry.bestWpm), bestAccuracy: num(entry.bestAccuracy), plays: num(entry.plays) };
  }
  return book;
}

/** Records a finished run. Returns true when it set a new best score. */
export function recordScore(variant: string, result: { score: number; wpm?: number; accuracy?: number }): boolean {
  const book = parseStored(readRaw(SCORES_KEY), {} as ScoreBook, validateScores);
  const previous = book[variant] ?? { best: 0, bestWpm: 0, bestAccuracy: 0, plays: 0 };
  const isBest = result.score > previous.best;
  book[variant] = {
    best: Math.max(previous.best, result.score),
    bestWpm: Math.max(previous.bestWpm, result.wpm ?? 0),
    bestAccuracy: Math.max(previous.bestAccuracy, result.accuracy ?? 0),
    plays: previous.plays + 1,
  };
  writeRaw(SCORES_KEY, JSON.stringify(book));
  return isBest;
}

/** Best score across every variant of a game, e.g. "word-sprint:*". */
export function bestForGame(book: ScoreBook, gameId: string) {
  return Object.entries(book).filter(([key]) => key === gameId || key.startsWith(`${gameId}:`)).reduce((max, [, entry]) => Math.max(max, entry.best), 0);
}

// ---- Mario Khmer Quest level progress -------------------------------------
export type LevelResult = { stars: number; score: number };
export type LevelBook = Record<string, LevelResult>;
export const LEVELS_KEY = "dlt.mario-khmer-quest.levels";

export function validateLevels(value: unknown): LevelBook | null {
  if (!isRecord(value)) return null;
  const book: LevelBook = {};
  for (const [key, entry] of Object.entries(value)) {
    if (isRecord(entry) && typeof entry.stars === "number" && typeof entry.score === "number") book[key] = { stars: entry.stars, score: entry.score };
  }
  return book;
}

export function recordLevel(level: number, result: LevelResult) {
  const book = parseStored(readRaw(LEVELS_KEY), {} as LevelBook, validateLevels);
  const previous = book[level];
  book[level] = { stars: Math.max(previous?.stars ?? 0, result.stars), score: Math.max(previous?.score ?? 0, result.score) };
  writeRaw(LEVELS_KEY, JSON.stringify(book));
}

// ---- Practice records & first-visit flags ---------------------------------
export type PracticeBest = { bestWpm: number; bestAccuracy: number };
export const PRACTICE_KEY = "dlt.practice";

export function validatePractice(value: unknown): Record<string, PracticeBest> | null {
  if (!isRecord(value)) return null;
  const out: Record<string, PracticeBest> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (isRecord(entry) && typeof entry.bestWpm === "number" && typeof entry.bestAccuracy === "number") out[key] = { bestWpm: entry.bestWpm, bestAccuracy: entry.bestAccuracy };
  }
  return out;
}

export function recordPractice(language: Language, wpm: number, accuracy: number) {
  const book = parseStored(readRaw(PRACTICE_KEY), {} as Record<string, PracticeBest>, validatePractice);
  const previous = book[language] ?? { bestWpm: 0, bestAccuracy: 0 };
  book[language] = { bestWpm: Math.max(previous.bestWpm, wpm), bestAccuracy: Math.max(previous.bestAccuracy, accuracy) };
  writeRaw(PRACTICE_KEY, JSON.stringify(book));
}

export const SEEN_KEY = "dlt.seen";
export function validateSeen(value: unknown): Record<string, boolean> | null {
  if (!isRecord(value)) return null;
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v === true).map(([k]) => [k, true as boolean]));
}
export function markSeen(id: string) {
  const seen = parseStored(readRaw(SEEN_KEY), {} as Record<string, boolean>, validateSeen);
  writeRaw(SEEN_KEY, JSON.stringify({ ...seen, [id]: true }));
}
