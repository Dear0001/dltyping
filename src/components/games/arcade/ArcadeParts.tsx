"use client";

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
