// Shared typing engine for the arcade games. Pure and framework-free so the
// game simulations (and their tests) can use it without React.
//
// Text is validated one Unicode code point at a time (one per keystroke), never
// by UTF-16 unit, and displayed per grapheme cluster through getCharStates(), so
// a Khmer syllable built from several keystrokes is one visible unit.
import { codepoints } from "@/lib/khmer-unicode";
import { calcAccuracy, calcWpm, getCharStates, normalizeText, type CharView } from "@/lib/typing-engine";
import type { Language } from "@/types";

/**
 * - strict: a wrong key is counted but not inserted; the cursor waits for the right key.
 * - free: wrong keys are inserted and must be removed with Backspace before the text can complete.
 */
export type TypingMode = "strict" | "free";

export type TypeBuffer = {
  text: string;
  language: Language;
  mode: TypingMode;
  /** Expected code points. */
  goal: string[];
  /** Code points typed so far. */
  typed: string[];
  /** Wrong keys pressed on this text. */
  mistakes: number;
  /** Game clock (ms) of the first key, for per-text speed. */
  startedAt: number | null;
};

export type TypingStats = {
  totalKeys: number;
  correctKeys: number;
  /** Correct characters currently standing (correct keys minus corrected ones). Basis for WPM. */
  netChars: number;
  backspaces: number;
  /** Consecutive correct keystrokes. */
  streak: number;
  bestStreak: number;
};

export type KeyResult = "correct" | "wrong" | "complete" | "blocked";

export const createStats = (): TypingStats => ({ totalKeys: 0, correctKeys: 0, netChars: 0, backspaces: 0, streak: 0, bestStreak: 0 });

export function createBuffer(text: string, language: Language, mode: TypingMode = "strict"): TypeBuffer {
  const clean = normalizeText(text, language);
  return { text: clean, language, mode, goal: codepoints(clean), typed: [], mistakes: 0, startedAt: null };
}

export const expectedChar = (buffer: TypeBuffer): string | null => buffer.goal[buffer.typed.length] ?? null;
export const firstChar = (buffer: TypeBuffer): string => buffer.goal[0] ?? "";
export const isComplete = (buffer: TypeBuffer) => buffer.typed.length === buffer.goal.length && buffer.typed.every((cp, i) => cp === buffer.goal[i]);
export const bufferProgress = (buffer: TypeBuffer) => (buffer.goal.length ? correctPrefix(buffer) / buffer.goal.length : 0);
export const bufferView = (buffer: TypeBuffer): CharView[] => getCharStates(buffer.text, buffer.typed, buffer.language);

/** Number of leading code points that are typed correctly. */
export function correctPrefix(buffer: TypeBuffer) {
  let n = 0;
  while (n < buffer.typed.length && buffer.typed[n] === buffer.goal[n]) n++;
  return n;
}

/** Counts a keystroke that did not belong to any text (e.g. no target starts with that letter). */
export function countStray(stats: TypingStats) {
  stats.totalKeys++;
  stats.streak = 0;
}

/** Applies one typed code point. Mutates the buffer and the stats. */
export function typeChar(buffer: TypeBuffer, char: string, stats: TypingStats, now = 0): KeyResult {
  if (buffer.typed.length >= buffer.goal.length) return "blocked"; // full: only Backspace helps (free mode)
  if (buffer.startedAt === null) buffer.startedAt = now;
  const ok = char === buffer.goal[buffer.typed.length];
  stats.totalKeys++;
  if (!ok) {
    buffer.mistakes++;
    stats.streak = 0;
    if (buffer.mode === "free") buffer.typed.push(char);
    return "wrong";
  }
  buffer.typed.push(char);
  stats.correctKeys++;
  // In free mode a correct key after a standing mistake does not count until the mistake is fixed.
  const clean = buffer.mode === "strict" || correctPrefix(buffer) === buffer.typed.length;
  if (clean) {
    stats.netChars++;
    stats.streak++;
    if (stats.streak > stats.bestStreak) stats.bestStreak = stats.streak;
  }
  return isComplete(buffer) ? "complete" : "correct";
}

/** Removes the last typed code point. Returns false when there was nothing to remove. */
export function backspace(buffer: TypeBuffer, stats: TypingStats): boolean {
  if (!buffer.typed.length) return false;
  const wasClean = correctPrefix(buffer) === buffer.typed.length;
  buffer.typed.pop();
  stats.backspaces++;
  if (wasClean) stats.netChars = Math.max(0, stats.netChars - 1);
  return true;
}

/** Clears what was typed on a text the player walked away from (its standing correct characters no longer count). */
export function resetBuffer(buffer: TypeBuffer, stats: TypingStats) {
  stats.netChars = Math.max(0, stats.netChars - correctPrefix(buffer));
  buffer.typed = [];
  buffer.startedAt = null;
}

/** Characters per second on a finished text. */
export function bufferSpeed(buffer: TypeBuffer, now: number) {
  if (buffer.startedAt === null) return 0;
  const seconds = Math.max(0.2, (now - buffer.startedAt) / 1000);
  return buffer.goal.length / seconds;
}

export type TypingSummary = { wpm: number; cpm: number; accuracy: number; mistakes: number; correctChars: number; totalKeys: number; bestStreak: number };

export function summarize(stats: TypingStats, elapsedMs: number): TypingSummary {
  return {
    wpm: calcWpm(stats.netChars, elapsedMs),
    cpm: elapsedMs < 1000 ? 0 : Math.round(stats.netChars / (elapsedMs / 60000)),
    accuracy: calcAccuracy(stats.correctKeys, stats.totalKeys),
    mistakes: stats.totalKeys - stats.correctKeys,
    correctChars: stats.netChars,
    totalKeys: stats.totalKeys,
    bestStreak: stats.bestStreak,
  };
}
