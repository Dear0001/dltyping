"use client";

import { useState } from "react";
import type { Instruction } from "@/components/games/shared/GameInstructions";
import { useLocale } from "@/components/shared/LocaleProvider";
import type { CharView } from "@/lib/typing-engine";

/** Compact stat for the in-game HUD (dark frame). */
export function Chip({ label, value, tone = "default" }: { label: string; value: React.ReactNode; tone?: "default" | "good" | "bad" | "gold" }) {
  const color = tone === "good" ? "text-emerald-300" : tone === "bad" ? "text-red-300" : tone === "gold" ? "text-amber-300" : "text-white";
  return <div className="min-w-0 rounded-xl bg-white/10 px-2.5 py-1.5 sm:px-3">
    <div className="truncate text-[10px] font-semibold uppercase tracking-wider text-slate-300">{label}</div>
    <div className={`truncate text-base font-extrabold tabular-nums sm:text-lg ${color}`}>{value}</div>
  </div>;
}

/** Labelled gauge (health, mana, nitro…). `value` is 0-1. */
export function Meter({ label, value, text, color, pulse = false }: { label: string; value: number; text?: string; color: string; pulse?: boolean }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return <div className="min-w-0 flex-1">
    <div className="mb-1 flex justify-between gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-300"><span className="truncate">{label}</span><span className="tabular-nums">{text ?? `${pct}%`}</span></div>
    <div className={`h-2.5 overflow-hidden rounded-full bg-white/15 ${pulse ? "arc-pulse" : ""}`} role="progressbar" aria-label={label} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full transition-[width] duration-150" style={{ width: `${pct}%`, background: color }} />
    </div>
  </div>;
}

const CHAR_CLASS: Record<CharView["state"], string> = {
  correct: "text-emerald-400",
  wrong: "rounded bg-red-500/40 text-red-200",
  partial: "text-sky-300 underline decoration-2 underline-offset-4",
  current: "text-white underline decoration-amber-400 decoration-2 underline-offset-4",
  pending: "text-slate-400",
};

/** Text to type, coloured per character. Khmer is rendered per cluster so syllables stay intact. */
export function TypeLine({ views, khmer, className = "" }: { views: CharView[]; khmer: boolean; className?: string }) {
  return <span lang={khmer ? "km" : "en"} className={`${khmer ? "font-khmer" : "font-semibold tracking-wide"} whitespace-pre-wrap break-words ${className}`}>
    {views.map((c, i) => <span key={i} className={CHAR_CLASS[c.state]}>{c.text === " " && c.state === "wrong" ? "␣" : c.text}</span>)}
  </span>;
}

/** Big button for a game's special move; also the way to use it on touch screens. */
export function ActionButton({ label, hint, ready, onClick, color }: { label: string; hint?: string; ready: boolean; onClick: () => void; color: string }) {
  return <button type="button" onClick={onClick} disabled={!ready} className={`flex-none rounded-xl px-3 py-2 text-sm font-extrabold text-white transition disabled:opacity-40 ${ready ? "arc-pulse shadow-lg" : ""}`} style={{ background: color }}>
    {label}{hint && <kbd className="ml-2 rounded bg-black/25 px-1.5 py-0.5 text-[10px] font-semibold">{hint}</kbd>}
  </button>;
}

export type PickerOption = { id: string; label: string; locked?: boolean; /** How to unlock it. */ how?: string; preview?: React.ReactNode };

