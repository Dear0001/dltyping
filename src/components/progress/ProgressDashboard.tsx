"use client";

import Link from "next/link";
import Ready from "@/components/skeleton/Ready";
import { SkCard, SkHeading, SkPage, SkStatRow } from "@/components/skeleton/Skeleton";
import { secondaryBtn } from "@/components/games/shared/GameDialog";
import { curricula, getAllLessons, levelColors } from "@/data/curriculum";
import { useUserProgress, useScores, usePracticeBest } from "@/hooks/use-stored-value";
import { useAccount } from "@/lib/account";
import { useLocale } from "@/components/shared/LocaleProvider";
import { useCurriculumText } from "@/hooks/useCurriculumText";
import { useGameText } from "@/hooks/useGameText";
import { typingGames } from "@/data/games";
import { bestForGame, levelFromXp, xpForLevel } from "@/lib/local-progress";
import GameThumb from "@/components/games/shared/GameThumb";
import { useNow, useStreak, useTypingProgress } from "@/hooks/useTypingProgress";
import { useArcadeStore } from "@/hooks/use-arcade";
import { ACHIEVEMENTS as ARCADE_BADGES } from "@/lib/arcade/progress";
import { ACHIEVEMENT_CATEGORIES, achievementStatuses, type AchievementStatus } from "@/lib/achievements";
import { QUALIFYING_MIN_CORRECT, formatDuration, isQualifyingSession } from "@/lib/progress/progress-analytics";
import { LineChart } from "@/components/dashboard/PerformanceChart";
import type { SessionRecord } from "@/types/progress";
import type { Language } from "@/types";
import { EmptyState, Icon, ProgressBar, btn, cx } from "@/components/ui/ui";

