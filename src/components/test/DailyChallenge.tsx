"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import TypingRun from "@/components/test/TypingRun";
import WpmChart from "@/components/test/WpmChart";
import { useLocale } from "@/components/shared/LocaleProvider";
import { useStoredValue } from "@/hooks/use-stored-value";
import { useNow } from "@/hooks/useTypingProgress";
import { averageWpm } from "@/lib/article-length";
import { DAILY_KEY, EMPTY_DAILY, dailyChallenge, dailyStreak, goalMet, recentDays, recordAttempt, validateDaily, type DailyEntry } from "@/lib/daily-challenge";
import { dayKey } from "@/lib/progress/progress-analytics";
import { readStore } from "@/lib/progress/progress-storage";
import type { RunResult } from "@/lib/typing-test";
import type { Language } from "@/types";


/** /daily: one challenge per calendar day, the same for everyone, with a streak for days completed. */
export default function DailyChallenge() {
  const { locale, t } = useLocale();
  const km = locale === "km";
  const now = useNow(); // 0 while server rendering: "today" is only known on the client
  const today = now ? dayKey(now) : null;
  const [language, setLanguage] = useState<Language>("english");
  const [run, setRun] = useState(0);
  const [result, setResult] = useState<{ run: RunResult; met: boolean; entry: DailyEntry } | null>(null);
  const book = useStoredValue(DAILY_KEY, EMPTY_DAILY, validateDaily);

  // The speed goal is fixed for the day from your average when the page opens, so finishing a run never moves it.
  const challenge = useMemo(() => (today ? dailyChallenge(today, language, averageWpm(readStore(), language)) : null), [today, language]);

  if (!today || !challenge) {
    return <main className="min-h-screen bg-surface"><div className="mx-auto max-w-5xl px-4 pt-8 sm:px-6"><div className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white" aria-busy="true" /></div></main>;
  }

  const todayEntry = book[today]?.[language];
  const streak = dailyStreak(book, today);
  const week = recentDays(book, today, 7);
  const goals = [
    challenge.targetWpm !== null ? `${challenge.targetWpm}+ WPM` : null,
    `${challenge.minAccuracy}%+ ${t("daily.accuracy")}`,
  ].filter(Boolean).join(t("daily.and"));

  function handleFinish(r: RunResult) {
    const met = goalMet(challenge!, r.wpm, r.accuracy);
    const entry = recordAttempt(today!, language, r.wpm, r.accuracy, met);
    setResult({ run: r, met, entry });
  }

  function retry() {
    setRun((n) => n + 1);
    setResult(null);
  }

  const dateLabel = new Date(now).toLocaleDateString(t("daily.enUs"), { weekday: "long", month: "long", day: "numeric" });

  return (
    <main className="min-h-screen bg-surface text-navy">
      <div className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand">{t("daily.dailyChallenge")} · {dateLabel}</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">{challenge.icon} {km ? challenge.titleKm : challenge.title}</h1>
            <p className="mt-1 max-w-2xl text-mute">{km ? challenge.blurbKm : challenge.blurb}</p>
          </div>
          <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm" role="radiogroup" aria-label={t("daily.language")}>
            {([["english", "English"], ["khmer", "ខ្មែរ"]] as const).map(([id, label]) => (
              <button key={id} type="button" role="radio" aria-checked={language === id} onClick={() => { setLanguage(id); setResult(null); setRun((n) => n + 1); }}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${language === id ? "bg-navy text-white" : "text-mute hover:text-navy"}`}>{label}</button>
            ))}
          </div>
        </header>

        <section className="mb-5 grid gap-3 sm:grid-cols-3" aria-label={t("daily.summary")}>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-mute">{t("daily.todaySGoal")}</p>
            <p className="mt-1 text-lg font-extrabold">{goals}</p>
            <p className="text-xs text-mute">{challenge.durationSec}s{challenge.targetWpm !== null ? (t("daily.speedGoalBasedOnYour")) : ""}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-mute">{t("daily.dailyStreak")}</p>
            <p className="mt-1 text-lg font-extrabold">🔥 {streak} {t(streak === 1 ? "dash.day" : "dash.days")}</p>
            <ol className="mt-2 flex gap-1.5" aria-label={t("daily.last7Days")}>
              {week.map((d) => {
                const [y, m, dd] = d.date.split("-").map(Number);
                const wd = new Date(y, m - 1, dd).getDay();
                return (
                  <li key={d.date} className="flex flex-col items-center gap-0.5" title={`${d.date}: ${d.done ? (t("daily.completed")) : t("daily.notCompleted")}`}>
                    <span className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold ${d.done ? "bg-brand text-white" : d.date === today ? "border-2 border-dashed border-brand text-brand" : "bg-slate-100 text-slate-400"}`}>{d.done ? "✓" : ""}</span>
                    <span className="text-[9px] text-mute">{t(`daily.wd${wd}`)}</span>
                  </li>
                );
              })}
            </ol>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-mute">{t("daily.todaySBest")}</p>
            {todayEntry ? (
              <>
                <p className="mt-1 text-lg font-extrabold">{todayEntry.wpm} WPM · {todayEntry.accuracy}%</p>
                <p className={`text-xs font-bold ${todayEntry.done ? "text-emerald-700" : "text-mute"}`}>{todayEntry.done ? (t("daily.completedx")) : t("daily.goalNotReachedYet")} · {todayEntry.attempts} {t(todayEntry.attempts === 1 ? "daily.tryOne" : "daily.tryMany")}</p>
              </>
            ) : <p className="mt-1 text-sm text-mute">{t("daily.noAttemptYet")}</p>}
          </div>
        </section>

        {result ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7" aria-labelledby="daily-result">
            <p id="daily-result" className={`rounded-xl px-4 py-3 text-base font-extrabold ${result.met ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`} role="status">
              {result.met ? (t("daily.challengeCompleteComeBackTomorrow")) : t("daily.notQuiteHaveAnotherGo")}
            </p>
            <dl className="mt-5 grid grid-cols-3 gap-2">
              {([
                ["WPM", result.run.wpm, challenge.targetWpm === null || result.run.wpm >= challenge.targetWpm],
                [t("daily.accuracyx"), `${result.run.accuracy}%`, result.run.accuracy >= challenge.minAccuracy],
                [t("daily.errors"), result.run.errors, true],
              ] as const).map(([label, value, ok]) => (
                <div key={label} className="rounded-xl bg-slate-50 p-3">
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-mute">{label}</dt>
                  <dd className="text-2xl font-extrabold text-navy">{value} <span className={`text-sm ${ok ? "text-emerald-700" : "text-red-600"}`} aria-label={ok ? "goal met" : "goal missed"}>{ok ? "✓" : "✗"}</span></dd>
                </div>
              ))}
            </dl>
            <div className="mt-6"><WpmChart samples={result.run.samples} /></div>
            <div className="mt-6 flex flex-wrap gap-2">
              <button type="button" autoFocus onClick={retry} className="rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white">↻ {t("daily.tryAgain")}</button>
              <Link href="/test" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-navy">⏱️ {t("daily.freeTypingTest")}</Link>
              <Link href="/dashboard" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-navy">📊 {t("daily.dashboard")}</Link>
            </div>
          </section>
        ) : (
          <TypingRun key={`${run}:${language}:${today}`} language={language} text={challenge.text} durationSec={challenge.durationSec}
            difficulty={challenge.difficulty === "mixed" ? null : challenge.difficulty} detail={`Daily · ${challenge.title}`} onFinish={handleFinish} />
        )}
      </div>
    </main>
  );
}
