"use client";

import { StreakGuide } from "@/components/learn/StreakGuide";
import Link from "next/link";
import { useState } from "react";
import ContinueCard from "@/components/learn/ContinueCard";
import { secondaryBtn } from "@/components/games/shared/GameDialog";
import { curricula, levelColors, courseProgress, getAllLessons } from "@/data/curriculum";
import { useLocale } from "@/components/shared/LocaleProvider";
import { useCurriculumText } from "@/hooks/useCurriculumText";
import { useUserProgress } from "@/hooks/use-stored-value";
import { useAccount } from "@/lib/account";
import { levelFromXp, xpForLevel } from "@/lib/local-progress";
import type { Language } from "@/types";

const LANG_CONFIG = {
  english: {
    icon: "Aa",
    color: "bg-blue-50 text-brand",
    practiceHref: "/learn/english",
  },
  khmer: {
    icon: "ក",
    color: "bg-emerald-50 text-emerald-700",
    practiceHref: "/learn/khmer",
  },
} as const;

function XpBar({ xp }: { xp: number }) {
  const { t } = useLocale();
  const level = levelFromXp(xp);
  const currentMin = xpForLevel(level);
  const nextMin = xpForLevel(level + 1);
  const pct = nextMin > currentMin ? Math.min(100, Math.round(((xp - currentMin) / (nextMin - currentMin)) * 100)) : 100;
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 flex-none items-center justify-center rounded-2xl bg-brand text-sm font-extrabold text-white">{level}</div>
      <div className="flex-1">
        <p className="text-xs font-bold text-navy">{t(`typist.${level}`) === `typist.${level}` ? t("typist.default") : t(`typist.${level}`)}</p>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-0.5 text-[10px] text-mute">{xp} XP{nextMin > xp ? t("learn.toNext", { n: nextMin - xp }) : t("learn.maxLevel")}</p>
      </div>
    </div>
  );
}

function StreakBadge({ streak }: { streak: number }) {
  const { t } = useLocale();
  const signedIn = useAccount().status === "user";
  if (!signedIn) return <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-mute ring-1 ring-slate-200">{t("learn.signInStreak")}</span>;
  if (!streak) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 ring-1 ring-amber-200">
      {t("learn.streakDays", { n: streak })}
    </span>
  );
}

