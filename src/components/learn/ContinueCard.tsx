"use client";

import Link from "next/link";
import { curricula, firstIncompleteLesson, getAllLessons, levelColors } from "@/data/curriculum";
import Ready from "@/components/skeleton/Ready";
import { Sk } from "@/components/skeleton/Skeleton";
import { useUserProgress } from "@/hooks/use-stored-value";
import { useLocale } from "@/components/shared/LocaleProvider";
import { useCurriculumText } from "@/hooks/useCurriculumText";

const LANGS = [
  { id: "english", icon: "Aa", iconClass: "bg-blue-50 text-brand" },
  { id: "khmer", icon: "ក", iconClass: "bg-emerald-50 text-emerald-700" },
] as const;

/** "Continue where you left off": the next incomplete lesson for each language. */
export default function ContinueCard() {
  const { t } = useLocale();
  return <Ready fallback={<section aria-busy="true" aria-label={t("learn.loadingLessons")} className="mb-8 grid gap-3 sm:grid-cols-2">{[0, 1].map((i) => <div key={i} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4"><Sk className="h-11 w-11 flex-none rounded-2xl" /><div className="flex-1"><Sk className="mb-2 h-3 w-24" /><Sk className="mb-2 h-4 w-3/4" /><Sk className="h-2 w-full" /></div></div>)}</section>}><ContinueCardContent /></Ready>;
}

function ContinueCardContent() {
  const { t } = useLocale();
  const ct = useCurriculumText();
  const progress = useUserProgress();
  const cards = LANGS.map((lang) => {
    const curriculum = curricula[lang.id];
    const total = getAllLessons(curriculum).length;
    const done = Object.keys(progress.completedLessons).filter(
      (k) => k.startsWith(`${lang.id}:`) && curriculum.courses.some((c) => c.modules.some((m) => m.lessons.some((l) => `${lang.id}:${l.id}` === k))),
    ).length;
    return { lang, done, total, next: firstIncompleteLesson(curriculum, progress.completedLessons) };
  });
  // Languages the learner has started come first.
  cards.sort((a, b) => Number(b.done > 0) - Number(a.done > 0));

  return (
    <section aria-label={t("learn.continueLabel")} className="mb-8 grid gap-3 sm:grid-cols-2">
      {cards.map(({ lang, done, total, next }) => {
        const verb = t(done === 0 ? "learn.start" : "learn.continue");
        const label = t(`category.${lang.id}`);
        const body = (
          <>
            <span className={`grid h-11 w-11 flex-none place-items-center rounded-2xl text-xl font-extrabold ${lang.iconClass}`}>{lang.icon}</span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-brand">
                {next ? t(done === 0 ? "learn.startLang" : "learn.continueLang", { lang: label }) : t("learn.langComplete", { lang: label })}
              </p>
              {next ? (
                <>
                  <p className={`truncate font-extrabold ${lang.id === "khmer" ? "font-khmer" : ""}`}>{ct.lessonTitle(next.lesson)}</p>
                  <p className="mt-0.5 flex items-center gap-2 text-[11px] text-mute">
                    <span className={`rounded-full px-2 py-0.5 font-bold ${levelColors[next.course.level]}`}>{ct.level(next.course.level)}</span>
                    <span>{t("learn.doneCount", { done, total })}</span>
                  </p>
                </>
              ) : (
                <p className="font-extrabold">{t("learn.allFinished", { total })}</p>
              )}
            </div>
            {next && <span className="flex-none text-sm font-bold text-brand">{verb} →</span>}
          </>
        );
        const cls = "flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm";
        return next ? (
          <Link key={lang.id} href={`/learn/${lang.id}/${next.lesson.id}`} className={`${cls} transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md`}>
            {body}
          </Link>
        ) : (
          <div key={lang.id} className={cls}>{body}</div>
        );
      })}
    </section>
  );
}
