import { ACTIVITY_META, QUALIFYING_MIN_CORRECT } from "@/lib/progress/progress-analytics";
import type { SessionRecord } from "@/types/progress";

/**
 * Streak levels 1-20. A finished session unlocks level N when it meets all of that level's
 * limits: speed (WPM) at least, accuracy at least, errors at most. Every level also needs the
 * usual 10+ correct characters, so a few lucky keystrokes never count. Levels only get harder,
 * so a session that clears level N also clears every level below it.
 */
export const STREAK_LEVEL_COUNT = 20;

export type StreakLevel = { level: number; minWpm: number; minAccuracy: number; maxErrors: number };

const lerp = (from: number, to: number, step: number) => Math.round(from + ((to - from) * (step - 1)) / (STREAK_LEVEL_COUNT - 1));

export const STREAK_LEVELS: StreakLevel[] = Array.from({ length: STREAK_LEVEL_COUNT }, (_, i) => {
  const level = i + 1;
  return { level, minWpm: lerp(3, 45, level), minAccuracy: lerp(60, 95, level), maxErrors: lerp(30, 3, level) };
});

export function meetsLevel(s: SessionRecord, l: StreakLevel): boolean {
  return s.correct >= QUALIFYING_MIN_CORRECT && s.wpm >= l.minWpm && s.accuracy >= l.minAccuracy && s.incorrect <= l.maxErrors;
}

/** Highest level this one session reaches (0 = none). */
export function sessionLevel(s: SessionRecord): number {
  let best = 0;
  for (const l of STREAK_LEVELS) if (meetsLevel(s, l)) best = l.level;
  return best;
}

export type LevelStatus = StreakLevel & { unlocked: boolean; by: string | null; activity: SessionRecord["activity"] | null; at: string | null };

/** Per-level status over every saved session; `by` names the first course/practice that unlocked it. */
export function levelStatuses(sessions: SessionRecord[]): LevelStatus[] {
  const ordered = [...sessions].sort((a, b) => Date.parse(a.completedAt) - Date.parse(b.completedAt));
  return STREAK_LEVELS.map((l) => {
    const hit = ordered.find((s) => meetsLevel(s, l));
    return { ...l, unlocked: !!hit, by: hit ? ACTIVITY_META[hit.activity].label : null, activity: hit ? hit.activity : null, at: hit ? hit.completedAt : null };
  });
}

export const currentStreakLevel = (sessions: SessionRecord[]) => sessions.reduce((best, s) => Math.max(best, sessionLevel(s)), 0);
