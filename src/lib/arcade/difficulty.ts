import type { Difficulty } from "@/lib/game-engine";
import type { Language } from "@/types";

/** The arcade games add an Expert tier on top of the three classic difficulties. */
export type ArcadeDifficulty = Difficulty | "expert";
export const ARCADE_DIFFICULTIES: readonly ArcadeDifficulty[] = ["easy", "medium", "hard", "expert"];
export const DIFFICULTY_INDEX: Record<ArcadeDifficulty, number> = { easy: 0, medium: 1, hard: 2, expert: 3 };

/** Score multiplier applied by the scoring engine. */
export const SCORE_MULTIPLIER: Record<ArcadeDifficulty, number> = { easy: 1, medium: 1.5, hard: 2, expert: 3 };

export const isArcadeDifficulty = (value: unknown): value is ArcadeDifficulty => ARCADE_DIFFICULTIES.includes(value as ArcadeDifficulty);

/** The dashboard's session log only knows three tiers; Expert is stored as Hard there (plus a detail label). */
export const baseDifficulty = (difficulty: ArcadeDifficulty): Difficulty => (difficulty === "expert" ? "hard" : difficulty);

/** Khmer needs more keystrokes per syllable, so computer opponents and speed thresholds are scaled down. */
export const languagePace = (language: Language) => (language === "khmer" ? 0.7 : 1);

/** Picks the value for a difficulty from a 4-item tuple (easy, medium, hard, expert). */
export const byDifficulty = <T>(difficulty: ArcadeDifficulty, values: readonly [T, T, T, T]): T => values[DIFFICULTY_INDEX[difficulty]];
