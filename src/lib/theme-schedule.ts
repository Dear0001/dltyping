/**
 * Time-of-day theme schedule. Pure and dependency-free (type imports only) so it runs on the server, in the
 * pre-paint script, in the client store and in tests. All times are the *viewer's local* time (Date getters),
 * never UTC or a hard-coded zone. The schedule is plain data: to change it later, edit DEFAULT_SCHEDULE or pass
 * another ThemeSchedule to the store.
 */
import type { ThemeId } from "@/lib/themes";

export type ThemePeriodId = "sunrise" | "morning" | "afternoon" | "sunset" | "evening" | "night";

export interface SchedulePeriod {
  id: ThemePeriodId;
  /** Minutes after local midnight (0-1439) at which the period starts. It lasts until the next entry's start. */
  start: number;
  theme: ThemeId;
}

/** Periods sorted by start. The last one wraps past midnight and also covers the time before the first start. */
export type ThemeSchedule = readonly SchedulePeriod[];

export const hm = (h: number, m = 0) => h * 60 + m;

/**
 * Default schedule. The existing 8 themes are reused (ethereal-flora is the alternative morning theme and
 * twilight-indigo the alternative evening one; both stay available manually):
 *  05:00 Sunrise   dawn-peach       soft warm peach paper
 *  08:00 Morning   meadow-mint      fresh, bright mint
 *  12:00 Afternoon developer-blue   the balanced default reading theme
 *  16:00 Sunset    golden-hour      warm cream with golden accents
 *  18:00 Evening   velvet-petal     dimmer, softer warm paper (still light, lower intensity)
 *  21:00 Night     midnight-blossom dark, warm and low in blue light (never pure black)
 */
export const DEFAULT_SCHEDULE: ThemeSchedule = [
  { id: "sunrise", start: hm(5), theme: "dawn-peach" },
  { id: "morning", start: hm(8), theme: "meadow-mint" },
  { id: "afternoon", start: hm(12), theme: "developer-blue" },
  { id: "sunset", start: hm(16), theme: "golden-hour" },
  { id: "evening", start: hm(18), theme: "velvet-petal" },
  { id: "night", start: hm(21), theme: "midnight-blossom" },
];

/** Source of "now". The app uses the system clock; tests inject a fixed or movable one. */
export interface ThemeClock { now(): Date }
export const systemClock: ThemeClock = { now: () => new Date() };

/** True when the schedule is non-empty, sorted by strictly increasing in-range starts with unique ids. */
export function isValidSchedule(s: unknown): s is ThemeSchedule {
  if (!Array.isArray(s) || s.length === 0) return false;
  const ids = new Set<string>();
  let prev = -1;
  for (const p of s) {
    if (!p || typeof p.id !== "string" || typeof p.theme !== "string" || !Number.isInteger(p.start)) return false;
    if (p.start < 0 || p.start > 1439 || p.start <= prev || ids.has(p.id)) return false;
    ids.add(p.id);
    prev = p.start;
  }
  return true;
}

export const minutesOfDay = (d: Date) => d.getHours() * 60 + d.getMinutes();

/** The period in effect at `date` (local time). Before the first start of the day it is still the last period (night). */
export function periodAt(date: Date, schedule: ThemeSchedule = DEFAULT_SCHEDULE): SchedulePeriod {
  const m = minutesOfDay(date);
  let pick = schedule[schedule.length - 1];
  for (const p of schedule) if (m >= p.start) pick = p;
  return pick;
}

export const themeAt = (date: Date, schedule: ThemeSchedule = DEFAULT_SCHEDULE): ThemeId => periodAt(date, schedule).theme;

/**
 * The next moment (strictly after `date`) at which the period changes, in local time. Built with local calendar
 * fields rather than by adding 24h of milliseconds, so it stays right across DST changes and at midnight.
 */
export function nextBoundary(date: Date, schedule: ThemeSchedule = DEFAULT_SCHEDULE): Date {
  const at = (dayOffset: number, start: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + dayOffset, Math.floor(start / 60), start % 60, 0, 0);
  for (const p of schedule) {
    const c = at(0, p.start);
    if (c.getTime() > date.getTime()) return c;
  }
  return at(1, schedule[0].start);
}

export const msUntilNextBoundary = (date: Date, schedule: ThemeSchedule = DEFAULT_SCHEDULE) => nextBoundary(date, schedule).getTime() - date.getTime();

/** "05:00" style label for a period start, used for the schedule list in the theme menu. */
export const formatStart = (start: number) => `${String(Math.floor(start / 60)).padStart(2, "0")}:${String(start % 60).padStart(2, "0")}`;