export default function CurriculumHub() {
  const { t } = useLocale();
  const ct = useCurriculumText();
  const [activeLang, setActiveLang] = useState<Language>("english");
  const progress = useUserProgress();
  const curriculum = curricula[activeLang];
  const allLessons = getAllLessons(curriculum);
  const completedCount = allLessons.filter((l) => progress.completedLessons[`${activeLang}:${l.id}`]).length;
  const totalCount = allLessons.length;
  const overallPct = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-surface text-navy">
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-brand">{t("learn.kicker")}</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">{t("learn.title")}</h1>
          <p className="mt-2 max-w-2xl text-mute">
            {t("learn.subtitle")}
          </p>
        </div>

        {/* Progress summary */}
        {progress.xp > 0 && (
          <div className="mb-8 flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex-1 min-w-[200px]">
              <XpBar xp={progress.xp} />
            </div>
            <StreakBadge streak={progress.streak} />
          </div>
        )}

        <StreakGuide />

        <ContinueCard />

        {/* Language tabs */}
        <div className="mb-6 flex gap-2">
          {(["english", "khmer"] as const).map((lang) => {
            const cfg = LANG_CONFIG[lang];
            const cur = curricula[lang];
            const all = getAllLessons(cur);
            const done = all.filter((l) => progress.completedLessons[`${lang}:${l.id}`]).length;
            return (
              <button
                key={lang}
                type="button"
                onClick={() => setActiveLang(lang)}
                className={`flex-1 rounded-2xl border p-4 text-left transition sm:flex-none sm:min-w-[220px] ${activeLang === lang ? "border-brand bg-white shadow-md" : "border-slate-200 bg-white hover:border-brand/50"}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`grid h-10 w-10 place-items-center rounded-2xl text-xl font-extrabold ${cfg.color}`}>{cfg.icon}</span>
                  <div>
                    <p className="font-extrabold">{t(`category.${lang}`)}</p>
                    <p className="text-xs text-mute">{t(lang === "khmer" ? "learn.langKhMeta" : "learn.langEnMeta")}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-[11px] text-mute">
                    <span>{t("learn.lessonsDone", { done, total: all.length })}</span>
                    <span>{all.length ? Math.round((done / all.length) * 100) : 0}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all ${lang === "khmer" ? "bg-emerald-500" : "bg-brand"}`}
                      style={{ width: `${all.length ? Math.round((done / all.length) * 100) : 0}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Overall progress bar for active language */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-navy">{t("learn.completeOf", { done: completedCount, total: totalCount })}</span>
              <span className="text-brand">{overallPct}%</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${overallPct}%` }} />
            </div>
          </div>
          <Link href={LANG_CONFIG[activeLang].practiceHref} className={`${secondaryBtn} whitespace-nowrap !py-2 text-xs`}>
            {t("learn.quickPractice")}
          </Link>
        </div>

        {/* Course cards */}
        <div className="space-y-4">
          {curriculum.courses.map((course) => {
            const { done, total } = courseProgress(course, progress.completedLessons, activeLang);
            const pct = total ? Math.round((done / total) * 100) : 0;
            const isComplete = done === total && total > 0;

            return (
              <details key={course.id} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <summary className="flex cursor-pointer list-none items-center gap-4 p-5 hover:bg-slate-50">
                  <div className={`grid h-12 w-12 flex-none place-items-center rounded-2xl bg-gradient-to-br text-2xl ${course.gradient} text-white shadow-sm`}>
                    {course.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-extrabold">{ct.courseTitle(course)}</h2>
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${levelColors[course.level]}`}>
                        {ct.level(course.level)}
                      </span>
                      {isComplete && <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">{t("learn.complete")}</span>}
                    </div>
                    <p className="mt-0.5 truncate text-sm text-mute">{ct.courseDescription(course)}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[11px] font-semibold text-mute">{done}/{total}</span>
                    </div>
                  </div>
                  <span className="ml-2 flex-none text-xl text-mute transition-transform group-open:rotate-180" aria-hidden="true">⌄</span>
                </summary>

                <div className="border-t border-slate-100 px-5 pb-5 pt-4">
                  {course.modules.map((mod) => (
                    <div key={mod.id} className="mb-4 last:mb-0">
                      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-mute">{ct.moduleTitle(mod)}</p>
                      <div className="space-y-2">
                        {mod.lessons.map((lesson) => {
                          const completed = !!progress.completedLessons[`${activeLang}:${lesson.id}`];
                          return (
                            <Link
                              key={lesson.id}
                              href={`/learn/${activeLang}/${lesson.id}`}
                              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 transition hover:-translate-y-0.5 hover:border-brand/30 hover:bg-white hover:shadow-sm"
                            >
                              <span className={`grid h-7 w-7 flex-none place-items-center rounded-full text-sm font-bold ${completed ? "bg-brand text-white" : "bg-slate-200 text-slate-500"}`}>
                                {completed ? "✓" : "→"}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="truncate font-semibold text-sm">{ct.lessonTitle(lesson)}</p>
                                <p className="text-[11px] text-mute">
                                  {lesson.keyFocus.slice(0, 4).map(ct.keyFocus).join(" · ")}
                                  {lesson.keyFocus.length > 4 ? " …" : ""}
                                </p>
                              </div>
                              <span className="flex-none text-right text-xs font-bold text-amber-600">+{lesson.xpReward} XP<span className="block text-[10px] font-semibold text-orange-600" title={t("learn.minTitle")}>🔥 {lesson.completionCriteria.minAccuracy}%{lesson.completionCriteria.minWpm ? ` · ${lesson.completionCriteria.minWpm} WPM` : ""}</span></span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            );
          })}
        </div>

        {/* Footer CTA */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-navy p-5 text-white">
          <div>
            <p className="font-bold">{t("learn.ctaTitle")}</p>
            <p className="text-sm text-slate-300">{t("learn.ctaText")}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/learn/english" className={`${secondaryBtn} !py-2`}>{t("category.english")}</Link>
            <Link href="/learn/khmer" className={`${secondaryBtn} !py-2`}>{t("category.khmer")}</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
