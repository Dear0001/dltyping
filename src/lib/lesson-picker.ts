import { lessons, type Lesson } from "@/data/lessons";
import { readRaw, writeRaw } from "@/lib/local-progress";
import type { Language } from "@/types";

export const RANDOM_LESSON = "random";

/** Picks a random lesson, never the one just played (or the last random pick on this device). Call from event handlers only. */
export function pickRandomLesson(language: Language, excludeId?: string): Lesson {
  const key = `dlt.lastLesson.${language}`;
  const last = readRaw(key);
  const all = lessons[language];
  const pool = all.filter((lesson) => lesson.id !== excludeId && lesson.id !== last);
  const choices = pool.length ? pool : all;
  const picked = choices[Math.floor(Math.random() * choices.length)];
  writeRaw(key, picked.id);
  return picked;
}

/** Suggested session length: the smallest preset (60/120/300 s) that fits the lesson. */
export function suggestedTime(lesson: Lesson) {
  const minutes = Number.parseInt(lesson.duration, 10) || 1;
  return minutes <= 1 ? 60 : minutes <= 2 ? 120 : 300;
}
