// Turns a finished practice session into the results screen: comparisons with the learner's own
// history, highlight badges and one line of feedback. Pure (no storage access) so it can be tested;
// the caller reads the history *before* the session is saved, so comparisons never include itself.
import { dayKey, isQualifyingSession, QUALIFYING_MIN_CORRECT } from "@/lib/progress/progress-analytics";
import type { Language } from "@/types";
import type { ActivityType, SessionRecord } from "@/types/progress";

/** Activities whose speed is comparable with lesson practice (games use different text and rules). */
const COMPARABLE: readonly ActivityType[] = ["lesson", "typing-test", "drill"];
/** How many earlier sessions make the "recent average" a result is compared with. */
export const RECENT_WINDOW = 5;
/** A change smaller than this is noise, not an improvement. */
const MIN_GAIN = 2;

export type PracticeHistory = {
  /** Best lesson-practice WPM/accuracy before this session (null on the first one). */
  best: { wpm: number; accuracy: number } | null;
  /** Average of the last few comparable sessions in this language (null when there are none). */
  recent: { wpm: number; accuracy: number; count: number } | null;
  /** A session earlier today already counted today as a practice day. */
  dayAlreadyCounted: boolean;
};

export function practiceHistory(sessions: readonly SessionRecord[], language: Language, best: { bestWpm: number; bestAccuracy: number } | undefined, now: number): PracticeHistory {
  const same = sessions.filter((s) => s.language === language && COMPARABLE.includes(s.activity) && s.correct >= QUALIFYING_MIN_CORRECT).slice(-RECENT_WINDOW);
  const today = dayKey(now);
  return {
    best: best && best.bestWpm > 0 ? { wpm: best.bestWpm, accuracy: best.bestAccuracy } : null,
    recent: same.length ? { wpm: Math.round(same.reduce((n, s) => n + s.wpm, 0) / same.length), accuracy: Math.round(same.reduce((n, s) => n + s.accuracy, 0) / same.length), count: same.length } : null,
    dayAlreadyCounted: sessions.some((s) => isQualifyingSession(s) && dayKey(Date.parse(s.completedAt)) === today),
  };
}

export type PracticeHighlight = "new-best" | "first-result" | "speed-up" | "accuracy-up" | "lesson-done" | "day-counted";
export type PracticeFeedback = "too-short" | "slow-down" | "accuracy-first" | "excellent" | "steady";

export type PracticeOutcome = {
  highlights: PracticeHighlight[];
  feedback: PracticeFeedback;
  /** Difference from the previous best WPM (null without one). */
  bestDelta: number | null;
  /** This session alone makes today a practice day for the streak. */
  qualifies: boolean;
};

export function practiceOutcome(result: { wpm: number; accuracy: number; correct: number; lessonDone: boolean; comparable: boolean }, history: PracticeHistory): PracticeOutcome {
  const qualifies = result.correct >= QUALIFYING_MIN_CORRECT;
  const highlights: PracticeHighlight[] = [];
  if (result.lessonDone) highlights.push("lesson-done");
  // Drills use made-up text, so they never claim a personal best.
  if (result.comparable && qualifies) {
    if (!history.best) highlights.push("first-result");
    else if (result.wpm > history.best.wpm) highlights.push("new-best");
  }
  if (qualifies && history.recent) {
    if (result.wpm >= history.recent.wpm + MIN_GAIN && !highlights.includes("new-best")) highlights.push("speed-up");
    if (result.accuracy >= history.recent.accuracy + MIN_GAIN) highlights.push("accuracy-up");
  }
  if (qualifies && !history.dayAlreadyCounted) highlights.push("day-counted");

  let feedback: PracticeFeedback;
  if (!qualifies) feedback = "too-short";
  else if (result.accuracy < 85) feedback = "slow-down";
  else if (result.accuracy < 93) feedback = "accuracy-first";
  else if (result.accuracy >= 97 && (!history.recent || result.wpm >= history.recent.wpm)) feedback = "excellent";
  else feedback = "steady";

  return { highlights, feedback, bestDelta: history.best ? result.wpm - history.best.wpm : null, qualifies };
}
