"use client";

import { useLocale } from "@/components/shared/LocaleProvider";
import { kmCourses, kmKeyFocus, kmLessons, kmModules, kmReasons } from "@/data/curriculum-km";
import type { CurriculumCourse, CurriculumLesson, CurriculumLevel, CurriculumModule } from "@/types";

/** Localized lesson/course text. English comes from curriculum.ts; Khmer from curriculum-km.ts, falling back to English. */
export function useCurriculumText() {
  const { t, locale } = useLocale();
  const km = locale === "km";
  return {
    level: (l: CurriculumLevel) => t(`level.${l}`),
    courseTitle: (c: Pick<CurriculumCourse, "id" | "title">) => (km && kmCourses[c.id]?.title) || c.title,
    courseDescription: (c: Pick<CurriculumCourse, "id" | "description">) => (km && kmCourses[c.id]?.description) || c.description,
    moduleTitle: (m: Pick<CurriculumModule, "id" | "title" | "titleKm">) => (km && kmModules[m.id]) || m.titleKm || m.title,
    lessonTitle: (l: Pick<CurriculumLesson, "id" | "title" | "titleKm">) => (km && kmLessons[l.id]?.title) || l.titleKm || l.title,
    /** Title of a practice passage (lessons.ts shares ids with the curriculum). */
    passageTitle: (l: { id: string; title: string }) => (km && kmLessons[l.id]?.title) || l.title,
    objectives: (l: Pick<CurriculumLesson, "id" | "objectives">) => (km && kmLessons[l.id]?.objectives) || l.objectives,
    instructions: (l: Pick<CurriculumLesson, "id" | "instructions">) => (km && kmLessons[l.id]?.instructions) || l.instructions,
    tip: (l: Pick<CurriculumLesson, "id" | "tip">) => (km && l.tip && kmLessons[l.id]?.tip) || l.tip,
    keyFocus: (k: string) => (km && kmKeyFocus[k]) || k,
    reason: (r: string) => (km && kmReasons[r]) || r,
  };
}
