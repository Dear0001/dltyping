import { sessionLevel } from "@/lib/progress/streak-levels";
import type { Language } from "@/types";
import type { ActivityType, ProgressStore, SessionRecord } from "@/types/progress";

/** One formula for every activity so numbers are comparable across lessons, tests and games. */
export function computeSessionStats(correct: number, incorrect: number, durationSec: number) {
  const total = correct + incorrect;
  const minutes = Math.max(durationSec, 1) / 60;
  return {
    wpm: Math.round(correct / 5 / minutes),
    accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
  };
}

// ---- Activity metadata ------------------------------------------------------
export type ActivityMeta = { label: string; icon: string; kind: "lesson" | "test" | "game" };
export const ACTIVITY_META: Record<ActivityType, ActivityMeta> = {
  lesson: { label: "Lesson practice", icon: "📘", kind: "lesson" },
  "typing-test": { label: "Typing test", icon: "⏱️", kind: "test" },
  drill: { label: "Weak-key drill", icon: "🎯", kind: "lesson" },
  "letter-jump": { label: "Letter Jump", icon: "🦘", kind: "game" },
  "word-sprint": { label: "Word Sprint", icon: "⚡", kind: "game" },
  "sentence-rush": { label: "Sentence Rush", icon: "📝", kind: "game" },
  "mario-khmer-quest": { label: "Mario Khmer Quest", icon: "🍄", kind: "game" },
  "english-quest": { label: "English Quest", icon: "🗺️", kind: "game" },
  "car-racing": { label: "Typing Car Racing", icon: "🏎️", kind: "game" },
  "zombie-survival": { label: "Zombie Survival", icon: "🧟", kind: "game" },
  "battle-arena": { label: "Typing Battle Arena", icon: "🧙", kind: "game" },
  "space-shooter": { label: "Typing Space Shooter", icon: "🚀", kind: "game" },
};
export const isGame = (activity: ActivityType) => ACTIVITY_META[activity].kind === "game";
export const languageName = (language: Language) => (language === "khmer" ? "Khmer" : "English");

/** Description for a recent-activity row, e.g. "Completed Khmer lesson". */
export function describeSession(s: SessionRecord): string {
  const lang = languageName(s.language);
  switch (s.activity) {
    case "lesson": return `Completed ${lang} lesson`;
    case "drill": return `${lang} weak-key drill`;
    case "typing-test": return `${lang} typing test`;
    case "letter-jump": return "Letter Jump run";
    case "word-sprint": return "Word Sprint result";
    case "sentence-rush": return "Sentence Rush result";
    case "mario-khmer-quest": return "Mario Khmer Quest";
    case "english-quest": return "English Quest";
    case "car-racing": return "Typing Car Racing race";
    case "zombie-survival": return "Zombie Survival run";
    case "battle-arena": return "Typing Battle Arena battle";
    case "space-shooter": return "Typing Space Shooter mission";
  }
}

// ---- Dates ------------------------------------------------------------------
const DAY_MS = 86_400_000;
/** Local calendar day, so "today" matches the learner's clock rather than UTC. */
export function dayKey(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const startOfDay = (ms: number) => {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
};
const timeOf = (s: SessionRecord) => Date.parse(s.completedAt);

// ---- Range filtering --------------------------------------------------------
export type RangeId = "7d" | "30d" | "90d" | "all";
export const RANGES: { id: RangeId; label: string; days: number | null }[] = [
  { id: "7d", label: "Last 7 days", days: 7 },
  { id: "30d", label: "Last 30 days", days: 30 },
  { id: "90d", label: "Last 90 days", days: 90 },
  { id: "all", label: "All time", days: null },
];

export function filterSessions(sessions: SessionRecord[], range: RangeId, now: number): SessionRecord[] {
  const days = RANGES.find((r) => r.id === range)?.days ?? null;
  if (days === null) return sessions;
  // "Last 7 days" = today plus the six days before it.
  const from = startOfDay(now) - (days - 1) * DAY_MS;
  return sessions.filter((s) => timeOf(s) >= from);
}

const mean = (values: number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0);

// ---- Overview ---------------------------------------------------------------
export type Overview = {
  sessions: number;
  avgWpm: number;
  bestWpm: number;
  avgAccuracy: number;
  practiceSeconds: number;
  gamesCompleted: number;
};

export function overview(sessions: SessionRecord[]): Overview {
  return {
    sessions: sessions.length,
    avgWpm: Math.round(mean(sessions.map((s) => s.wpm))),
    bestWpm: sessions.reduce((max, s) => Math.max(max, s.wpm), 0),
    avgAccuracy: Math.round(mean(sessions.map((s) => s.accuracy))),
    practiceSeconds: sessions.reduce((sum, s) => sum + s.durationSec, 0),
    gamesCompleted: sessions.filter((s) => isGame(s.activity)).length,
  };
}

/**
 * What counts as a practice day: at least one finished session with this many correct
 * characters (about four words). Opening the site, or quitting a run after a few keys, does not count.
 */
export const QUALIFYING_MIN_CORRECT = 10;
export const isQualifyingSession = (s: SessionRecord) => s.correct >= QUALIFYING_MIN_CORRECT;

const nextDay = (ms: number, step: number) => {
  // Step by calendar day (not 24h) so daylight-saving changes don't skip or repeat a day.
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + step).getTime();
};

