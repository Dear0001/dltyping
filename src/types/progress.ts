import type { Difficulty } from "@/lib/game-engine";
import type { Language } from "@/types";

/** Every kind of finished activity that feeds the dashboard. Add new ones here (and in ACTIVITY_META). */
export const ACTIVITY_TYPES = [
  "lesson",
  "typing-test",
  "drill",
  "letter-jump",
  "word-sprint",
  "sentence-rush",
  "mario-khmer-quest",
  "english-quest",
  "car-racing",
  "zombie-survival",
  "battle-arena",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export type KeyboardLayoutId = "english-qwerty" | "khmer-nida";

/** One finished session. Contains aggregate numbers only, never what was typed. */
export type SessionRecord = {
  id: string;
  activity: ActivityType;
  language: Language;
  durationSec: number;
  wpm: number;
  /** 0-100 */
  accuracy: number;
  correct: number;
  incorrect: number;
  score: number | null;
  difficulty: Difficulty | null;
  layout: KeyboardLayoutId;
  /** ISO timestamp */
  completedAt: string;
  /** Short human label, e.g. a lesson title or "Level 3". */
  detail?: string;
  /** Stars (1-3) earned by clearing a game level. Worth that many streak points for the day. */
  stars?: 1 | 2 | 3;
  /** The whole curriculum lesson was completed in this session (bonus streak point for the day). */
  lessonDone?: true;
};

export type Tally = { n: number; c: number };

/**
 * Performance of one physical key (KeyboardEvent.code) in one language layout.
 * `chars` splits the same key by the character it produced, so Khmer base and
 * Shift layers (and English `a` vs `A`) stay distinguishable.
 */
export type KeyRecord = Tally & {
  /** epoch ms of the last practice */
  last: number;
  chars: Record<string, Tally>;
};

export type WordRecord = { n: number; e: number };

export const PROGRESS_SCHEMA_VERSION = 1;

export type ProgressStore = {
  version: typeof PROGRESS_SCHEMA_VERSION;
  sessions: SessionRecord[];
  /** `${language}:${code}` -> record */
  keys: Record<string, KeyRecord>;
  /** `${language}:${a}${b}` -> attempts of typing b right after a */
  pairs: Record<string, Tally>;
  /** `${language}:${word}` -> attempts and misspellings */
  words: Record<string, WordRecord>;
};

export type SessionInput = {
  activity: ActivityType;
  language: Language;
  durationSec: number;
  correct: number;
  incorrect: number;
  score?: number | null;
  difficulty?: Difficulty | null;
  detail?: string;
  stars?: number;
  lessonDone?: boolean;
  /** Overrides the computed value (e.g. games that already know it). */
  wpm?: number;
  accuracy?: number;
};

/** In-memory per-session accumulation of key, pair and word performance. */
export type SessionTally = {
  keys: Record<string, KeyRecord>;
  pairs: Record<string, Tally>;
  words: Record<string, WordRecord>;
  prev: { language: Language; char: string; ok: boolean } | null;
};
