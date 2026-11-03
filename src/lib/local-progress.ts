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
/** Level book storage key; Mario Khmer Quest keeps its original key so existing progress survives. */
export const levelsKeyFor = (gameId: string) => (gameId === "mario-khmer-quest" ? LEVELS_KEY : `dlt.${gameId}.levels`);

export function validateLevels(value: unknown): LevelBook | null {
  if (!isRecord(value)) return null;
  const book: LevelBook = {};
  for (const [key, entry] of Object.entries(value)) {
    if (isRecord(entry) && typeof entry.stars === "number" && typeof entry.score === "number") book[key] = { stars: entry.stars, score: entry.score };
  }
  return book;
}

export function recordLevel(level: number, result: LevelResult, gameId = "mario-khmer-quest") {
  const key = levelsKeyFor(gameId);
  const book = parseStored(readRaw(key), {} as LevelBook, validateLevels);
  const previous = book[level];
  book[level] = { stars: Math.max(previous?.stars ?? 0, result.stars), score: Math.max(previous?.score ?? 0, result.score) };
  writeRaw(key, JSON.stringify(book));
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

// ---- User progress (XP, lesson completion, streak) -----------------------
import type { UserProgressData } from "@/types";
import { emitPetEvent } from "@/lib/pets/pet-events";

export const USER_PROGRESS_KEY = "dlt.userProgress";

const today = () => new Date().toISOString().slice(0, 10);

export const DEFAULT_USER_PROGRESS: UserProgressData = {
  xp: 0,
  completedLessons: {},
  streak: 0,
  lastActiveDate: "",
  achievements: [],
};

export function validateUserProgress(value: unknown): UserProgressData | null {
  if (!isRecord(value)) return null;
  const num = (n: unknown) => (typeof n === "number" && Number.isFinite(n) && n >= 0 ? n : 0);
  const str = (s: unknown) => (typeof s === "string" ? s : "");
  const boolMap = (m: unknown): Record<string, boolean> => {
    if (!isRecord(m)) return {};
    return Object.fromEntries(Object.entries(m).filter(([, v]) => v === true).map(([k]) => [k, true as boolean]));
  };
  const strArr = (a: unknown): string[] => (Array.isArray(a) ? a.filter((x): x is string => typeof x === "string") : []);
  return {
    xp: num(value.xp),
    completedLessons: boolMap(value.completedLessons),
    streak: num(value.streak),
    lastActiveDate: str(value.lastActiveDate),
    achievements: strArr(value.achievements),
  };
}

export function readUserProgress(): UserProgressData {
  return parseStored(readRaw(USER_PROGRESS_KEY), DEFAULT_USER_PROGRESS, validateUserProgress);
}

/** Mark a lesson complete and award XP. Returns the updated progress. */
export function completeLesson(language: string, lessonId: string, xpReward: number): UserProgressData {
  const progress = readUserProgress();
  const key = `${language}:${lessonId}`;
  const alreadyDone = progress.completedLessons[key];

  // Update streak
  const todayDate = today();
  let { streak } = progress;
  if (progress.lastActiveDate !== todayDate) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    streak = progress.lastActiveDate === yesterday ? streak + 1 : 1;
  }

  const updated: UserProgressData = {
    ...progress,
    xp: alreadyDone ? progress.xp : progress.xp + xpReward,
    completedLessons: { ...progress.completedLessons, [key]: true },
    streak,
    lastActiveDate: todayDate,
  };
  writeRaw(USER_PROGRESS_KEY, JSON.stringify(updated));
  if (!alreadyDone) emitPetEvent({ type: "celebrate" });
  return updated;
}

export function addAchievement(id: string): void {
  const progress = readUserProgress();
  if (progress.achievements.includes(id)) return;
  writeRaw(USER_PROGRESS_KEY, JSON.stringify({ ...progress, achievements: [...progress.achievements, id] }));
}

export function xpForLevel(level: number) {
  // Level 1=0, 2=200, 3=500, 4=1000, 5=1700, 6=2500
  const thresholds = [0, 200, 500, 1000, 1700, 2500];
  return thresholds[Math.min(level - 1, thresholds.length - 1)] ?? 0;
}

export function levelFromXp(xp: number): number {
  const thresholds = [0, 200, 500, 1000, 1700, 2500];
  let level = 1;
  for (let i = 0; i < thresholds.length; i++) {
    if (xp >= thresholds[i]) level = i + 1;
  }
  return level;
}

export const LEVEL_TITLES: Record<number, string> = {
  1: "Novice Typist",
  2: "Beginner Typist",
  3: "Capable Typist",
  4: "Fluent Typist",
  5: "Expert Typist",
  6: "Master Typist",
};
