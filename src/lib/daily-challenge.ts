import type { Difficulty } from "@/lib/game-engine";
import { parseStored, readRaw, writeRaw } from "@/lib/local-progress";
import { buildWordText, wordsNeeded } from "@/lib/typing-test";
import type { Language } from "@/types";

/**
 * Daily challenge: everyone gets the same challenge and text on the same calendar
 * day (seeded by the date), and the speed goal scales to the learner's own average.
 */
export type ChallengeKind = "sprint" | "steady" | "precision" | "endurance";

export type ChallengeDef = {
  kind: ChallengeKind;
  icon: string;
  title: string;
  titleKm: string;
  blurb: string;
  blurbKm: string;
  durationSec: number;
  difficulty: Difficulty | "mixed";
  minAccuracy: number;
  /** Speed goal as a share of the learner's average WPM; null = accuracy-only challenge. */
  wpmFactor: number | null;
};

export const CHALLENGES: Record<ChallengeKind, ChallengeDef> = {
  sprint: { kind: "sprint", icon: "⚡", title: "Speed Sprint", titleKm: "រត់ប្រណាំងល្បឿន", blurb: "30 seconds of short words. Push past your usual pace.", blurbKm: "៣០ វិនាទីនៃពាក្យខ្លីៗ។ វាយឱ្យលឿនជាងធម្មតា។", durationSec: 30, difficulty: "easy", minAccuracy: 90, wpmFactor: 1.1 },
  steady: { kind: "steady", icon: "🎯", title: "Steady Hands", titleKm: "ដៃនឹងនរ", blurb: "One minute of everyday words with almost no mistakes.", blurbKm: "មួយនាទីនៃពាក្យប្រចាំថ្ងៃ ដោយស្ទើរតែគ្មានកំហុស។", durationSec: 60, difficulty: "medium", minAccuracy: 95, wpmFactor: null },
  precision: { kind: "precision", icon: "💎", title: "Precision Run", titleKm: "ភាពជាក់លាក់", blurb: "Long, tricky words. Accuracy is everything.", blurbKm: "ពាក្យវែងៗ និងពិបាក។ ភាពត្រឹមត្រូវសំខាន់បំផុត។", durationSec: 60, difficulty: "hard", minAccuracy: 97, wpmFactor: null },
  endurance: { kind: "endurance", icon: "🏔️", title: "Endurance", titleKm: "ការស៊ូទ្រាំ", blurb: "Two minutes of mixed words. Hold your pace to the end.", blurbKm: "ពីរនាទីនៃពាក្យចម្រុះ។ រក្សាល្បឿនរហូតដល់ចប់។", durationSec: 120, difficulty: "mixed", minAccuracy: 90, wpmFactor: 0.9 },
};
const ROTATION: ChallengeKind[] = ["sprint", "steady", "precision", "endurance"];

/** FNV-1a: a stable 32-bit number from a string. */
export function hashString(value: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export type DailyChallenge = ChallengeDef & { date: string; language: Language; text: string; targetWpm: number | null };

/** The challenge for a local calendar day ("YYYY-MM-DD"). Same date and language always give the same text. */
export function dailyChallenge(date: string, language: Language, averageWpm: number): DailyChallenge {
  const def = CHALLENGES[ROTATION[hashString(`kind:${date}`) % ROTATION.length]];
  const text = buildWordText(language, def.difficulty, wordsNeeded(def.durationSec), hashString(`text:${date}:${language}`));
  const targetWpm = def.wpmFactor === null ? null : Math.max(10, Math.round(averageWpm * def.wpmFactor));
  return { ...def, date, language, text, targetWpm };
}

export const goalMet = (challenge: Pick<DailyChallenge, "minAccuracy" | "targetWpm">, wpm: number, accuracy: number) =>
  accuracy >= challenge.minAccuracy && (challenge.targetWpm === null || wpm >= challenge.targetWpm);

// ---- Results ----------------------------------------------------------------
export type DailyEntry = { wpm: number; accuracy: number; done: boolean; attempts: number };
export type DailyBook = Record<string, Partial<Record<Language, DailyEntry>>>;
export const DAILY_KEY = "dlt.daily.v1";
export const EMPTY_DAILY: DailyBook = {};
/** Days of history kept; older days only matter for a streak longer than this. */
const KEEP_DAYS = 400;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function validateEntry(v: unknown): DailyEntry | null {
  if (typeof v !== "object" || v === null) return null;
  const { wpm, accuracy, done, attempts } = v as Record<string, unknown>;
  const ok = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n) && n >= 0;
  if (!ok(wpm) || !ok(accuracy) || typeof done !== "boolean" || !ok(attempts)) return null;
  return { wpm: Math.min(400, wpm), accuracy: Math.min(100, accuracy), done, attempts: Math.round(attempts) };
}

export function validateDaily(value: unknown): DailyBook | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const out: DailyBook = {};
  for (const [date, langs] of Object.entries(value)) {
    if (!DATE_RE.test(date) || typeof langs !== "object" || langs === null) continue;
    const day: Partial<Record<Language, DailyEntry>> = {};
    for (const lang of ["english", "khmer"] as const) {
      const entry = validateEntry((langs as Record<string, unknown>)[lang]);
      if (entry) day[lang] = entry;
    }
    if (Object.keys(day).length) out[date] = day;
  }
  return out;
}

export const readDaily = () => parseStored(readRaw(DAILY_KEY), EMPTY_DAILY, validateDaily);

/** Pure: the book after one attempt. Keeps the fastest attempt, and `done` never goes back to false. */
export function applyAttempt(book: DailyBook, date: string, language: Language, wpm: number, accuracy: number, met: boolean): DailyBook {
  const prev = book[date]?.[language];
  const keep = prev && !((met && !prev.done) || (met === prev.done && wpm > prev.wpm)) ? prev : null;
  const entry: DailyEntry = {
    wpm: keep ? keep.wpm : wpm,
    accuracy: keep ? keep.accuracy : accuracy,
    done: met || !!prev?.done,
    attempts: (prev?.attempts ?? 0) + 1,
  };
  const next: DailyBook = { ...book, [date]: { ...book[date], [language]: entry } };
  const dates = Object.keys(next).sort();
  for (const old of dates.slice(0, Math.max(0, dates.length - KEEP_DAYS))) delete next[old];
  return next;
}

export function recordAttempt(date: string, language: Language, wpm: number, accuracy: number, met: boolean): DailyEntry {
  const next = applyAttempt(readDaily(), date, language, wpm, accuracy, met);
  writeRaw(DAILY_KEY, JSON.stringify(next));
  return next[date]![language]!;
}

/** "YYYY-MM-DD" shifted by whole days, in local calendar terms (DST safe). */
export function shiftDay(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const next = new Date(y, m - 1, d + days);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`;
}

const dayDone = (book: DailyBook, date: string) => Object.values(book[date] ?? {}).some((e) => e?.done);

/** Consecutive days with a completed challenge (any language). Today not done yet keeps yesterday's streak alive. */
export function dailyStreak(book: DailyBook, today: string): number {
  let day = dayDone(book, today) ? today : shiftDay(today, -1);
  let streak = 0;
  while (dayDone(book, day)) {
    streak++;
    day = shiftDay(day, -1);
  }
  return streak;
}

/** The last `count` days ending today, oldest first, with whether each was completed. */
export function recentDays(book: DailyBook, today: string, count = 7): { date: string; done: boolean }[] {
  return Array.from({ length: count }, (_, i) => {
    const date = shiftDay(today, i - count + 1);
    return { date, done: dayDone(book, date) };
  });
}
