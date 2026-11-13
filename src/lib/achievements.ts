// Learner achievements, grouped by category, computed only from saved data (sessions, lesson completions, XP and
// arcade history). Nothing is stored: an achievement is unlocked whenever the data meets it, so it can never be
// awarded twice and always matches what the learner actually did. Titles and descriptions are `achv.<id>.t/.d`;
// the original XP/lesson achievements keep their ids and `ach.<id>.*` strings.
import { isGame, isQualifyingSession, dayKey } from "@/lib/progress/progress-analytics";
import { ACTIVITY_TYPES, type SessionRecord } from "@/types/progress";
import type { Language } from "@/types";

export const ACHIEVEMENT_CATEGORIES = ["speed", "accuracy", "consistency", "learning", "gaming"] as const;
export type AchievementCategory = (typeof ACHIEVEMENT_CATEGORIES)[number];

export type AchievementData = {
  sessions: readonly SessionRecord[];
  xp: number;
  completedLessons: Record<string, boolean>;
  lessonTotals: Record<Language, number>;
  /** Arcade badges earned so far, and how many exist. */
  arcadeBadges: { earned: number; total: number };
};

export type AchievementDef = {
  id: string;
  category: AchievementCategory;
  icon: string;
  target: number;
  /** Shown after the number, e.g. "WPM" or "%". */
  unit?: string;
  /** Strings live under `ach.<id>` instead of `achv.<id>` (achievements that existed before categories). */
  legacy?: true;
  value: (d: AchievementData) => number;
};

/** A run must be at least this long (correct characters) before its speed or accuracy counts, so a lucky few keys never do. */
export const MIN_RUN_CHARS = 50;
const PRACTICE = new Set(["lesson", "typing-test", "drill"]);
const practice = (d: AchievementData, language?: Language) => d.sessions.filter((s) => PRACTICE.has(s.activity) && s.correct >= MIN_RUN_CHARS && (!language || s.language === language));
/** Speed only counts at a reasonable accuracy, otherwise mashing keys would earn it. */
const bestWpm = (d: AchievementData, language?: Language) => practice(d, language).filter((s) => s.accuracy >= 85).reduce((m, s) => Math.max(m, s.wpm), 0);
const bestAccuracy = (d: AchievementData, minChars: number) => d.sessions.filter((s) => PRACTICE.has(s.activity) && s.correct >= minChars).reduce((m, s) => Math.max(m, s.accuracy), 0);
const lessonsIn = (d: AchievementData, language: Language) => Object.keys(d.completedLessons).filter((k) => k.startsWith(`${language}:`)).length;
const gameRuns = (d: AchievementData) => d.sessions.filter((s) => isGame(s.activity) && s.correct > 0);

/** Distinct local days with a finished practice session. Legacy visit/welcome days are not counted here. */
export function practiceDayKeys(sessions: readonly SessionRecord[]): string[] {
  return [...new Set(sessions.filter(isQualifyingSession).map((s) => dayKey(Date.parse(s.completedAt))))].sort();
}

/** Longest run of consecutive calendar days with practice. */
export function longestDayRun(sessions: readonly SessionRecord[]): number {
  const days = practiceDayKeys(sessions).map((k) => {
    const [y, m, d] = k.split("-").map(Number);
    return Date.UTC(y, m - 1, d) / 86_400_000;
  });
  let best = 0, run = 0;
  days.forEach((day, i) => {
    run = i > 0 && day - days[i - 1] === 1 ? run + 1 : 1;
    best = Math.max(best, run);
  });
  return best;
}

const GAME_COUNT = ACTIVITY_TYPES.filter((a) => isGame(a)).length;

export const ACHIEVEMENTS: readonly AchievementDef[] = [
  // Speed
  { id: "speed-20", category: "speed", icon: "🐢", target: 20, unit: "WPM", value: (d) => bestWpm(d) },
  { id: "speed-40", category: "speed", icon: "🐇", target: 40, unit: "WPM", value: (d) => bestWpm(d) },
  { id: "speed-60", category: "speed", icon: "🚀", target: 60, unit: "WPM", value: (d) => bestWpm(d) },
  { id: "speed-khmer-25", category: "speed", icon: "⌨️", target: 25, unit: "WPM", value: (d) => bestWpm(d, "khmer") },
  // Accuracy
  { id: "acc-95", category: "accuracy", icon: "🎯", target: 95, unit: "%", value: (d) => bestAccuracy(d, 100) },
  { id: "acc-100", category: "accuracy", icon: "💎", target: 100, unit: "%", value: (d) => bestAccuracy(d, 100) },
  { id: "acc-habit", category: "accuracy", icon: "🧘", target: 10, value: (d) => practice(d).filter((s) => s.accuracy >= 95).length },
  // Consistency
  { id: "on-a-roll", category: "consistency", icon: "🔥", target: 3, legacy: true, value: (d) => longestDayRun(d.sessions) },
  { id: "unstoppable", category: "consistency", icon: "⚡", target: 7, legacy: true, value: (d) => longestDayRun(d.sessions) },
  { id: "days-30", category: "consistency", icon: "📅", target: 30, value: (d) => practiceDayKeys(d.sessions).length },
  { id: "sessions-100", category: "consistency", icon: "💯", target: 100, value: (d) => d.sessions.filter(isQualifyingSession).length },
  // Learning
  { id: "first-step", category: "learning", icon: "🌱", target: 1, legacy: true, value: (d) => Object.keys(d.completedLessons).length },
  { id: "khmer-explorer", category: "learning", icon: "ក", target: 1, legacy: true, value: (d) => lessonsIn(d, "khmer") },
  { id: "bilingual", category: "learning", icon: "🌐", target: 2, legacy: true, value: (d) => (lessonsIn(d, "english") > 0 ? 1 : 0) + (lessonsIn(d, "khmer") > 0 ? 1 : 0) },
  { id: "rising-star", category: "learning", icon: "⭐", target: 200, unit: "XP", legacy: true, value: (d) => d.xp },
  { id: "dedicated", category: "learning", icon: "📚", target: 500, unit: "XP", legacy: true, value: (d) => d.xp },
  { id: "expert", category: "learning", icon: "🏆", target: 1700, unit: "XP", legacy: true, value: (d) => d.xp },
  { id: "graduate", category: "learning", icon: "🎓", target: 100, unit: "%", value: (d) => Math.max(...(["english", "khmer"] as const).map((l) => (d.lessonTotals[l] ? Math.round((lessonsIn(d, l) / d.lessonTotals[l]) * 100) : 0))) },
  // Gaming
  { id: "gamer-first", category: "gaming", icon: "🎮", target: 1, value: (d) => gameRuns(d).length },
  { id: "gamer-explorer", category: "gaming", icon: "🧭", target: GAME_COUNT, value: (d) => new Set(gameRuns(d).map((s) => s.activity)).size },
  { id: "gamer-veteran", category: "gaming", icon: "🎖️", target: 50, value: (d) => gameRuns(d).length },
  { id: "gamer-badges", category: "gaming", icon: "🏅", target: 10, value: (d) => d.arcadeBadges.earned },
];

export type AchievementStatus = AchievementDef & { current: number; unlocked: boolean; pct: number };

export function achievementStatuses(data: AchievementData): AchievementStatus[] {
  return ACHIEVEMENTS.map((a) => {
    const current = Math.max(0, a.value(data));
    return { ...a, current: Math.min(current, a.target), unlocked: current >= a.target, pct: Math.min(100, Math.round((current / a.target) * 100)) };
  });
}
