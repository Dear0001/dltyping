"use client";

import { useMemo, useState } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import KeyboardHeatmap from "@/components/dashboard/KeyboardHeatmap";
import KeyPerformanceDetail from "@/components/dashboard/KeyPerformanceDetail";
import StatCard from "@/components/dashboard/StatCard";
import { useKeyboardMastery } from "@/hooks/useKeyboardMastery";
import { useKeyStatBook } from "@/hooks/useKeyStatBook";
import { analyzeKeySpeed, MIN_TIMED, msToWpm } from "@/lib/progress/key-speed";
import { useLocale } from "@/components/shared/LocaleProvider";
import { useProgressText } from "@/hooks/useProgressText";
import { keyCapGlyph, MIN_SAMPLES } from "@/lib/progress/keyboard-analytics";
import type { Language } from "@/types";

const LANGUAGES: [Language, string][] = [["english", "km.layoutEn"], ["khmer", "km.layoutKh"]];

export default function KeyboardMasteryView() {
  const { t } = useLocale();
  const pt = useProgressText();
  const [language, setLanguage] = useState<Language>("english");
  const [selected, setSelected] = useState<string | null>(null);
  const { hydrated, analysis, weak, summary } = useKeyboardMastery(language);
  const empty = hydrated && summary.practicedKeys === 0;
  const [mode, setMode] = useState<"accuracy" | "speed">("accuracy");
  const book = useKeyStatBook();
  const speed = useMemo(() => analyzeKeySpeed(language, book[language]), [language, book]);

  const picker = (
    <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm" role="radiogroup" aria-label={t("km.layoutLabel")}>
      {LANGUAGES.map(([id, label]) => (
        <button
          key={id} type="button" role="radio" aria-checked={language === id} onClick={() => { setLanguage(id); setSelected(null); }}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${language === id ? "bg-navy text-white" : "text-mute hover:text-navy"}`}
        >{t(label)}</button>
      ))}
    </div>
  );

  return (
    <DashboardShell title={t("km.title")} subtitle={t("km.subtitle")} actions={picker}>
      <div className="space-y-6">
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label={t("km.summary")}>
          <StatCard loading={!hydrated} icon="⌨️" label={t("km.keysPracticed")} value={hydrated ? summary.practicedKeys : null} hint={t("km.keystrokes", { n: summary.totalKeystrokes.toLocaleString("en-US") })} />
          <StatCard loading={!hydrated} icon="✅" label={t("km.excellent")} value={hydrated ? summary.counts.excellent : null} hint={t("km.acc95")} accent="navy" />
          <StatCard loading={!hydrated} icon="👍" label={t("km.good")} value={hydrated ? summary.counts.good : null} hint={t("km.acc85")} accent="sky" />
          <StatCard loading={!hydrated} icon="⚠️" label={t("km.needs")} value={hydrated ? summary.counts.weak : null} hint={t("km.under85", { n: MIN_SAMPLES })} />
        </section>

        {empty && (
          <p className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-navy" role="status">
            {t("km.noData", { lang: t(`category.${language}`) })}
          </p>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-label={t("km.heatmap")}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-mute">
              {mode === "speed"
                ? speed.overallMs ? <>{t("km.avg")}<strong className="text-navy">{t("km.msPerKey", { ms: Math.round(speed.overallMs) })}</strong>{t("km.avgRest", { wpm: msToWpm(speed.overallMs) })}</> : t("km.speedNeeds", { n: MIN_TIMED })
                : t("km.accColoured")}
            </p>
            <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1" role="radiogroup" aria-label={t("km.measure")}>
              {(["accuracy", "speed"] as const).map((m) => (
                <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => setMode(m)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${mode === m ? "bg-white text-navy shadow-sm" : "text-mute hover:text-navy"}`}>{t(m === "accuracy" ? "km.mAcc" : "km.mSpeed")}</button>
              ))}
            </div>
          </div>
          <KeyboardHeatmap language={language} analysis={analysis} selected={selected} onSelect={setSelected} mode={mode} speed={speed} />
        </section>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <KeyPerformanceDetail analysis={selected ? analysis[selected] ?? null : null} />
          {mode === "speed" ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="slow-keys">
            <h3 id="slow-keys" className="text-base font-extrabold text-navy">{t("km.slowest")}</h3>
            <p className="mt-0.5 text-xs text-mute">{t("km.slowestHelp", { n: MIN_TIMED })}</p>
            {speed.slowest.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-mute">
                {t(speed.ratedKeys === 0 ? "km.noTiming" : "km.noSlow")}
              </p>
            ) : (
              <ol className="mt-3 space-y-2">
                {speed.slowest.map((k) => (
                  <li key={k.code}>
                    <button type="button" onClick={() => setSelected(k.code)} className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition hover:border-red-300 ${selected === k.code ? "border-navy bg-slate-50" : "border-slate-200"}`}>
                      <span className={`grid h-9 min-w-9 place-items-center rounded-lg border border-red-200 bg-red-50 px-1 text-lg font-bold text-red-800 ${language === "khmer" ? "font-khmer" : ""}`}>{keyCapGlyph(language, k.code)}</span>
                      <span className="flex-1 text-sm font-semibold text-navy">{t("km.keyName", { name: pt.keyName(k.code) })}</span>
                      <span className="text-right text-xs text-mute"><strong className="text-base text-red-700">{t("km.ms", { n: Math.round(k.avgMs ?? 0) })}</strong><br />{t("km.timedPresses", { n: k.timed })}</span>
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </section>
          ) : (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="weak-keys">
            <h3 id="weak-keys" className="text-base font-extrabold text-navy">{t("km.weakKeys")}</h3>
            <p className="mt-0.5 text-xs text-mute">{t("km.weakHelp", { n: MIN_SAMPLES })}</p>
            {weak.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-mute">
                {t(summary.practicedKeys === 0 ? "km.nothing" : "km.noWeak")}
              </p>
            ) : (
              <ol className="mt-3 space-y-2">
                {weak.map((k) => (
                  <li key={k.code}>
                    <button type="button" onClick={() => setSelected(k.code)} className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition hover:border-red-300 ${selected === k.code ? "border-navy bg-slate-50" : "border-slate-200"}`}>
                      <span className={`grid h-9 min-w-9 place-items-center rounded-lg border border-red-200 bg-red-50 px-1 text-lg font-bold text-red-800 ${language === "khmer" ? "font-khmer" : ""}`}>{keyCapGlyph(language, k.code)}</span>
                      <span className="flex-1 text-sm font-semibold text-navy">{t("km.keyName", { name: pt.keyName(k.code) })}</span>
                      <span className="text-right text-xs text-mute"><strong className="text-base text-red-700">{k.accuracy}%</strong><br />{t("km.strokes", { n: k.total })}</span>
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </section>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
