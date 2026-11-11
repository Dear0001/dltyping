"use client";

import Link from "next/link";
import Ready from "@/components/skeleton/Ready";
import { SkCard, SkHeading, SkPage, SkStatRow } from "@/components/skeleton/Skeleton";
import { secondaryBtn } from "@/components/games/shared/GameDialog";
import { curricula, getAllLessons, levelColors, courseProgress } from "@/data/curriculum";
import { useUserProgress, useScores, usePracticeBest } from "@/hooks/use-stored-value";
import { useAccount } from "@/lib/account";
import { levelFromXp, xpForLevel } from "@/lib/local-progress";
import { useLocale } from "@/components/shared/LocaleProvider";
import { useCurriculumText } from "@/hooks/useCurriculumText";
import { useGameText } from "@/hooks/useGameText";
import { typingGames } from "@/data/games";
import { bestForGame } from "@/lib/local-progress";

const ACHIEVEMENTS = [
  { id: "first-step", emoji: "🌱", condition: (xp: number) => xp >= 50 },
  { id: "rising-star", emoji: "⭐", condition: (xp: number) => xp >= 200 },
  { id: "fluent", emoji: "🚀", condition: (xp: number) => levelFromXp(xp) >= 3 },
  { id: "dedicated", emoji: "📚", condition: (xp: number) => xp >= 500 },
  { id: "expert", emoji: "🏆", condition: (xp: number) => levelFromXp(xp) >= 5 },
  { id: "on-a-roll", emoji: "🔥", condition: (_xp: number, streak: number) => streak >= 3 },
  { id: "unstoppable", emoji: "⚡", condition: (_xp: number, streak: number) => streak >= 7 },
  { id: "khmer-explorer", emoji: "🇰🇭", condition: (_xp: number, _s: number, completed: Record<string, boolean>) => Object.keys(completed).some((k) => k.startsWith("khmer:")) },
  { id: "bilingual", emoji: "🌐", condition: (_xp: number, _s: number, completed: Record<string, boolean>) => Object.keys(completed).some((k) => k.startsWith("english:")) && Object.keys(completed).some((k) => k.startsWith("khmer:")) },
];

function ProgressRing({ pct, size = 60, strokeWidth = 6 }: { pct: number; size?: number; strokeWidth?: number }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#2563eb" strokeWidth={strokeWidth} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-500" />
    </svg>
  );
}

export default function ProgressDashboard() {
  return <Ready fallback={<SkPage width="max-w-4xl"><SkHeading /><SkCard lines={2} media="h-20" className="mb-6" /><SkStatRow /><SkCard lines={3} media={null} className="mb-4" /><SkCard lines={3} media={null} /></SkPage>}><ProgressContent /></Ready>;
}

