import { SCORE_MULTIPLIER, type ArcadeDifficulty } from "@/lib/arcade/difficulty";

export type ScoreInput = {
  /** Points from the game's own rules (distance, kills, enemies defeated…). */
  base: number;
  accuracy: number;
  wpm: number;
  bestStreak: number;
  difficulty: ArcadeDifficulty;
};

export type ScoreBreakdown = { base: number; accuracyBonus: number; speedBonus: number; comboBonus: number; multiplier: number; total: number };

/** Share of the base score added for clean typing. */
export function accuracyRate(accuracy: number) {
  if (accuracy >= 98) return 0.3;
  if (accuracy >= 95) return 0.2;
  if (accuracy >= 90) return 0.1;
  return 0;
}

/** One scoring rule for every arcade game: base + accuracy + speed + streak bonuses, times the difficulty multiplier. */
export function scoreBreakdown(input: ScoreInput): ScoreBreakdown {
  const base = Math.max(0, Math.round(input.base));
  const accuracyBonus = Math.round(base * accuracyRate(input.accuracy));
  const speedBonus = Math.round(Math.max(0, Math.min(input.wpm, 200)) * 5);
  const comboBonus = Math.round(Math.max(0, Math.min(input.bestStreak, 200)) * 3);
  const multiplier = SCORE_MULTIPLIER[input.difficulty];
  // A run with no points earns nothing from bonuses alone.
  const total = base === 0 ? 0 : Math.round((base + accuracyBonus + speedBonus + comboBonus) * multiplier);
  return { base, accuracyBonus, speedBonus, comboBonus, multiplier, total };
}

/** Experience for a finished run: grows with the score, with a small reward just for finishing. */
export function xpForResult(score: number, won: boolean) {
  return Math.max(5, Math.min(300, Math.round(score / 40) + (won ? 20 : 0)));
}

/** Arcade level from total XP: level n needs 100·(n−1)² XP. */
export const levelFromArcadeXp = (xp: number) => Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1;
export const xpForArcadeLevel = (level: number) => 100 * (level - 1) ** 2;
