"use client";

import { useLocale } from "@/components/shared/LocaleProvider";
import { LESSON_POINTS, MAX_DAY_POINTS, QUALIFYING_MIN_CORRECT, STAR_POINTS } from "@/lib/progress/progress-analytics";

type Criteria = { minAccuracy: number; minWpm?: number };

/** Streak guide for one lesson: what to do, and what it earns. */
export function LessonStreakGuide({ criteria, xp }: { criteria: Criteria; xp: number }) {
  const { t } = useLocale();
  const need = criteria.minWpm ? t("sg.needWpm", { acc: criteria.minAccuracy, wpm: criteria.minWpm }) : t("sg.need", { acc: criteria.minAccuracy });
  return (
    <section className="rounded-2xl border border-orange-200 bg-orange-50 p-5 shadow-sm" aria-label={t("sg.lessonLabel")}>
      <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wider text-orange-700">{t("sg.title")}</h2>
      <ol className="space-y-2 text-sm text-slate-700">
        <li><b>{t("sg.l1b")}</b>{t("sg.l1")}</li>
        <li><b>{t("sg.l2b")}</b>{t("sg.l2", { n: QUALIFYING_MIN_CORRECT })}</li>
        <li><b>{t("sg.l3b", { n: LESSON_POINTS })}</b>{t("sg.l3", { need, xp })}</li>
        <li><b>{t("sg.l4b", { n: STAR_POINTS })}</b>{t("sg.l4", { max: STAR_POINTS * 3 })}</li>
        <li><b>{t("sg.l5b")}</b>{t("sg.l5")}</li>
      </ol>
      <p className="mt-3 text-xs text-slate-600">{t("sg.dayMax", { n: MAX_DAY_POINTS })}</p>
    </section>
  );
}

/** General guide shown on the Learn page. */
export function StreakGuide() {
  const { t } = useLocale();
  return (
    <details className="group mb-8 rounded-2xl border border-orange-200 bg-orange-50 shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-extrabold text-orange-800">
        <span>{t("sg.q")}</span>
        <span className="text-xl transition-transform group-open:rotate-180" aria-hidden="true">⌄</span>
      </summary>
      <div className="space-y-3 border-t border-orange-200 px-5 pb-5 pt-4 text-sm text-slate-700">
        <p><b>{t("sg.g1b")}</b>{t("sg.g1")}</p>
        <p><b>{t("sg.g2b", { n: MAX_DAY_POINTS })}</b></p>
        <ul className="list-disc space-y-1 pl-5">
          <li><b>{t("sg.g3b")}</b>{t("sg.g3")}</li>
          <li><b>{t("sg.g4b", { n: LESSON_POINTS })}</b>{t("sg.g4")}</li>
          <li><b>{t("sg.g5b", { n: STAR_POINTS })}</b>{t("sg.g5")}</li>
          <li><b>{t("sg.g6b")}</b>{t("sg.g6")}</li>
        </ul>
        <p>{t("sg.unlock")}</p>
      </div>
    </details>
  );
}