/** Distinct local days with a qualifying session. */
/** Every new learner starts with this many streak days, so the first pet is already within reach. */
export const WELCOME_STREAK_DAYS = 3;
const WELCOME_KEY = "dlt.welcome";

/** Remembers the first day this browser opened the site. Safe to call repeatedly; only the first call writes. */
export function ensureWelcomeStart(now = Date.now()) {
  try {
    if (!window.localStorage.getItem(WELCOME_KEY)) window.localStorage.setItem(WELCOME_KEY, String(now));
  } catch {
    // Storage unavailable: the welcome streak simply isn't granted.
  }
}

/** The welcome streak days: the first-visit day and the days just before it, so a new learner begins at 3. */
function welcomeDays(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const start = Number(window.localStorage.getItem(WELCOME_KEY));
    if (!Number.isFinite(start) || start <= 0) return [];
    return Array.from({ length: WELCOME_STREAK_DAYS }, (_, i) => dayKey(nextDay(startOfDay(start), -i)));
  } catch {
    return [];
  }
}

export const practiceDays = (sessions: SessionRecord[]): Set<string> => new Set([...sessions.filter(isQualifyingSession).map((s) => dayKey(timeOf(s))), ...welcomeDays()]);

// ---- Legacy daily visits ------------------------------------------------------
// Until 2026-11-13 simply opening the site earned +1 streak point a day. Streaks now need real practice, so no new
// visits are recorded, but days already stored still count: nobody loses a streak or a pet they earned under the old rule.
const VISITS_KEY = "dlt.visits";

function visitDays(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(window.localStorage.getItem(VISITS_KEY) ?? "[]");
    return Array.isArray(raw) ? raw.filter((d): d is string => typeof d === "string") : [];
  } catch {
    return [];
  }
}

/** Most streak points a single day can be worth. */
export const MAX_DAY_POINTS = 70;
/** Points per completed lesson, and per star of a cleared game level. */
export const LESSON_POINTS = 3;
export const STAR_POINTS = 2;

/**
 * Streak points each day is worth, from 1 up to MAX_DAY_POINTS (70).
 * A day only counts once a practice session is finished (10+ correct characters). Every task adds more: +1 per finished practice session, +3 per completed lesson,
 * +2 per star of a cleared game level, and + the highest streak level (1-20) a session reached that day.
 */
export function dayPoints(sessions: SessionRecord[]): Map<string, number> {
  const points = new Map<string, number>();
  for (const day of [...practiceDays(sessions), ...visitDays()]) points.set(day, 1);
  const bestLevel = new Map<string, number>();
  for (const s of sessions) {
    if (!isQualifyingSession(s)) continue;
    const key = dayKey(timeOf(s));
    let earned = 1;
    if (s.lessonDone) earned += LESSON_POINTS;
    if (s.stars) earned += s.stars * STAR_POINTS;
    points.set(key, (points.get(key) ?? 1) + earned);
    bestLevel.set(key, Math.max(bestLevel.get(key) ?? 0, sessionLevel(s)));
  }
  for (const [day, level] of bestLevel) points.set(day, (points.get(day) ?? 1) + level);
  for (const [day, n] of points) points.set(day, Math.min(MAX_DAY_POINTS, n));
  return points;
}

/** One missed day is forgiven: the streak only resets after two days in a row without activity. */
export const GRACE_DAYS = 1;

