import { formatClock } from "@/lib/game-engine";

export function HudStat({ label, value, tone = "default", sub }: { label: string; value: React.ReactNode; tone?: "default" | "good" | "bad" | "brand"; sub?: string }) {
  const color = tone === "good" ? "text-good" : tone === "bad" ? "text-bad" : tone === "brand" ? "text-brand" : "text-navy";
  return <div className="min-w-0 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm sm:px-4">
    <div className="text-[10px] font-semibold uppercase tracking-wider text-mute">{label}</div>
    <div className={`truncate text-xl font-extrabold tabular-nums sm:text-2xl ${color}`}>{value}{sub && <span className="ml-1 text-xs font-semibold text-mute">{sub}</span>}</div>
  </div>;
}

export function GameScore({ score }: { score: number }) {
  return <HudStat label="Score" value={score.toLocaleString("en-US")} tone="brand" />;
}

export function GameTimer({ label = "Time", ms, low = 10000 }: { label?: string; ms: number; low?: number }) {
  return <HudStat label={label} value={formatClock(ms)} tone={ms <= low ? "bad" : "default"} />;
}

export function Hearts({ lives, max }: { lives: number; max: number }) {
  return <div className="min-w-0 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm sm:px-4">
    <div className="text-[10px] font-semibold uppercase tracking-wider text-mute">Lives</div>
    <div className="flex gap-1 text-xl sm:text-2xl" role="img" aria-label={`${lives} of ${max} lives`}>
      {Array.from({ length: max }, (_, i) => <span key={i} className={i < lives ? "text-bad" : "text-slate-300"}>{i < lives ? "♥" : "♡"}</span>)}
    </div>
  </div>;
}

export function ComboBadge({ combo, multiplier }: { combo: number; multiplier: number }) {
  return <HudStat label="Combo" value={combo} tone={combo >= 5 ? "good" : "default"} sub={multiplier > 1 ? `×${multiplier}` : undefined} />;
}

export function GameProgress({ value, label }: { value: number; label?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return <div>
    {label && <div className="mb-1 flex justify-between text-xs font-semibold text-mute"><span>{label}</span><span>{pct}%</span></div>}
    <div className="h-3 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label ?? "Progress"}>
      <div className="h-full rounded-full bg-gradient-to-r from-brand to-accent transition-[width] duration-300" style={{ width: `${pct}%` }} />
    </div>
  </div>;
}
