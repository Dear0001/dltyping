import { codepoints, normalizeKhmer, splitGraphemes } from "@/lib/khmer-unicode";
import type { Language } from "@/types";

export function getTypingStats(target: string, input: string, elapsedSeconds: number) {
  const chars = Array.from(input);
  const goal = Array.from(target);
  let correct = 0;
  let errors = 0;
  chars.forEach((char, index) => (char === goal[index] ? correct++ : errors++));
  const minutes = Math.max(elapsedSeconds, 1) / 60;
  return {
    wpm: Math.round(correct / 5 / minutes),
    accuracy: chars.length ? Math.round((correct / chars.length) * 100) : 100,
    errors,
    correct,
    typed: chars.length,
    progress: goal.length ? Math.min(100, Math.round((chars.length / goal.length) * 100)) : 0,
  };
}

/** Standard WPM: five characters count as one word. */
export function calcWpm(correctChars: number, elapsedMs: number) {
  if (elapsedMs < 1000) return 0;
  return Math.round(correctChars / 5 / (elapsedMs / 60000));
}

export function calcAccuracy(correctKeys: number, totalKeys: number) {
  return totalKeys ? Math.round((correctKeys / totalKeys) * 100) : 100;
}

/** Normalize text for comparison in the given language. */
export function normalizeText(value: string, language: Language) {
  return language === "khmer" ? normalizeKhmer(value) : value;
}

export function isSameText(a: string, b: string, language: Language) {
  return normalizeText(a, language) === normalizeText(b, language);
}

export type CharState = "correct" | "wrong" | "partial" | "current" | "pending";
export type CharView = { text: string; state: CharState };

/**
 * Per-character feedback for `target` given the code points typed so far.
 * Feedback is computed per grapheme cluster, so a Khmer syllable built from
 * several keystrokes is one visible unit: "partial" while it is being typed,
 * "correct" once complete, "wrong" if any of its keystrokes mismatch.
 */
export function getCharStates(target: string, typed: readonly string[], language: Language): CharView[] {
  const clusters = language === "khmer" ? splitGraphemes(target) : codepoints(target);
  const goal = codepoints(normalizeText(target, language));
  let offset = 0;
  let cursorPlaced = false;
  return clusters.map((text) => {
    const length = codepoints(text).length;
    const start = offset;
    const end = offset + length;
    offset = end;
    if (typed.length <= start) {
      if (!cursorPlaced && typed.length === start) {
        cursorPlaced = true;
        return { text, state: "current" as const };
      }
      return { text, state: "pending" as const };
    }
    const slice = typed.slice(start, end);
    if (slice.some((cp, i) => cp !== goal[start + i])) return { text, state: "wrong" as const };
    if (typed.length >= end) return { text, state: "correct" as const };
    cursorPlaced = true;
    return { text, state: "partial" as const };
  });
}

export type TypingScore = {
  /**
   * Correct characters for WPM. English: correct letters. Khmer: the keystrokes
   * (code points) of clusters that are COMPLETE and fully correct, so a half-typed
   * syllable or one with a wrong subscript earns nothing. Five per word either way.
   */
  correct: number;
  /** Visible characters (Khmer: grapheme clusters) fully typed, right or wrong. Basis for progress. */
  done: number;
  /** Visible characters (Khmer: grapheme clusters) in the text. */
  total: number;
  /** One entry per visible character typed wrong (a whole Khmer cluster, never a lone sign). */
  mistakes: { index: number; expected: string; typed: string }[];
};

/**
 * Cluster-aware score of `typed` (normalized code points) against `target`.
 * Code points are still compared one by one, but credit, progress and mistakes
 * are given per user-perceived character, so Khmer is not judged as loose
 * vowels, COENG signs and subscripts.
 */
export function scoreTyping(target: string, typed: readonly string[], language: Language): TypingScore {
  const goal = codepoints(normalizeText(target, language));
  const clusters = language === "khmer" ? splitGraphemes(target) : goal;
  const score: TypingScore = { correct: 0, done: 0, total: clusters.length, mistakes: [] };
  let start = 0;
  clusters.forEach((text, index) => {
    const end = start + codepoints(text).length;
    if (typed.length > start) {
      const complete = typed.length >= end;
      const slice = typed.slice(start, end);
      const ok = slice.every((cp, i) => cp === goal[start + i]);
      if (complete) score.done++;
      if (complete && ok) score.correct += end - start;
      else if (!ok) score.mistakes.push({ index, expected: text, typed: slice.join("") });
    }
    start = end;
  });
  return score;
}
