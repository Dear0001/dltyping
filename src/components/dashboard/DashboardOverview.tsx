"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import ActivityHistory from "@/components/dashboard/ActivityHistory";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { BarChart, ChartCard, ComparisonBars, LineChart, type ChartPoint } from "@/components/dashboard/PerformanceChart";
import StatCard from "@/components/dashboard/StatCard";
import { useUserProgress } from "@/hooks/use-stored-value";
import { useNow, useTypingProgress } from "@/hooks/useTypingProgress";
import { buildDashboard, formatDuration, RANGES, type RangeId } from "@/lib/progress/progress-analytics";
import { clearProgress } from "@/lib/progress/progress-storage";

export default function DashboardOverview() {
  const { store, hydrated, isEmpty } = useTypingProgress();
  const userProgress = useUserProgress();
  const [range, setRange] = useState<RangeId>("30d");
  const now = useNow();
  const data = useMemo(() => buildDashboard(store, range, now), [store, range, now]);
  const lessonsDone = Object.keys(userProgress.completedLessons).length;
  const hasData = data.overview.sessions > 0;
  const rangeLabel = RANGES.find((r) => r.id === range)?.label.toLowerCase() ?? "";
  const none = (v: number | string) => (hasData ? v : null);

  const wpmPoints: ChartPoint[] = data.series.map((d) => ({ label: d.label, value: d.wpm, note: d.sessions ? `${d.sessions} session${d.sessions === 1 ? "" : "s"}` : undefined }));
  const accPoints: ChartPoint[] = data.series.map((d) => ({ label: d.label, value: d.accuracy, note: d.sessions ? `${d.sessions} session${d.sessions === 1 ? "" : "s"}` : undefined }));
  const minutePoints: ChartPoint[] = data.series.map((d) => ({ label: d.label, value: d.minutes, note: d.sessions ? `${d.sessions} session${d.sessions === 1 ? "" : "s"}` : undefined }));

  function reset() {
    if (window.confirm("Delete all dashboard history stored on this device? Lesson completion and game high scores are not affected.")) clearProgress();
  }

  const rangePicker = (
    <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm" role="radiogroup" aria-label="Time range">
      {RANGES.map((r) => (
        <button
          key={r.id} type="button" role="radio" aria-checked={range === r.id} onClick={() => setRange(r.id)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${range === r.id ? "bg-navy text-white" : "text-mute hover:text-navy"}`}
        >{r.label.replace("Last ", "").replace(" days", "d")}</button>
      ))}
    </div>
  );

  return (
    <DashboardShell title="Your typing dashboard" subtitle="Everything below is calculated from sessions saved on this device. No account needed." actions={hydrated && !isEmpty ? rangePicker : undefined}>
      {!hydrated ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-busy="true" aria-label="Loading your statistics">
          {Array.from({ length: 8 }, (_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white" />)}
        </div>
      ) : isEmpty ? (
        <EmptyState />
      ) : (
        <div className="space-y-6">
          <section aria-label="Overview statistics" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard icon="📈" label="Typing sessions" value={none(data.overview.sessions)} hint={hasData ? `in ${rangeLabel}` : `None in ${rangeLabel}`} tooltip="Finished lessons, tests, drills and games." />
            <StatCard icon="⚡" label="Average WPM" value={none(data.overview.avgWpm)} unit="WPM" accent="sky" hint="Mean of session speeds" tooltip="Words per minute: correct characters ÷ 5 ÷ minutes, averaged over sessions." />
            <StatCard icon="🏆" label="Highest WPM" value={none(data.overview.bestWpm)} unit="WPM" accent="navy" hint="Your best single session" />
            <StatCard icon="🎯" label="Average accuracy" value={none(data.overview.avgAccuracy)} unit="%" hint="Correct ÷ total characters" tooltip="Correct characters ÷ total characters typed, averaged over sessions." />
            <StatCard icon="⏱️" label="Practice time" value={none(formatDuration(data.overview.practiceSeconds))} accent="sky" hint={`in ${rangeLabel}`} />
            <StatCard icon="📘" label="Completed lessons" value={lessonsDone} hint="All time, from the Learn path" accent="navy" tooltip="Lessons you marked complete in the Learn curriculum. Not limited by the time range." />
            <StatCard icon="🎮" label="Completed games" value={none(data.overview.gamesCompleted)} hint={`runs in ${rangeLabel}`} />
            <StatCard icon="🔥" label="Daily streak" value={data.streak} unit={data.streak === 1 ? "day" : "days"} accent="sky" hint={data.streak ? "Keep it going today" : "Practice today to start one"} tooltip="Consecutive days with a finished session of 20+ correct characters. Today or yesterday keeps it current. Streaks unlock pets." />
          </section>

          {!hasData && (
            <p className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-navy" role="status">
              No sessions in {rangeLabel}. Pick a longer range, or <Link href="/setup" className="font-semibold text-brand underline">practice now</Link>.
            </p>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Speed over time" subtitle="Average WPM on days you practiced" empty={!hasData}>
              <LineChart points={wpmPoints} color="#2563eb" unit="WPM" ariaLabel={`Line chart of average WPM per day, ${rangeLabel}`} />
            </ChartCard>
            <ChartCard title="Accuracy over time" subtitle="Average accuracy on days you practiced" empty={!hasData}>
              <LineChart points={accPoints} color="#0ea5e9" unit="%" max={100} ariaLabel={`Line chart of average accuracy per day, ${rangeLabel}`} />
            </ChartCard>
            <ChartCard title="Daily practice duration" subtitle="Minutes practiced each day" empty={!hasData}>
              <BarChart points={minutePoints} color="#2563eb" unit="min" decimals={1} ariaLabel={`Bar chart of practice minutes per day, ${rangeLabel}`} />
            </ChartCard>
            <ChartCard title="English vs Khmer" subtitle="Average speed and accuracy per language" empty={!hasData}>
              <ComparisonBars groups={data.languages} colors={{ english: "#2563eb", khmer: "#0f172a" }} />
            </ChartCard>
          </div>

          <ChartCard title="Performance by difficulty" subtitle="Lessons count as Easy (beginner) or Medium (intermediate); games use the level you picked." empty={!hasData || data.difficulties.every((d) => d.sessions === 0)}>
            <ComparisonBars groups={data.difficulties} colors={{ easy: "#38bdf8", medium: "#2563eb", hard: "#0f172a" }} />
          </ChartCard>

          <ActivityHistory sessions={data.recent} />

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-mute">
            <p>Stored only in this browser. Clearing site data removes it.</p>
            <button type="button" onClick={reset} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-mute hover:border-red-300 hover:text-red-600">Reset dashboard data</button>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function EmptyState() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
      <p className="text-5xl" aria-hidden="true">📊</p>
      <h2 className="mt-4 text-2xl font-extrabold text-navy">Your dashboard is ready for its first session</h2>
      <p className="mx-auto mt-2 max-w-xl text-mute">Finish a typing lesson, test or game and your speed, accuracy, streak and weakest keys appear here. Nothing is shown until there is real data.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/learn/english" className="rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white shadow-sm hover:brightness-110">Practice English</Link>
        <Link href="/learn/khmer" className="rounded-xl bg-navy px-5 py-3 text-sm font-bold text-white shadow-sm hover:brightness-110">Practice Khmer</Link>
        <Link href="/games" className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-navy hover:border-brand hover:text-brand">Play a game</Link>
      </div>
    </section>
  );
}
