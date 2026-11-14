"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import ActivityHistory from "@/components/dashboard/ActivityHistory";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { BarChart, ChartCard, ComparisonBars, LineChart, type ChartPoint } from "@/components/dashboard/PerformanceChart";
import { SkChart, SkStatRow, SkTable } from "@/components/skeleton/Skeleton";
import StatCard from "@/components/dashboard/StatCard";
import StreakLevels from "@/components/dashboard/StreakLevels";
import PracticeCalendar from "@/components/dashboard/PracticeCalendar";
import { useUserProgress } from "@/hooks/use-stored-value";
import { useLocale } from "@/components/shared/LocaleProvider";
import { useAccount } from "@/lib/account";
import { useNow, useTypingProgress } from "@/hooks/useTypingProgress";
import { buildDashboard, currentStreak, formatDuration, RANGES, type DayPoint, type RangeId } from "@/lib/progress/progress-analytics";
import type { Language } from "@/types";
import { clearProgress } from "@/lib/progress/progress-storage";

export default function DashboardOverview() {
  const { t, locale } = useLocale();
  const { store, hydrated, isEmpty } = useTypingProgress();
  const userProgress = useUserProgress();
  const signedIn = useAccount().status === "user";
  const [range, setRange] = useState<RangeId>("30d");
  const [lang, setLang] = useState<"all" | Language>("all");
  const now = useNow();
  // Everything below (stats, charts, history) follows the language filter, except the streak and the
  // English-vs-Khmer comparison, which are about both languages by definition.
  const all = useMemo(() => buildDashboard(store, range, now), [store, range, now]);
  const data = useMemo(() => {
    if (lang === "all") return all;
    const built = buildDashboard({ ...store, sessions: store.sessions.filter((s) => s.language === lang) }, range, now);
    return { ...built, streak: currentStreak(store.sessions, now) };
  }, [all, store, lang, range, now]);
  const lessonsDone = Object.keys(userProgress.completedLessons).filter((k) => lang === "all" || k.startsWith(`${lang}:`)).length;
  const dateFmt = useMemo(() => new Intl.DateTimeFormat(locale === "km" ? "km-KH" : "en-US", { month: "short", day: "numeric" }), [locale]);
  const dayLabel = (d: DayPoint) => { const [y, m, day] = d.date.split("-").map(Number); return dateFmt.format(new Date(y, m - 1, day)); };
  const hasData = data.overview.sessions > 0;
  const charsCorrect = data.sessions.reduce((n, s) => n + s.correct, 0);
  const charsTyped = charsCorrect + data.sessions.reduce((n, s) => n + s.incorrect, 0);
  const rangeLabel = t(`dash.range${range}`).toLowerCase();
  const sessionsNote = (n: number) => (n ? t(n === 1 ? "dash.sessionCountOne" : "dash.sessionCountMany", { n }) : undefined);
  const none = (v: number | string) => (hasData ? v : null);

  const wpmPoints: ChartPoint[] = data.series.map((d) => ({ label: dayLabel(d), value: d.wpm, note: sessionsNote(d.sessions) }));
  const accPoints: ChartPoint[] = data.series.map((d) => ({ label: dayLabel(d), value: d.accuracy, note: sessionsNote(d.sessions) }));
  const minutePoints: ChartPoint[] = data.series.map((d) => ({ label: dayLabel(d), value: d.minutes, note: sessionsNote(d.sessions) }));

  function reset() {
    if (window.confirm(t("dash.resetConfirm"))) clearProgress();
  }

  const langPicker = (
    <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm" role="radiogroup" aria-label={t("dash.langFilter")}>
      {(["all", "english", "khmer"] as const).map((l) => (
        <button key={l} type="button" role="radio" aria-checked={lang === l} onClick={() => setLang(l)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${lang === l ? "bg-brand text-white" : "text-mute hover:text-navy"}`}>{l === "all" ? t("dash.langAll") : t(`category.${l}`)}</button>
      ))}
    </div>
  );
  const rangePicker = (
    <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm" role="radiogroup" aria-label={t("dash.rangeLabel")}>
      {RANGES.map((r) => (
        <button
          key={r.id} type="button" role="radio" aria-checked={range === r.id} onClick={() => setRange(r.id)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${range === r.id ? "bg-navy text-white" : "text-mute hover:text-navy"}`}
        >{t(`dash.rangeShort${r.id}`)}</button>
      ))}
    </div>
  );

  return (
    <DashboardShell title={t("dash.title")} subtitle={t("dash.subtitle")} actions={hydrated && !isEmpty ? <div className="flex flex-wrap gap-2">{langPicker}{rangePicker}</div> : undefined}>
      {!hydrated ? (
        <div className="space-y-6" aria-busy="true" aria-label={t("dash.loadingStats")}><SkStatRow count={4} /><SkStatRow count={4} /><div className="grid gap-4 lg:grid-cols-2"><SkChart /><SkChart /></div><SkTable rows={4} /></div>
      ) : isEmpty ? (
        <EmptyState />
      ) : (
        <div className="space-y-6">
          <section aria-label={t("dash.statsLabel")} className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <StatCard icon="📈" label={t("dash.sessions")} value={none(data.overview.sessions)} hint={hasData ? t("dash.inRange", { range: rangeLabel }) : t("dash.noneInRange", { range: rangeLabel })} tooltip={t("dash.sessionsTip")} />
            <StatCard icon="⚡" label={t("dash.avgWpm")} value={none(data.overview.avgWpm)} unit="WPM" accent="sky" hint={t("dash.avgWpmHint")} tooltip={t("dash.avgWpmTip")} />
            <StatCard icon="🏆" label={t("dash.bestWpm")} value={none(data.overview.bestWpm)} unit="WPM" accent="navy" hint={t("dash.bestWpmHint")} />
            <StatCard icon="🎯" label={t("dash.avgAcc")} value={none(data.overview.avgAccuracy)} unit="%" hint={t("dash.avgAccHint")} tooltip={t("dash.avgAccTip")} />
            <StatCard icon="⏱️" label={t("dash.practiceTime")} value={none(formatDuration(data.overview.practiceSeconds))} accent="sky" hint={t("dash.inRange", { range: rangeLabel })} />
            <StatCard icon="📘" label={t("dash.lessonsDone")} value={lessonsDone} hint={t("dash.lessonsDoneHint")} accent="navy" tooltip={t("dash.lessonsDoneTip")} />
            <StatCard icon="⌨️" label={t("dash.chars")} value={none(charsTyped.toLocaleString(locale === "km" ? "km-KH" : "en-US"))} hint={t("dash.charsHint", { correct: charsCorrect.toLocaleString(locale === "km" ? "km-KH" : "en-US"), range: rangeLabel })} />
            <StatCard icon="🎮" label={t("dash.gamesDone")} value={none(data.overview.gamesCompleted)} hint={t("dash.runsIn", { range: rangeLabel })} />
            {signedIn
              ? <StatCard icon="🔥" label={t("dash.streak")} value={data.streak} unit={t(data.streak === 1 ? "streak.unitOne" : "streak.unit")} accent="sky" hint={t(data.streak ? "dash.streakKeep" : "dash.streakStart")} tooltip={t("dash.streakTip")} />
              : <StatCard icon="🔒" label={t("dash.streak")} value={t("dash.locked")} accent="sky" hint={t("dash.lockedHint")} tooltip={t("dash.lockedTip")} />}
          </section>

          <PracticeCalendar sessions={store.sessions} now={now} />

          {signedIn && <StreakLevels sessions={store.sessions} />}

          {!hasData && (
            <p className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-navy" role="status">
              {lang !== "all" && <>{t("dash.langNone", { lang: t(`category.${lang}`) })} </>}{t("dash.noSessions", { range: rangeLabel })}<Link href="/setup" className="font-semibold text-brand underline">{t("dash.practiceNow")}</Link>.
            </p>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title={t("dash.speedTitle")} subtitle={t("dash.speedSub")} empty={!hasData}>
              <LineChart points={wpmPoints} color="#2563eb" unit="WPM" ariaLabel={t("dash.speedAria", { range: rangeLabel })} />
            </ChartCard>
            <ChartCard title={t("dash.accTitle")} subtitle={t("dash.accSub")} empty={!hasData}>
              <LineChart points={accPoints} color="#0ea5e9" unit="%" max={100} ariaLabel={t("dash.accAria", { range: rangeLabel })} />
            </ChartCard>
            <ChartCard title={t("dash.durTitle")} subtitle={t("dash.durSub")} empty={!hasData}>
              <BarChart points={minutePoints} color="#2563eb" unit={t("dash.min")} decimals={1} ariaLabel={t("dash.durAria", { range: rangeLabel })} />
            </ChartCard>
            <ChartCard title={t("dash.langTitle")} subtitle={t("dash.langSub")} empty={all.overview.sessions === 0}>
              <ComparisonBars groups={all.languages} colors={{ english: "#2563eb", khmer: "#059669" }} labelFor={(k) => t(`category.${k}`)} />
            </ChartCard>
          </div>

          <ChartCard title={t("dash.diffTitle")} subtitle={t("dash.diffSub")} empty={!hasData || data.difficulties.every((d) => d.sessions === 0)}>
            <ComparisonBars groups={data.difficulties} colors={{ easy: "#38bdf8", medium: "#2563eb", hard: "#0f172a" }} labelFor={(k) => t(`games.difficulty.${k}`)} />
          </ChartCard>

          <DailyHistory days={data.series} label={dayLabel} />

          <ActivityHistory sessions={data.recent} />

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-mute">
            <p>{t("dash.storedOnly")}</p>
            <button type="button" onClick={reset} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-mute hover:border-red-300 hover:text-red-600">{t("dash.reset")}</button>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function EmptyState() {
  const { t } = useLocale();
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
      <p className="text-5xl" aria-hidden="true">📊</p>
      <h2 className="mt-4 text-2xl font-extrabold text-navy">{t("dash.emptyTitle")}</h2>
      <p className="mx-auto mt-2 max-w-xl text-mute">{t("dash.emptyText")}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/learn/english" className="rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white shadow-sm hover:brightness-110">{t("dash.practiceEn")}</Link>
        <Link href="/learn/khmer" className="rounded-xl bg-navy px-5 py-3 text-sm font-bold text-white shadow-sm hover:brightness-110">{t("dash.practiceKh")}</Link>
        <Link href="/games" className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-navy hover:border-brand hover:text-brand">{t("dash.playGame")}</Link>
      </div>
    </section>
  );
}

/** One row per day with practice in the chosen range (newest first): sessions, minutes, average WPM and accuracy. */
function DailyHistory({ days, label }: { days: DayPoint[]; label: (d: DayPoint) => string }) {
  const { t } = useLocale();
  const [showAll, setShowAll] = useState(false);
  const active = days.filter((d) => d.sessions > 0).reverse();
  const shown = showAll ? active : active.slice(0, 7);
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="daily-heading">
      <h2 id="daily-heading" className="font-extrabold text-navy">{t("dash.dailyTitle")}</h2>
      <p className="text-xs text-mute">{t("dash.dailySub")}</p>
      {active.length === 0
        ? <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-mute">{t("dash.chartEmpty")}</p>
        : <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[28rem] text-sm">
              <thead><tr className="border-b border-slate-200 text-left text-xs text-mute">
                <th scope="col" className="py-2 pr-3 font-semibold">{t("dash.dailyDate")}</th>
                <th scope="col" className="py-2 pr-3 text-right font-semibold">{t("dash.sessions")}</th>
                <th scope="col" className="py-2 pr-3 text-right font-semibold">{t("dash.dailyMinutes")}</th>
                <th scope="col" className="py-2 pr-3 text-right font-semibold">{t("dash.avgWpm")}</th>
                <th scope="col" className="py-2 text-right font-semibold">{t("dash.avgAcc")}</th>
              </tr></thead>
              <tbody>
                {shown.map((d) => <tr key={d.date} className="border-b border-slate-100 last:border-0">
                  <th scope="row" className="py-2 pr-3 text-left font-semibold text-navy">{label(d)}</th>
                  <td className="py-2 pr-3 text-right tabular-nums">{d.sessions}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{d.minutes}</td>
                  <td className="py-2 pr-3 text-right font-bold tabular-nums text-brand">{d.wpm ?? "—"}</td>
                  <td className={`py-2 text-right font-bold tabular-nums ${d.accuracy !== null && d.accuracy < 90 ? "text-amber-600" : "text-navy"}`}>{d.accuracy === null ? "—" : `${d.accuracy}%`}</td>
                </tr>)}
              </tbody>
            </table>
            {active.length > 7 && <button type="button" onClick={() => setShowAll((v) => !v)} className="mt-3 text-xs font-bold text-brand hover:underline">{showAll ? t("dash.dailyLess") : t("dash.dailyMore", { n: active.length - 7 })}</button>}
          </div>}
    </section>
  );
}
