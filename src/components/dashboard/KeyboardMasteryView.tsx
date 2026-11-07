"use client";

import { useState } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import KeyboardHeatmap from "@/components/dashboard/KeyboardHeatmap";
import KeyPerformanceDetail from "@/components/dashboard/KeyPerformanceDetail";
import StatCard from "@/components/dashboard/StatCard";
import { useKeyboardMastery } from "@/hooks/useKeyboardMastery";
import { keyCapGlyph, MIN_SAMPLES, physicalKeyName } from "@/lib/progress/keyboard-analytics";
import type { Language } from "@/types";

const LANGUAGES: [Language, string][] = [["english", "English QWERTY"], ["khmer", "Khmer NiDA"]];

export default function KeyboardMasteryView() {
  const [language, setLanguage] = useState<Language>("english");
  const [selected, setSelected] = useState<string | null>(null);
  const { hydrated, analysis, weak, summary } = useKeyboardMastery(language);
  const empty = hydrated && summary.practicedKeys === 0;

  const picker = (
    <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm" role="radiogroup" aria-label="Keyboard layout">
      {LANGUAGES.map(([id, label]) => (
        <button
          key={id} type="button" role="radio" aria-checked={language === id} onClick={() => { setLanguage(id); setSelected(null); }}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${language === id ? "bg-navy text-white" : "text-mute hover:text-navy"}`}
        >{label}</button>
      ))}
    </div>
  );

  return (
    <DashboardShell title="Keyboard mastery" subtitle="See which physical keys you type accurately and which need work. Switch between Mac and Windows boards with the keyboard controls." actions={picker}>
      <div className="space-y-6">
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Mastery summary">
          <StatCard loading={!hydrated} icon="⌨️" label="Keys practiced" value={hydrated ? summary.practicedKeys : null} hint={`${summary.totalKeystrokes.toLocaleString("en-US")} keystrokes`} />
          <StatCard loading={!hydrated} icon="✅" label="Excellent" value={hydrated ? summary.counts.excellent : null} hint="95%+ accuracy" accent="navy" />
          <StatCard loading={!hydrated} icon="👍" label="Good" value={hydrated ? summary.counts.good : null} hint="85-94% accuracy" accent="sky" />
          <StatCard loading={!hydrated} icon="⚠️" label="Needs improvement" value={hydrated ? summary.counts.weak : null} hint={`under 85%, ${MIN_SAMPLES}+ keystrokes`} />
        </section>

        {empty && (
          <p className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-navy" role="status">
            No {language === "khmer" ? "Khmer" : "English"} key data yet. Finish a practice session or game and every key lights up here.
          </p>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-label="Keyboard heatmap">
          <KeyboardHeatmap language={language} analysis={analysis} selected={selected} onSelect={setSelected} />
        </section>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <KeyPerformanceDetail analysis={selected ? analysis[selected] ?? null : null} />
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="weak-keys">
            <h3 id="weak-keys" className="text-base font-extrabold text-navy">Weak keys</h3>
            <p className="mt-0.5 text-xs text-mute">Keys under 85% accuracy with at least {MIN_SAMPLES} keystrokes.</p>
            {weak.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-mute">
                {summary.practicedKeys === 0 ? "Nothing to analyse yet." : "No weak keys found. Either everything is solid, or keys still need more keystrokes to be rated."}
              </p>
            ) : (
              <ol className="mt-3 space-y-2">
                {weak.map((k) => (
                  <li key={k.code}>
                    <button type="button" onClick={() => setSelected(k.code)} className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition hover:border-red-300 ${selected === k.code ? "border-navy bg-slate-50" : "border-slate-200"}`}>
                      <span className={`grid h-9 min-w-9 place-items-center rounded-lg border border-red-200 bg-red-50 px-1 text-lg font-bold text-red-800 ${language === "khmer" ? "font-khmer" : ""}`}>{keyCapGlyph(language, k.code)}</span>
                      <span className="flex-1 text-sm font-semibold text-navy">Key {physicalKeyName(k.code)}</span>
                      <span className="text-right text-xs text-mute"><strong className="text-base text-red-700">{k.accuracy}%</strong><br />{k.total} keystrokes</span>
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>
    </DashboardShell>
  );
}
