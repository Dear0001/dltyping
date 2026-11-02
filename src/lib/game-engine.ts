import type { Language } from "@/types";

export type Difficulty = "easy" | "medium" | "hard";
export type GameStatus = "idle" | "playing" | "paused" | "finished";

/** Per-difficulty tuning shared by the games. */
export const DIFFICULTY_RULES: Record<Difficulty, { mistakesPerLife: number; targetMs: number; timeFactor: number }> = {
  easy: { mistakesPerLife: 3, targetMs: 7000, timeFactor: 1.4 },
  medium: { mistakesPerLife: 2, targetMs: 4500, timeFactor: 1 },
  hard: { mistakesPerLife: 1, targetMs: 3200, timeFactor: 0.75 },
};

export const LIVES = 3;

/** Combo multiplier: +0.5x every 5 correct units in a row, capped at 3x. */
export function comboMultiplier(combo: number) {
  return Math.min(3, 1 + Math.floor(combo / 5) * 0.5);
}

export function unitScore(base: number, combo: number) {
  return Math.round(base * comboMultiplier(combo));
}

/** Apply one mistake; a life is lost every `perLife` mistakes. */
export function applyMistake(lives: number, counter: number, perLife: number) {
  const next = counter + 1;
  return next >= perLife ? { lives: lives - 1, counter: 0 } : { lives, counter: next };
}

// Small deterministic PRNG so reducers stay pure (the seed lives in state).
export function nextSeed(seed: number) {
  return (seed + 0x6d2b79f5) >>> 0;
}
export function randomFloat(seed: number) {
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
export function pick<T>(pool: readonly T[], seed: number, avoid?: T): { value: T; seed: number } {
  let s = nextSeed(seed);
  let value = pool[Math.floor(randomFloat(s) * pool.length)];
  if (pool.length > 1 && value === avoid) {
    s = nextSeed(s);
    value = pool[Math.floor(randomFloat(s) * pool.length)];
    if (value === avoid) value = pool[(pool.indexOf(value) + 1) % pool.length];
  }
  return { value, seed: s };
}
export function shuffled<T>(pool: readonly T[], seed: number): { value: T[]; seed: number } {
  const out = [...pool];
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    s = nextSeed(s);
    const j = Math.floor(randomFloat(s) * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return { value: out, seed: s };
}

export function starsFor(accuracy: number, livesLeft: number) {
  if (accuracy >= 95 && livesLeft >= 3) return 3;
  if (accuracy >= 85) return 2;
  return 1;
}

export function formatClock(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

export const languageLabel = (language: Language) => (language === "khmer" ? "Khmer" : "English");