function ProgressContent() {
  const { t } = useLocale();
  const ct = useCurriculumText();
  const gt = useGameText();
  const progress = useUserProgress();
  const signedIn = useAccount().status === "user";
  const streak = signedIn ? progress.streak : 0; // streaks (and the achievements for them) need an account
  const scores = useScores();
  const practiceBest = usePracticeBest();
  const level = levelFromXp(progress.xp);
  const currentMin = xpForLevel(level);
  const nextMin = xpForLevel(level + 1);
  const levelPct = nextMin > currentMin ? Math.min(100, Math.round(((progress.xp - currentMin) / (nextMin - currentMin)) * 100)) : 100;
  const totalPlays = Object.values(scores).reduce((sum, s) => sum + s.plays, 0);

  return (
    <div className="min-h-screen bg-surface text-navy">
      <main className="mx-auto max-w-4xl px-4 pb-16 pt-8 sm:px-6">

        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-brand">{t("prog.kicker")}</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">{t("prog.title")}</h1>
          <p className="mt-1 text-mute">{t("prog.subtitle")}</p>
        </div>

        {/* XP + Level hero */}
        <div className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-navy to-blue-900 p-6 text-white shadow-lg sm:p-8">
          <div className="flex flex-wrap items-center gap-6">
            <div className="relative flex-none">
              <ProgressRing pct={levelPct} size={80} strokeWidth={7} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-extrabold leading-none text-white">{level}</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-widest text-blue-300">{t("prog.level", { n: level })}</p>
              <p className="text-2xl font-extrabold">{t(`typist.${level}`) === `typist.${level}` ? t("typist.default") : t(`typist.${level}`)}</p>
              <p className="mt-1 text-sm text-blue-200">
                {progress.xp} XP{nextMin > progress.xp ? t("prog.toNext", { xp: nextMin - progress.xp, n: level + 1 }) : t("prog.maxLevel")}
              </p>
            </div>
            {streak > 0 ? (
              <div className="rounded-2xl bg-white/10 px-4 py-3 text-center">
                <p className="text-2xl">🔥</p>
                <p className="text-lg font-extrabold">{streak}</p>
                <p className="text-xs text-blue-200">{t("prog.dayStreak")}</p>
              </div>
            ) : !signedIn && (
              <div className="rounded-2xl bg-white/10 px-4 py-3 text-center">
                <p className="text-2xl">🔒</p>
                <p className="text-xs text-blue-200">{t("prog.signInLine1")}<br />{t("prog.signInLine2")}</p>
              </div>
            )}
          </div>
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-xs text-blue-200">
              <span>{t("prog.level", { n: level })}</span>
              <span>{t("prog.level", { n: level + 1 })}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${levelPct}%` }} />
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: t("prog.statLessons"), value: Object.keys(progress.completedLessons).length, icon: "📘" },
            { label: t("prog.statEn"), value: practiceBest.english?.bestWpm ?? "—", icon: "🇬🇧" },
            { label: t("prog.statKh"), value: practiceBest.khmer?.bestWpm ?? "—", icon: "🇰🇭" },
            { label: t("prog.statGames"), value: totalPlays || "—", icon: "🎮" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xl" aria-hidden="true">{stat.icon}</p>
              <p className="mt-1 text-2xl font-extrabold tabular-nums">{stat.value}</p>
              <p className="text-xs text-mute">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Language progress */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          {(["english", "khmer"] as const).map((lang) => {
            const cur = curricula[lang];
            const all = getAllLessons(cur);
            const done = all.filter((l) => progress.completedLessons[`${lang}:${l.id}`]).length;
            const pct = all.length ? Math.round((done / all.length) * 100) : 0;
            return (
              <div key={lang} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="font-extrabold">{t(`category.${lang}`)}</h2>
                  <span className="text-xs font-semibold text-mute">{t("prog.lessonsCount", { done, total: all.length })}</span>
                </div>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full transition-all ${lang === "khmer" ? "bg-emerald-500" : "bg-brand"}`} style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-2 text-xs text-mute">{t("prog.pctComplete", { n: pct })}</p>
                <div className="mt-4 space-y-1">
                  {cur.courses.map((course) => {
                    const { done: cdone, total: ctotal } = courseProgress(course, progress.completedLessons, lang);
                    return (
                      <div key={course.id} className="flex items-center gap-2">
                        <span className="text-sm">{course.emoji}</span>
                        <div className="flex-1">
                          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-brand/60 transition-all" style={{ width: `${ctotal ? Math.round((cdone / ctotal) * 100) : 0}%` }} />
                          </div>
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${levelColors[course.level]}`}>
                          {ct.level(course.level)}
                        </span>
                        <span className="text-[11px] text-mute">{cdone}/{ctotal}</span>
                      </div>
                    );
                  })}
                </div>
                <Link href={`/learn?lang=${lang}`} className={`${secondaryBtn} mt-4 w-full !py-2 text-xs`}>{t("prog.viewCurriculum")}</Link>
              </div>
            );
          })}
        </div>

        {/* Achievements */}
        <section className="mb-6">
          <h2 className="mb-4 text-xl font-extrabold">{t("prog.achievements")}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {ACHIEVEMENTS.map((ach) => {
              const unlocked = ach.condition(progress.xp, streak, progress.completedLessons);
              return (
                <div key={ach.id} className={`rounded-2xl border p-4 transition ${unlocked ? "border-amber-200 bg-amber-50 shadow-sm" : "border-slate-200 bg-white opacity-50"}`}>
                  <p className={`text-3xl ${unlocked ? "" : "grayscale filter"}`} aria-hidden="true">{ach.emoji}</p>
                  <p className={`mt-2 text-sm font-bold ${unlocked ? "text-amber-800" : "text-mute"}`}>{t(`ach.${ach.id}.title`)}</p>
                  <p className="mt-0.5 text-xs text-mute">{t(`ach.${ach.id}.desc`)}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Game scores */}
        {totalPlays > 0 && (
          <section className="mb-6">
            <h2 className="mb-4 text-xl font-extrabold">{t("prog.highScores")}</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {typingGames.map((game) => {
                const best = bestForGame(scores, game.id);
                return (
                  <div key={game.id} className="flex items-center gap-3 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className={`h-12 w-14 flex-none overflow-hidden rounded-xl bg-gradient-to-br ${game.gradient}`} />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-bold">{gt.title(game)}</p>
                      <p className="text-lg font-extrabold tabular-nums text-brand">{best > 0 ? best.toLocaleString("en-US") : "—"}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* CTA */}
        <div className="rounded-2xl bg-navy p-5 text-white">
          <p className="font-bold">{t("prog.keepLearning")}</p>
          <p className="text-sm text-slate-300 mt-0.5">{t("prog.keepLearningText")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/learn" className={`${secondaryBtn} !border-white !bg-white !py-2 text-xs`}>{t("prog.goCurriculum")}</Link>
            <Link href="/games" className={`${secondaryBtn} !border-white !bg-white !py-2 text-xs`}>{t("prog.playGame")}</Link>
          </div>
        </div>

      </main>
    </div>
  );
}