/** Streak points over consecutive practice days up to today, forgiving a single missed day. */
export function currentStreak(sessions: SessionRecord[], now: number): number {
  const days = dayPoints(sessions);
  let cursor = startOfDay(now);
  let streak = 0, missed = 0;
  while (missed <= GRACE_DAYS && days.size) {
    const pts = days.get(dayKey(cursor));
    if (pts) { streak += pts; missed = 0; } else missed++;
    cursor = nextDay(cursor, -1);
    if (cursor < dayStart([...days.keys()].sort()[0])) break;
  }
  return streak;
}

const dayStart = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).getTime();
};

/** Longest run of practice days ever recorded (one missed day in between is forgiven). Rewards use this, so an earned pet never depends on the streak still being alive. */
export function longestStreak(sessions: SessionRecord[]): number {
  const points = dayPoints(sessions);
  const days = [...points.keys()].sort();
  let best = 0, run = 0;
  days.forEach((day, i) => {
    const consecutive = i > 0 && [1, 2].includes(Math.round((dayStart(day) - dayStart(days[i - 1])) / 86_400_000));
    run = (consecutive ? run : 0) + (points.get(day) ?? 1);
    best = Math.max(best, run);
  });
  return best;
}

// ---- Time series ------------------------------------------------------------
export type DayPoint = {
  date: string;
  label: string;
  sessions: number;
  /** null on days without practice, so charts show a gap instead of a fake zero. */
  wpm: number | null;
  accuracy: number | null;
  minutes: number;
};

const shortDate = (ms: number) => new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric" });

export function dailySeries(sessions: SessionRecord[], range: RangeId, now: number): DayPoint[] {
  if (!sessions.length) return [];
  const days = RANGES.find((r) => r.id === range)?.days ?? null;
  const end = startOfDay(now);
  const first = days === null ? Math.min(...sessions.map((s) => startOfDay(timeOf(s)))) : end - (days - 1) * DAY_MS;
  const byDay = new Map<string, SessionRecord[]>();
  for (const s of sessions) {
    const key = dayKey(timeOf(s));
    byDay.set(key, [...(byDay.get(key) ?? []), s]);
  }
  const points: DayPoint[] = [];
  for (let cursor = new Date(first); cursor.getTime() <= end; cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1)) {
    const ms = cursor.getTime();
    const key = dayKey(ms);
    const list = byDay.get(key) ?? [];
    points.push({
      date: key,
      label: shortDate(ms),
      sessions: list.length,
      wpm: list.length ? Math.round(mean(list.map((s) => s.wpm))) : null,
      accuracy: list.length ? Math.round(mean(list.map((s) => s.accuracy))) : null,
      minutes: Math.round((list.reduce((sum, s) => sum + s.durationSec, 0) / 60) * 10) / 10,
    });
  }
  return points;
}

// ---- Breakdowns -------------------------------------------------------------
export type GroupStat = { key: string; label: string; sessions: number; avgWpm: number; avgAccuracy: number };

function group(sessions: SessionRecord[], keyOf: (s: SessionRecord) => string | null, labels: [string, string][]): GroupStat[] {
  return labels.map(([key, label]) => {
    const list = sessions.filter((s) => keyOf(s) === key);
    return { key, label, sessions: list.length, avgWpm: Math.round(mean(list.map((s) => s.wpm))), avgAccuracy: Math.round(mean(list.map((s) => s.accuracy))) };
  });
}

export const byLanguage = (sessions: SessionRecord[]) => group(sessions, (s) => s.language, [["english", "English"], ["khmer", "Khmer"]]);
export const byDifficulty = (sessions: SessionRecord[]) => group(sessions, (s) => s.difficulty, [["easy", "Easy"], ["medium", "Medium"], ["hard", "Hard"]]);

export function recentSessions(sessions: SessionRecord[], limit?: number): SessionRecord[] {
  const sorted = [...sessions].sort((a, b) => timeOf(b) - timeOf(a));
  return limit ? sorted.slice(0, limit) : sorted;
}

export const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m${seconds % 60 >= 1 ? ` ${Math.round(seconds % 60)}s` : ""}`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
};

/** Everything the overview page needs from one store, computed in one place. */
/** `now` is required: callers read the clock after hydration, since prerendering must not depend on the current time. */
export function buildDashboard(store: ProgressStore, range: RangeId, now: number) {
  const inRange = filterSessions(store.sessions, range, now);
  return {
    sessions: inRange,
    overview: overview(inRange),
    streak: currentStreak(store.sessions, now),
    series: dailySeries(inRange, range, now),
    languages: byLanguage(inRange),
    difficulties: byDifficulty(inRange),
    recent: recentSessions(inRange),
  };
}
