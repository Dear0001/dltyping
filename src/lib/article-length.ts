import { lessons, type Lesson } from "@/data/lessons";
import type { ProgressStore } from "@/types/progress";
import type { Language } from "@/types";

/** Session lengths offered to the user, in seconds (1, 2, 3, 5 and 10 minutes). */
export const DURATIONS = [60, 120, 180, 300, 600] as const;
export const DEFAULT_DURATION = 60;

/** Used until the user has enough history for us to learn their pace. */
export const DEFAULT_WPM = 40;
export const MIN_WPM = 10;
export const MAX_WPM = 150;
/** How many recent sessions feed the average, and how many are needed before history outweighs the default. */
const HISTORY_SESSIONS = 10;
const TRUSTED_SESSIONS = 3;
/** Ignore sessions that are too short or too sloppy to say anything about real speed. */
const MIN_CORRECT_CHARS = 30;
const MIN_ACCURACY = 80;

/** A whole article is used as-is when its length is within this band around the target. */
const WHOLE_MIN = 0.8;
const WHOLE_MAX = 1.25;
/** When trimming at a sentence, never end shorter than this share of the target. */
const TRIM_MIN = 0.85;

export const isDuration = (seconds: number): boolean => (DURATIONS as readonly number[]).includes(seconds);
export const normalizeDuration = (seconds: number): number => (isDuration(seconds) ? seconds : DEFAULT_DURATION);

/** Length in standard typing words (5 characters each). Same unit as WPM, and meaningful for Khmer, which has no spaces. */
export function typingWords(text: string): number {
  return Array.from(text).length / 5;
}

/** Words the user is expected to type in `seconds` at `wpm`. */
export function targetWords(wpm: number, seconds: number): number {
  return Math.round((wpm * seconds) / 60);
}

/**
 * The user's typical speed for a language: the average of their recent real sessions,
 * blended with the default until there are enough of them. Falls back to the default with no history.
 */
export function averageWpm(store: Pick<ProgressStore, "sessions">, language: Language): number {
  const recent = store.sessions
    .filter((s) => s.language === language && (s.activity === "lesson" || s.activity === "typing-test") && s.correct >= MIN_CORRECT_CHARS && s.accuracy >= MIN_ACCURACY && s.wpm > 0)
    .slice(-HISTORY_SESSIONS);
  const missing = Math.max(0, TRUSTED_SESSIONS - recent.length);
  const average = (recent.reduce((sum, s) => sum + s.wpm, 0) + missing * DEFAULT_WPM) / (recent.length + missing);
  return Math.min(MAX_WPM, Math.max(MIN_WPM, Math.round(average)));
}

export type Article = {
  /** Lessons the text came from, in order. A single id means the article is a lesson on its own. */
  ids: string[];
  title: string;
  text: string;
  /** Length in typing words. */
  words: number;
  /** True when the text was shortened to fit the target. */
  trimmed: boolean;
};

/** Cut points (string indexes) just after a sentence end. */
function sentenceEnds(text: string): number[] {
  const ends: number[] = [];
  for (const m of text.matchAll(/[.!?។៕]+(?=\s|$)/g)) ends.push(m.index + m[0].length);
  return ends;
}

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const whole = (lesson: Lesson): Article => ({ ids: [lesson.id], title: lesson.title, text: lesson.text, words: typingWords(lesson.text), trimmed: false });

/**
 * Builds a practice text whose length matches `wpm × seconds`.
 *  1. Randomly picks among whole articles whose length suits the target.
 *  2. If none does (long sessions need more text than any one article has), chains random
 *     articles and ends at the sentence boundary closest to the target.
 * `avoid` (e.g. the article just played) is skipped while other choices exist.
 */
export function buildArticle(language: Language, wpm: number, seconds: number, options: { avoid?: readonly string[]; random?: () => number } = {}): Article {
  const random = options.random ?? Math.random;
  const target = Math.max(1, targetWords(wpm, seconds));
  const all = lessons[language];
  const avoid = new Set(options.avoid ?? []);
  const fresh = all.filter((l) => !avoid.has(l.id));
  const pool = fresh.length ? fresh : all;

  const fitting = pool.filter((l) => {
    const w = typingWords(l.text);
    return w >= target * WHOLE_MIN && w <= target * WHOLE_MAX;
  });
  if (fitting.length) return whole(fitting[Math.floor(random() * fitting.length)]);

  // Chain shuffled articles (fresh ones first, then the rest) until there is enough text.
  const order = [...shuffle(pool, random), ...shuffle(all.filter((l) => !pool.includes(l)), random)];
  const used: Lesson[] = [];
  let text = "";
  for (const lesson of order) {
    used.push(lesson);
    text = text ? `${text} ${lesson.text}` : lesson.text;
    if (typingWords(text) >= target) break;
  }
  return compose(used, target);
}

/** Joins lessons and ends at the sentence nearest `target` when the text runs long. Deterministic, so a URL can reproduce it. */
function compose(used: Lesson[], target: number): Article {
  const text = used.map((l) => l.text).join(" ");
  if (typingWords(text) <= target * WHOLE_MAX) {
    return { ids: used.map((l) => l.id), title: used[0].title, text, words: typingWords(text), trimmed: false };
  }
  const prefixLen = (end: number) => typingWords(text.slice(0, end));
  const ends = sentenceEnds(text).filter((end) => prefixLen(end) >= target * TRIM_MIN);
  const cut = ends.length ? ends.reduce((best, end) => (Math.abs(prefixLen(end) - target) < Math.abs(prefixLen(best) - target) ? end : best)) : text.length;
  const trimmedText = text.slice(0, cut).trimEnd();
  // Only list lessons that still contribute text.
  let consumed = 0;
  const contributing = used.filter((lesson) => {
    const start = consumed;
    consumed += lesson.text.length + 1;
    return start < trimmedText.length;
  });
  return { ids: contributing.map((l) => l.id), title: contributing[0].title, text: trimmedText, words: typingWords(trimmedText), trimmed: true };
}

/**
 * Rebuilds an article from the ids and target length carried in a URL (`lesson=a,b,c&goal=200`),
 * so server and client render the same text. Unknown ids are dropped.
 */
export function articleFromIds(language: Language, raw: string | undefined, goal?: number): Article | null {
  const picked = (raw ?? "").split(",").map((id) => lessons[language].find((l) => l.id === id.trim())).filter((l): l is Lesson => !!l);
  if (!picked.length) return null;
  return compose(picked, goal && goal > 0 ? goal : Infinity);
}

/**
 * Decides the text for a practice URL. `goal` marks a generated article (ids + target length);
 * a plain known lesson id has no article; "random" or a missing/unknown id draws one for the default speed.
 * Returns null when the page should simply show the lesson `lesson`.
 */
export function resolveArticle(language: Language, lesson: string | undefined, goal: number, seconds: number): Article | null {
  if (goal > 0) {
    const rebuilt = articleFromIds(language, lesson, goal);
    if (rebuilt) return rebuilt;
  } else if (lesson && lessons[language].some((l) => l.id === lesson)) {
    return null;
  }
  return buildArticle(language, DEFAULT_WPM, seconds);
}

/** An article that is exactly one untouched lesson needs no special handling: it is just that lesson. */
export const isPlainLesson = (article: Article): boolean => article.ids.length === 1 && !article.trimmed;
