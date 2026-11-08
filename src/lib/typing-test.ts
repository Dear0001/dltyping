import { wordBanks } from "@/data/game-content";
import { nextSeed, randomFloat, type Difficulty } from "@/lib/game-engine";
import { parseStored, readRaw, writeRaw } from "@/lib/local-progress";
import type { Language } from "@/types";

/** Test lengths offered on /test, in seconds. */
export const TEST_DURATIONS = [15, 30, 60, 120] as const;
export type TestDuration = (typeof TEST_DURATIONS)[number];
export const DEFAULT_TEST_DURATION: TestDuration = 60;

/** Words a test needs so even a very fast typist never runs out: 220 WPM for the whole duration. */
export const wordsNeeded = (durationSec: number) => Math.max(30, Math.ceil((220 * durationSec) / 60));

/**
 * A run of random words from the word banks. Deterministic for a seed (no Math.random),
 * so the same seed always gives the same text: the daily challenge relies on this.
 * "mixed" draws from every difficulty.
 */
export function buildWordText(language: Language, difficulty: Difficulty | "mixed", count: number, seed: number): string {
  const banks = wordBanks[language];
  const pool = difficulty === "mixed" ? [...banks.easy, ...banks.medium, ...banks.hard] : banks[difficulty];
  const words: string[] = [];
  let s = seed >>> 0;
  for (let i = 0; i < count; i++) {
    s = nextSeed(s);
    let word = pool[Math.floor(randomFloat(s) * pool.length)];
    // Never the same word twice in a row.
    if (pool.length > 1 && word === words[i - 1]) word = pool[(pool.indexOf(word) + 1) % pool.length];
    words.push(word);
  }
  return words.join(" ");
}

/** One second-by-second snapshot of a run, used for the speed chart and consistency. */
/** `chars` is every character typed so far (right or wrong). */
export type RunSample = { second: number; wpm: number; raw: number; errors: number; chars: number };

export type RunResult = {
  language: Language;
  durationSec: number;
  wpm: number;
  /** Speed counting every typed character, right or wrong. */
  rawWpm: number;
  accuracy: number;
  correct: number;
  errors: number;
  samples: RunSample[];
};

/**
 * How steady the pace was, 0-100: 100 minus the coefficient of variation of the
 * per-second speed. Uses per-second deltas, not the running average (which smooths everything).
 */
export function consistency(samples: readonly RunSample[]): number {
  const speeds: number[] = [];
  for (let i = 0; i < samples.length; i++) {
    const prev = i ? samples[i - 1] : { second: 0, chars: 0 };
    const seconds = samples[i].second - prev.second;
    if (seconds <= 0) continue;
    const chars = samples[i].chars - prev.chars;
    speeds.push(Math.max(0, (chars / 5) * (60 / seconds)));
  }
  if (speeds.length < 2) return 100;
  const mean = speeds.reduce((a, b) => a + b, 0) / speeds.length;
  if (mean === 0) return 0;
  const sd = Math.sqrt(speeds.reduce((a, b) => a + (b - mean) ** 2, 0) / speeds.length);
  return Math.max(0, Math.min(100, Math.round(100 - (sd / mean) * 100)));
}

// ---- Personal bests ---------------------------------------------------------
export type TestBest = { wpm: number; accuracy: number; at: string };
export type TestBestBook = Record<string, TestBest>;
export const TEST_BESTS_KEY = "dlt.tests.v1";
export const EMPTY_BESTS: TestBestBook = {};
export const bestKey = (language: Language, durationSec: number) => `${language}:${durationSec}`;

export function validateBests(value: unknown): TestBestBook | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const out: TestBestBook = {};
  for (const [key, raw] of Object.entries(value)) {
    if (typeof raw !== "object" || raw === null) continue;
    const { wpm, accuracy, at } = raw as Record<string, unknown>;
    if (typeof wpm === "number" && Number.isFinite(wpm) && typeof accuracy === "number" && Number.isFinite(accuracy) && typeof at === "string") {
      out[key] = { wpm: Math.max(0, Math.min(400, wpm)), accuracy: Math.max(0, Math.min(100, accuracy)), at };
    }
  }
  return out;
}

/** Minimum accuracy for a result to count as a personal best, so mashing keys cannot set a record. */
export const BEST_MIN_ACCURACY = 80;

/** Saves the result if it beats the stored best for its language and length. Returns the previous best and whether it was beaten. */
export function saveBest(result: Pick<RunResult, "language" | "durationSec" | "wpm" | "accuracy">, at: string): { previous: TestBest | null; isBest: boolean } {
  const book = parseStored(readRaw(TEST_BESTS_KEY), EMPTY_BESTS, validateBests);
  const key = bestKey(result.language, result.durationSec);
  const previous = book[key] ?? null;
  const isBest = result.accuracy >= BEST_MIN_ACCURACY && result.wpm > 0 && (!previous || result.wpm > previous.wpm);
  if (isBest) writeRaw(TEST_BESTS_KEY, JSON.stringify({ ...book, [key]: { wpm: result.wpm, accuracy: result.accuracy, at } }));
  return { previous, isBest };
}