/** Tile picker for unlockable choices (cars, tracks, stages…). Locked tiles show how to earn them. */
export function OptionPicker({ label, value, options, onChange, columns = 3 }: { label: string; value: string; options: PickerOption[]; onChange: (id: string) => void; columns?: 2 | 3 | 4 | 6 }) {
  const grid = columns === 2 ? "grid-cols-2" : columns === 4 ? "grid-cols-2 sm:grid-cols-4" : columns === 6 ? "grid-cols-3 sm:grid-cols-6" : "grid-cols-3";
  return <div>
    <div className="mb-1.5 text-xs font-bold uppercase tracking-wider text-mute" id={`pick-${label}`}>{label}</div>
    <div role="radiogroup" aria-labelledby={`pick-${label}`} className={`grid gap-2 ${grid}`}>
      {options.map((option) => <button
        key={option.id}
        type="button"
        role="radio"
        aria-checked={option.id === value}
        aria-disabled={option.locked}
        title={option.locked ? option.how : undefined}
        onClick={() => !option.locked && onChange(option.id)}
        className={`relative flex min-w-0 flex-col items-center gap-1 rounded-xl border-2 px-2 py-2 text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-brand ${option.id === value ? "border-brand bg-blue-50 text-brand" : "border-slate-200 bg-white text-navy hover:border-brand"} ${option.locked ? "cursor-not-allowed opacity-60" : ""}`}
      >
        {option.preview}
        <span className="max-w-full truncate">{option.locked ? "🔒 " : ""}{option.label}</span>
        {option.locked && option.how && <span className="text-center text-[10px] font-medium leading-tight text-mute">{option.how}</span>}
      </button>)}
    </div>
  </div>;
}

/** m:ss.t for race and survival clocks. */
export function formatTime(ms: number) {
  const tenths = Math.floor(Math.max(0, ms) / 100);
  return `${Math.floor(tenths / 600)}:${String(Math.floor(tenths / 10) % 60).padStart(2, "0")}.${tenths % 10}`;
}

/** Visual step-by-step tutorial: one big illustrated step at a time, with dots and Back/Next. */
export function Tutorial({ steps, firstTime = false }: { steps: Instruction[]; firstTime?: boolean }) {
  const { t } = useLocale();
  const [index, setIndex] = useState(0);
  const step = steps[index];
  const last = index === steps.length - 1;
  if (!step) return null;
  const nav = "grid h-8 min-w-8 place-items-center rounded-lg px-2.5 text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-35";
  return <div>
    {firstTime && <p className="mb-2 inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">{t("gm.newHere")}</p>}
    <div className="relative flex min-h-36 items-center gap-4 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-5 text-white" aria-live="polite">
      <span aria-hidden="true" className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-sky-400/10" />
      <span key={index} className="gm-pop grid h-16 w-16 flex-none place-items-center rounded-2xl bg-white/10 text-4xl shadow-inner" aria-hidden="true">{step.icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-sky-300">{t("arc.stepOf", { n: index + 1, total: steps.length })}</p>
        <h3 className="mt-0.5 text-base font-extrabold">{step.title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-slate-300">{step.text}</p>
      </div>
    </div>
    <div className="mt-2.5 flex items-center justify-between gap-2">
      <div className="flex gap-1.5">
        {steps.map((s, i) => <button key={i} type="button" onClick={() => setIndex(i)} aria-label={`${i + 1}. ${s.title}`} aria-current={i === index ? "step" : undefined}
          className={`h-2.5 rounded-full transition-all ${i === index ? "w-6 bg-brand" : "w-2.5 bg-slate-300 hover:bg-slate-400"}`} />)}
      </div>
      <div className="flex gap-1.5">
        <button type="button" className={`${nav} bg-slate-100 text-navy hover:bg-slate-200`} disabled={index === 0} onClick={() => setIndex(index - 1)} aria-label={t("arc.prevStep")}>←</button>
        <button type="button" className={`${nav} bg-brand text-white hover:bg-blue-700`} onClick={() => setIndex(last ? 0 : index + 1)}>{last ? t("arc.restartTutorial") : t("arc.nextStep")}</button>
      </div>
    </div>
  </div>;
}

/** Large result tile for the game-over headline (score, WPM, accuracy…). */
export function ResultTile({ label, value, icon, tone = "default" }: { label: string; value: React.ReactNode; icon?: string; tone?: "default" | "good" | "bad" | "brand" }) {
  const color = tone === "good" ? "text-good" : tone === "bad" ? "text-bad" : tone === "brand" ? "text-brand" : "text-navy";
  return <div className="min-w-0 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-center shadow-sm">
    <div className="truncate text-[11px] font-bold text-mute">{icon && <span aria-hidden="true">{icon} </span>}{label}</div>
    <div className={`mt-0.5 truncate text-2xl font-extrabold tabular-nums ${color}`}>{value}</div>
  </div>;
}