const PRACTICE = new Set(["lesson", "typing-test", "drill"]);

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
  const now = useNow();
  const practiceAll = store.sessions.filter((s) => PRACTICE.has(s.activity) && isQualifyingSession(s));
  // Closest locked achievements (some progress first), so the next goal is obvious.
  const nextUp = achievements.filter((a) => !a.unlocked).sort((a, b) => b.pct - a.pct).slice(0, 3);
  const ago = (iso: string) => {
    if (!now) return "";
    const day = (ms: number) => { const d = new Date(ms); return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000; };
    const n = Math.max(0, Math.round(day(now) - day(Date.parse(iso))));
    return n === 0 ? t("km.last.today") : n === 1 ? t("km.last.yesterday") : t("km.last.daysAgo", { n });
  };
  const gameRows = typingGames.map((game) => {
    const runs = store.sessions.filter((s) => s.activity === game.id);
    const plays = Object.entries(scores).filter(([k]) => k === game.id || k.startsWith(`${game.id}:`)).reduce((n, [, e]) => n + e.plays, 0);
    const lastRun = runs.reduce<string | null>((m, s) => (!m || s.completedAt > m ? s.completedAt : m), null);
    return { game, best: bestForGame(scores, game.id), plays: Math.max(plays, runs.length), last: lastRun ? ago(lastRun) : "", bestWpm: runs.reduce((m, s) => Math.max(m, s.wpm), 0) };
  });
  const played = gameRows.filter((r) => r.plays > 0).sort((a, b) => b.best - a.best);
  const unplayed = gameRows.filter((r) => r.plays === 0).map((r) => r.game);

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

        {/* Overall stats: all real counts from this device */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: t("prog.statLessons"), value: Object.keys(progress.completedLessons).length, icon: "📘" },
            { label: t("prog.statSessions"), value: practiceAll.length || "—", icon: "⌨️" },
            { label: t("prog.statTime"), value: practiceAll.length ? formatDuration(practiceAll.reduce((n, s) => n + s.durationSec, 0)) : "—", icon: "⏱️" },
            { label: t("prog.statGames"), value: totalPlays || "—", icon: "🎮" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xl" aria-hidden="true">{stat.icon}</p>
              <p className="mt-1 text-2xl font-extrabold tabular-nums">{stat.value}</p>
              <p className="text-xs text-mute">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* English and Khmer, side by side and never mixed */}
        <section className="mb-6" aria-labelledby="lang-heading">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <h2 id="lang-heading" className="text-xl font-extrabold">{t("prog.byLanguage")}</h2>
            <Link href="/dashboard" className="text-sm font-bold text-brand hover:underline">{t("prog.detailedCharts")}</Link>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {(["english", "khmer"] as const).map((lang) => <LanguageCard key={lang} lang={lang} sessions={store.sessions} best={practiceBest[lang]?.bestWpm ?? 0} completed={progress.completedLessons} />)}
          </div>
        </section>

        {/* Achievements, by category, with progress toward each */}
        <section className="mb-6" aria-labelledby="ach-heading">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <h2 id="ach-heading" className="text-xl font-extrabold">{t("prog.achievements")}</h2>
            <span className="text-sm font-semibold text-mute">{t("achv.summary", { n: unlockedCount, total: achievements.length })}</span>
          </div>
          <ProgressBar value={Math.round((unlockedCount / Math.max(1, achievements.length)) * 100)} tone="amber" label={t("achv.summary", { n: unlockedCount, total: achievements.length })} className="mb-5" />
          {nextUp.length > 0 && (
            <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-navy"><Icon name="target" size={16} className="text-brand" />{t("prog.nextUp")}</h3>
              <ul className="grid gap-3 sm:grid-cols-3">{nextUp.map((a) => <li key={a.id}><AchievementCard a={a} /></li>)}</ul>
            </div>
          )}
          <div className="space-y-5">
            {ACHIEVEMENT_CATEGORIES.map((cat) => {
              const items = achievements.filter((a) => a.category === cat);
              return (
                <details key={cat} className="group rounded-2xl border border-line bg-card p-4 shadow-sm" open={items.some((a) => a.unlocked)}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-bold text-navy">
                    <span className="flex items-center gap-2">{t(`achv.cat.${cat}`)}<span className="text-xs font-semibold text-mute">{items.filter((a) => a.unlocked).length}/{items.length}</span></span>
                    <Icon name="chevron" size={16} className="text-mute transition group-open:rotate-180" />
                  </summary>
                  <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {items.map((a) => <li key={a.id}><AchievementCard a={a} /></li>)}
                  </ul>
                </details>
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

        {/* Game records */}
        <section className="mb-6" aria-labelledby="games-heading">
          <h2 id="games-heading" className="mb-4 text-xl font-extrabold">{t("prog.highScores")}</h2>
          {played.length === 0
            ? <EmptyState icon="games" title={t("prog.gamesEmptyTitle")} text={t("prog.gamesEmptyText")} action={<Link href="/games" className={btn("primary")}>{t("prog.playGame")}</Link>} />
            : <>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {played.map(({ game, best, plays, last, bestWpm }) => (
                    <li key={game.id}><Link href={game.href} className="flex items-center gap-3 overflow-hidden rounded-2xl border border-line bg-card p-2.5 pr-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]">
                      <div className={`relative aspect-video w-24 flex-none overflow-hidden rounded-xl bg-gradient-to-br ${game.gradient}`}><GameThumb id={game.id} /></div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">{gt.title(game)}</p>
                        <p className="text-lg font-extrabold tabular-nums text-brand">{best > 0 ? <>🏆 {best.toLocaleString("en-US")}</> : "—"}</p>
                        <p className="truncate text-[11px] text-mute">{t("ui.games.plays", { n: plays })}{bestWpm > 0 && <> · {t("prog.bestWpmShort", { n: bestWpm })}</>}{last && <> · {last}</>}</p>
                      </div>
                    </Link></li>
                  ))}
                </ul>
                {unplayed.length > 0 && <p className="mt-3 text-sm text-mute">{t("prog.notTried")} {unplayed.map((g, i) => <span key={g.id}>{i > 0 && ", "}<Link href={g.href} className="font-semibold text-brand hover:underline">{gt.title(g)}</Link></span>)}</p>}
              </>}
        </section>

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
      <p className="mt-0.5 flex-1 text-xs text-mute">{t(a.legacy ? `${key}.desc` : `${key}.d`, { n: a.target })}</p>
      {!a.unlocked && (
        <div className="mt-3">
          <ProgressBar value={a.pct} size="sm" tone="amber" label={t("achv.progressOf", { n: a.current, total: a.target })} />
          <p className="mt-1 text-[11px] font-semibold tabular-nums text-mute">{t("achv.progressOf", { n: a.current, total: a.target })}{a.unit ? ` ${a.unit}` : ""}</p>
        </div>
      )}
    </div>
  );
}

/** One language's real numbers: records, recent trend, and lesson-by-lesson completion. */
function LanguageCard({ lang, sessions, best, completed }: { lang: Language; sessions: readonly SessionRecord[]; best: number; completed: Record<string, boolean> }) {
  const { t } = useLocale();
  const ct = useCurriculumText();
  const km = lang === "khmer";
  const practice = sessions.filter((s) => s.language === lang && PRACTICE.has(s.activity) && isQualifyingSession(s)).sort((a, b) => a.completedAt.localeCompare(b.completedAt));
  const recent = practice.slice(-12);
  const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((n, x) => n + x, 0) / xs.length) : 0);
  const avgWpm = avg(recent.map((s) => s.wpm));
  const avgAcc = avg(recent.map((s) => s.accuracy));
  const bestWpm = Math.max(best, ...practice.map((s) => s.wpm), 0);
  const cur = curricula[lang];
  const all = getAllLessons(cur);
  const done = all.filter((l) => completed[`${lang}:${l.id}`]).length;
  const pct = all.length ? Math.round((done / all.length) * 100) : 0;
  const color = km ? "#059669" : "#2563eb";
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-extrabold">
          <span className={cx("grid h-8 w-8 place-items-center rounded-lg text-sm font-extrabold text-white", km ? "bg-emerald-600 font-khmer" : "bg-brand")} aria-hidden="true">{km ? "ក" : "Aa"}</span>
          {t(`category.${lang}`)} <span className="text-xs font-semibold text-mute">{km ? "NiDA" : "QWERTY"}</span>
        </h3>
        <span className="text-xs font-semibold text-mute">{practice.length === 1 ? t("prog.sessionsOne") : t("prog.sessionsN", { n: practice.length })}</span>
      </div>

      {practice.length === 0
        ? <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
            <p className="text-sm font-bold text-navy">{t("prog.langEmptyTitle", { lang: t(`category.${lang}`) })}</p>
            <p className="mt-1 text-xs text-mute">{t("prog.langEmptyText")}</p>
            <Link href={`/learn/${lang}`} className={btn("primary", "sm", "mt-3")}>{t("prog.langEmptyCta")}</Link>
          </div>
        : <>
            <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[[t("prog.bestWpm"), bestWpm], [t("prog.avgWpm"), avgWpm], [t("prog.avgAcc"), `${avgAcc}%`]].map(([label, value]) => (
                <div key={String(label)} className="rounded-xl bg-slate-50 px-2 py-2"><dt className="text-[11px] font-semibold text-mute">{label}</dt><dd className="text-xl font-extrabold tabular-nums text-navy">{value}</dd></div>
              ))}
            </dl>
            <p className="mt-1.5 text-[11px] text-mute">{t("prog.avgNote", { n: recent.length })}</p>
            {recent.length >= 2 && (
              <div className="mt-3">
                <p className="text-xs font-bold text-navy">{t("prog.trend")}</p>
                <LineChart points={recent.map((s, i) => ({ label: String(i + 1), value: s.wpm, note: `${s.accuracy}%` }))} color={color} unit="WPM" height={120} ariaLabel={t("prog.trendAria", { lang: t(`category.${lang}`), n: recent.length })} />
              </div>
            )}
          </>}

      <div className="mt-4 border-t border-slate-100 pt-4">
        <div className="flex items-center justify-between text-xs font-semibold"><span className="text-navy">{t("prog.lessonsCount", { done, total: all.length })}</span><span className="text-mute">{t("prog.pctComplete", { n: pct })}</span></div>
        <div className="mt-3 space-y-2.5">
          {cur.courses.map((course) => {
            const lessons = course.modules.flatMap((m) => m.lessons);
            const cdone = lessons.filter((l) => completed[`${lang}:${l.id}`]).length;
            return (
              <div key={course.id}>
                <div className="mb-1 flex items-center gap-2 text-xs">
                  <span aria-hidden="true">{course.emoji}</span>
                  <span className="min-w-0 flex-1 truncate font-semibold text-navy">{ct.courseTitle(course)}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${levelColors[course.level]}`}>{ct.level(course.level)}</span>
                  <span className="tabular-nums text-mute">{cdone}/{lessons.length}</span>
                </div>
                <ol className="flex flex-wrap gap-1" aria-label={ct.courseTitle(course)}>
                  {lessons.map((l) => {
                    const ok = !!completed[`${lang}:${l.id}`];
                    return <li key={l.id}><Link href={`/learn/${lang}/${l.id}`} title={`${ct.lessonTitle(l)}${ok ? " ✓" : ""}`} aria-label={`${ct.lessonTitle(l)}: ${t(ok ? "prog.lessonDone" : "prog.lessonTodo")}`}
                      className={cx("block h-4 w-4 rounded-[5px] transition hover:scale-125", ok ? (km ? "bg-emerald-500" : "bg-brand") : "bg-slate-200 hover:bg-slate-300")} /></li>;
                  })}
                </ol>
              </div>
            );
          })}
        </div>
        <Link href={`/learn?lang=${lang}`} className={`${secondaryBtn} mt-4 w-full !py-2 text-xs`}>{t("prog.viewCurriculum")}</Link>
      </div>
    </div>
  );
}
