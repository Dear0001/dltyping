"use client";

import Link from "next/link";
import { curricula, firstIncompleteLesson, getAllLessons, levelLabels, levelColors } from "@/data/curriculum";
import { useUserProgress } from "@/hooks/use-stored-value";

const LANGS = [
  { id: "english", label: "English", icon: "Aa", iconClass: "bg-blue-50 text-brand" },
  { id: "khmer", label: "Khmer", icon: "ក", iconClass: "bg-emerald-50 text-emerald-700" },
] as const;

/** "Continue where you left off": the next incomplete lesson for each language. */
export default function ContinueCard() {
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
    <section aria-label="Continue learning" className="mb-8 grid gap-3 sm:grid-cols-2">
      {cards.map(({ lang, done, total, next }) => {
        const verb = done === 0 ? "Start" : "Continue";
        const body = (
          <>
            <span className={`grid h-11 w-11 flex-none place-items-center rounded-2xl text-xl font-extrabold ${lang.iconClass}`}>{lang.icon}</span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-brand">
                {next ? `${verb} ${lang.label}` : `${lang.label} complete`}
              </p>
              {next ? (
                <>
                  <p className={`truncate font-extrabold ${lang.id === "khmer" ? "font-khmer" : ""}`}>{next.lesson.titleKm ?? next.lesson.title}</p>
                  <p className="mt-0.5 flex items-center gap-2 text-[11px] text-mute">
                    <span className={`rounded-full px-2 py-0.5 font-bold ${levelColors[next.course.level]}`}>{levelLabels[next.course.level]}</span>
                    <span>{done}/{total} done</span>
                  </p>
                </>
              ) : (
                <p className="font-extrabold">All {total} lessons finished 🎉</p>
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
