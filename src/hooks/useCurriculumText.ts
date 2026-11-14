"use client";

import { useLocale } from "@/components/shared/LocaleProvider";
import { kmCourses, kmKeyFocus, kmLessons, kmModules, kmReasons } from "@/data/curriculum-km";
import { lessonCategories } from "@/data/categories";
import { curricula, getAllLessons } from "@/data/curriculum";
import type { CurriculumCourse, CurriculumLesson, CurriculumLevel, CurriculumModule } from "@/types";

/** English title → lesson id, for labels saved with a session (sessions store the English title). */
const ID_BY_TITLE = new Map<string, string>([
  ...lessonCategories.flatMap((c) => c.sections.map((s) => [s.title, s.id] as [string, string])),
  ...Object.values(curricula).flatMap((c) => getAllLessons(c).map((l) => [l.title, l.id] as [string, string])),
]);

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
    /** A session's saved label ("Home row warm-up", "Weak-key drill"…) in the interface language. Unknown labels pass through. */
    sessionDetail: (detail: string) => {
      if (!km) return detail;
      if (detail === "Weak-key drill") return t("act.weakDrill");
      const id = ID_BY_TITLE.get(detail);
      return (id && kmLessons[id]?.title) || detail;
    },
  };
}
