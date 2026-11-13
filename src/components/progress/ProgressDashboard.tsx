"use client";

import Link from "next/link";
import Ready from "@/components/skeleton/Ready";
import { SkCard, SkHeading, SkPage, SkStatRow } from "@/components/skeleton/Skeleton";
import { secondaryBtn } from "@/components/games/shared/GameDialog";
import { curricula, getAllLessons, levelColors, courseProgress } from "@/data/curriculum";
import { useUserProgress, useScores, usePracticeBest } from "@/hooks/use-stored-value";
import { useAccount } from "@/lib/account";
import { useLocale } from "@/components/shared/LocaleProvider";
import { useCurriculumText } from "@/hooks/useCurriculumText";
import { useGameText } from "@/hooks/useGameText";
import { typingGames } from "@/data/games";
import { bestForGame, levelFromXp, xpForLevel } from "@/lib/local-progress";
import GameThumb from "@/components/games/shared/GameThumb";
import { useStreak, useTypingProgress } from "@/hooks/useTypingProgress";
import { useArcadeStore } from "@/hooks/use-arcade";
import { ACHIEVEMENTS as ARCADE_BADGES } from "@/lib/arcade/progress";
import { ACHIEVEMENT_CATEGORIES, achievementStatuses, type AchievementStatus } from "@/lib/achievements";
import { QUALIFYING_MIN_CORRECT } from "@/lib/progress/progress-analytics";
import { Icon, ProgressBar, cx } from "@/components/ui/ui";

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
  const liveStreak = useStreak();
  const streak = signedIn ? liveStreak : 0; // streaks need an account (same rule as the dashboard)
  const { store } = useTypingProgress();
  const arcade = useArcadeStore();
  const achievements = achievementStatuses({
    sessions: store.sessions,
    xp: progress.xp,
    completedLessons: progress.completedLessons,
    lessonTotals: { english: getAllLessons(curricula.english).length, khmer: getAllLessons(curricula.khmer).length },
    arcadeBadges: { earned: Object.keys(arcade.achievements).length, total: ARCADE_BADGES.length },
  });
  const unlockedCount = achievements.filter((a) => a.unlocked).length;
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

        {/* Achievements, by category, with progress toward each */}
        <section className="mb-6" aria-labelledby="ach-heading">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <h2 id="ach-heading" className="text-xl font-extrabold">{t("prog.achievements")}</h2>
            <span className="text-sm font-semibold text-mute">{t("achv.summary", { n: unlockedCount, total: achievements.length })}</span>
          </div>
          <div className="space-y-5">
            {ACHIEVEMENT_CATEGORIES.map((cat) => {
              const items = achievements.filter((a) => a.category === cat);
              return (
                <div key={cat}>
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-navy">{t(`achv.cat.${cat}`)}<span className="text-xs font-semibold text-mute">{items.filter((a) => a.unlocked).length}/{items.length}</span></h3>
                  <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {items.map((a) => <li key={a.id}><AchievementCard a={a} /></li>)}
                  </ul>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-mute">{t("achv.note")}</p>
        </section>

        {/* How XP and streaks work */}
        <section className="mb-6 rounded-2xl border border-line bg-card p-5 shadow-sm" aria-labelledby="xp-heading">
          <h2 id="xp-heading" className="flex items-center gap-2 text-base font-extrabold"><Icon name="star" size={18} className="text-amber-500" />{t("xpinfo.title")}</h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-600">
            {[t("xpinfo.lesson"), t("xpinfo.repeat"), t("xpinfo.games"), t("xpinfo.streak", { n: QUALIFYING_MIN_CORRECT })].map((line) => <li key={line} className="flex gap-2"><Icon name="check" size={16} className="mt-0.5 flex-none text-emerald-500" />{line}</li>)}
          </ul>
        </section>

        {/* Game scores */}
        {totalPlays > 0 && (
          <section className="mb-6">
            <h2 className="mb-4 text-xl font-extrabold">{t("prog.highScores")}</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {typingGames.map((game) => {
                const best = bestForGame(scores, game.id);
                return (
                  <Link key={game.id} href={game.href} className={`flex items-center gap-3 overflow-hidden rounded-2xl border border-line bg-card p-2.5 pr-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] ${best > 0 ? "" : "opacity-75"}`}>
                    <div className={`relative aspect-video w-24 flex-none overflow-hidden rounded-xl bg-gradient-to-br ${game.gradient}`}><GameThumb id={game.id} /></div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-bold">{gt.title(game)}</p>
                      <p className={`text-lg font-extrabold tabular-nums ${best > 0 ? "text-brand" : "text-slate-300"}`}>{best > 0 ? <>🏆 {best.toLocaleString("en-US")}</> : "—"}</p>
                    </div>
                  </Link>
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

function AchievementCard({ a }: { a: AchievementStatus }) {
  const { t } = useLocale();
  const key = a.legacy ? `ach.${a.id}` : `achv.${a.id}`;
  return (
    <div className={cx("ach-card flex h-full flex-col rounded-2xl border p-4 transition", a.unlocked ? "is-unlocked border-amber-200 bg-amber-50/80 shadow-sm" : "border-slate-200 bg-white")}>
      <div className="flex items-start justify-between gap-2">
        <span className={cx("grid h-11 w-11 place-items-center rounded-xl text-2xl", a.unlocked ? "bg-white shadow-sm" : "bg-slate-100 grayscale", a.icon === "ក" && "font-khmer text-xl font-bold text-emerald-700")} aria-hidden="true">{a.icon}</span>
        {a.unlocked ? <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-extrabold text-navy"><Icon name="check" size={11} strokeWidth={2.6} />{t("achv.unlocked")}</span> : <Icon name="lock" size={15} className="text-slate-300" />}
      </div>
      <p className={cx("mt-2 text-sm font-bold", a.unlocked ? "text-amber-900" : "text-navy")}>{t(a.legacy ? `${key}.title` : `${key}.t`)}</p>
      <p className="mt-0.5 flex-1 text-xs text-mute">{t(a.legacy ? `${key}.desc` : `${key}.d`)}</p>
      {!a.unlocked && (
        <div className="mt-3">
          <ProgressBar value={a.pct} size="sm" tone="amber" label={t("achv.progressOf", { n: a.current, total: a.target })} />
          <p className="mt-1 text-[11px] font-semibold tabular-nums text-mute">{t("achv.progressOf", { n: a.current, total: a.target })}{a.unit ? ` ${a.unit}` : ""}</p>
        </div>
      )}
    </div>
  );
}
