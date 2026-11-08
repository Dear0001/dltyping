"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import TypingRun from "@/components/test/TypingRun";
import WpmChart from "@/components/test/WpmChart";
import { useLocale } from "@/components/shared/LocaleProvider";
import { useStoredValue } from "@/hooks/use-stored-value";
import type { Difficulty } from "@/lib/game-engine";
import {
  DEFAULT_TEST_DURATION, EMPTY_BESTS, TEST_BESTS_KEY, TEST_DURATIONS, bestKey, buildWordText, consistency, saveBest, validateBests, wordsNeeded,
  type RunResult, type TestBest, type TestDuration,
} from "@/lib/typing-test";
import type { Language } from "@/types";

const DIFFICULTIES: { id: Difficulty; en: string; km: string }[] = [
  { id: "easy", en: "Short words", km: "ពាក្យខ្លី" },
  { id: "medium", en: "Everyday words", km: "ពាក្យប្រចាំថ្ងៃ" },
  { id: "hard", en: "Long words", km: "ពាក្យវែង" },
];

const newSeed = () => Math.floor(Math.random() * 0xffffffff);

function Segmented<T extends string | number>({ label, value, options, onChange }: { label: string; value: T; options: { id: T; text: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-bold uppercase tracking-wider text-mute">{label}</span>
      <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button key={String(o.id)} type="button" role="radio" aria-checked={value === o.id} onClick={() => onChange(o.id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${value === o.id ? "bg-navy text-white" : "text-mute hover:text-navy"}`}>{o.text}</button>
        ))}
      </div>
    </div>
  );
}

/** /test: a standard timed typing test on random words, with a results screen and personal bests. */
export default function TypingTest() {
  const { locale } = useLocale();
  const km = locale === "km";
  const [language, setLanguage] = useState<Language>("english");
  const [duration, setDuration] = useState<TestDuration>(DEFAULT_TEST_DURATION);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  // Random words are drawn on the client only: Math.random() during prerender is an error with Cache Components.
  const [seed, setSeed] = useState<number | null>(null);
  const [run, setRun] = useState(0);
  const [result, setResult] = useState<{ run: RunResult; previous: TestBest | null; isBest: boolean } | null>(null);
  const bests = useStoredValue(TEST_BESTS_KEY, EMPTY_BESTS, validateBests);
  const best = bests[bestKey(language, duration)];

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSeed(newSeed());
  }, []);

  const text = useMemo(() => (seed === null ? "" : buildWordText(language, difficulty, wordsNeeded(duration), seed)), [language, difficulty, duration, seed]);

  /** A fresh test with new words; `same` retries the identical text. */
  function restart(same = false) {
    if (!same) setSeed(newSeed());
    setRun((r) => r + 1);
    setResult(null);
  }

  // Escape anywhere starts a new test, so the hands never have to leave the keyboard.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      setSeed(newSeed());
      setRun((r) => r + 1);
      setResult(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function change(fn: () => void) {
    fn();
    restart();
  }

  function handleFinish(run: RunResult) {
    const saved = saveBest(run, new Date().toISOString());
    setResult({ run, ...saved });
  }

  return (
    <main className="min-h-screen bg-surface text-navy">
      <div className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand">{km ? "តេស្តវាយអក្សរ" : "Typing test"}</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">{km ? "តើអ្នកវាយលឿនប៉ុណ្ណា?" : "How fast do you type?"}</h1>
            <p className="mt-1 max-w-2xl text-mute">{km ? "ពាក្យចៃដន្យ ម៉ោងកំណត់។ ម៉ោងចាប់ផ្តើមនៅពេលអ្នកវាយ។" : "Random words, fixed time. The clock starts when you do."}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-right shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-mute">{km ? "កំណត់ត្រាល្អបំផុត" : "Personal best"} · {duration}s</p>
            <p className="text-xl font-extrabold text-navy">{best ? <>{best.wpm} <span className="text-sm text-mute">WPM · {best.accuracy}%</span></> : <span className="text-sm font-semibold text-mute">—</span>}</p>
          </div>
        </header>

        <div className="mb-5 flex flex-wrap gap-x-6 gap-y-3">
          <Segmented label={km ? "ភាសា" : "Language"} value={language} onChange={(v) => change(() => setLanguage(v))} options={[{ id: "english", text: "English" }, { id: "khmer", text: "ខ្មែរ" }]} />
          <Segmented label={km ? "ពេល" : "Time"} value={duration} onChange={(v) => change(() => setDuration(v))} options={TEST_DURATIONS.map((d) => ({ id: d, text: `${d}s` }))} />
          <Segmented label={km ? "ពាក្យ" : "Words"} value={difficulty} onChange={(v) => change(() => setDifficulty(v))} options={DIFFICULTIES.map((d) => ({ id: d.id, text: km ? d.km : d.en }))} />
        </div>

        {result ? (
          <Results result={result} km={km} onNext={() => restart()} onRetry={() => restart(true)} />
        ) : text ? (
          <TypingRun key={`${run}:${seed}:${language}:${duration}:${difficulty}`} language={language} text={text} durationSec={duration} difficulty={difficulty} detail={`${duration}s test`} onFinish={handleFinish} />
        ) : (
          <div className="h-56 animate-pulse rounded-2xl border border-slate-200 bg-white" aria-busy="true" />
        )}

        {!result && (
          <p className="mt-4 text-xs text-mute">
            <kbd className="rounded border border-slate-300 bg-white px-1.5 py-0.5 font-sans">Esc</kbd> {km ? "តេស្តថ្មី" : "new test"}
          </p>
        )}
      </div>
    </main>
  );
}

function Results({ result, km, onNext, onRetry }: { result: { run: RunResult; previous: TestBest | null; isBest: boolean }; km: boolean; onNext: () => void; onRetry: () => void }) {
  const { run, previous, isBest } = result;
  const steady = consistency(run.samples);
  const stats: [string, string | number, string?][] = [
    [km ? "ភាពត្រឹមត្រូវ" : "Accuracy", `${run.accuracy}%`],
    [km ? "WPM សរុប" : "Raw WPM", run.rawWpm, km ? "រាប់ទាំងកំហុស" : "counts errors too"],
    [km ? "ភាពស្ថិតស្ថេរ" : "Consistency", `${steady}%`, km ? "ល្បឿនស្មើ" : "how even your pace was"],
    [km ? "កំហុស" : "Errors", run.errors],
    [km ? "តួអក្សរត្រូវ" : "Correct chars", run.correct],
    [km ? "ពេល" : "Time", `${run.durationSec}s`],
  ];
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7" aria-labelledby="test-result">
      <div className="flex flex-wrap items-center gap-6">
        <div>
          <p id="test-result" className="text-[10px] font-bold uppercase tracking-wider text-mute">{km ? "លទ្ធផល" : "Your speed"}</p>
          <p className="text-6xl font-extrabold leading-none text-brand">{run.wpm}<span className="ml-2 text-xl text-mute">WPM</span></p>
        </div>
        {isBest ? (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-extrabold text-amber-800" role="status">🏆 {km ? "កំណត់ត្រាថ្មី!" : "New personal best!"}{previous ? ` (+${run.wpm - previous.wpm})` : ""}</p>
        ) : previous ? (
          <p className="text-sm text-mute">{km ? "កំណត់ត្រា" : "Best"}: <b className="text-navy">{previous.wpm} WPM</b>{run.accuracy < 80 ? (km ? " · ត្រូវការ 80%+ ដើម្បីកំណត់ត្រា" : " · records need 80%+ accuracy") : ""}</p>
        ) : null}
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map(([label, value, hint]) => (
          <div key={label} className="rounded-xl bg-slate-50 p-3" title={hint}>
            <dt className="text-[10px] font-bold uppercase tracking-wider text-mute">{label}</dt>
            <dd className="text-xl font-extrabold text-navy">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-6"><WpmChart samples={run.samples} km={km} /></div>
      <div className="mt-6 flex flex-wrap gap-2">
        <button type="button" autoFocus onClick={onNext} className="rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white">{km ? "តេស្តបន្ទាប់" : "Next test"} →</button>
        <button type="button" onClick={onRetry} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-navy">↻ {km ? "សាកម្តងទៀត" : "Retry same words"}</button>
        <Link href="/dashboard/keyboard-mastery" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-navy">⌨️ {km ? "មើលគ្រាប់ចុចយឺត" : "See your slow keys"}</Link>
      </div>
    </section>
  );
}
