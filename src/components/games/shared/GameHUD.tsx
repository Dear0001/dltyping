import { formatClock } from "@/lib/game-engine";
import { useLocale } from "@/components/shared/LocaleProvider";

export function HudStat({ label, value, tone = "default", sub }: { label: string; value: React.ReactNode; tone?: "default" | "good" | "bad" | "brand"; sub?: string }) {
  const color = tone === "good" ? "text-good" : tone === "bad" ? "text-bad" : tone === "brand" ? "text-brand" : "text-navy";
  return <div className="min-w-0 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm sm:px-4">
    <div className="text-[10px] font-semibold uppercase tracking-wider text-mute">{label}</div>
    <div className={`truncate text-xl font-extrabold tabular-nums sm:text-2xl ${color}`}>{value}{sub && <span className="ml-1 text-xs font-semibold text-mute">{sub}</span>}</div>
  </div>;
}

export function GameScore({ score }: { score: number }) {
  const { t } = useLocale();
  return <HudStat label={t("gm.score")} value={score.toLocaleString("en-US")} tone="brand" />;
}

export function GameTimer({ label, ms, low = 10000 }: { label?: string; ms: number; low?: number }) {
  const { t } = useLocale();
  return <HudStat label={label ?? t("gm.time")} value={formatClock(ms)} tone={ms <= low ? "bad" : "default"} />;
}

export function Hearts({ lives, max }: { lives: number; max: number }) {
  const { t } = useLocale();
  return <div className="min-w-0 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm sm:px-4">
    <div className="text-[10px] font-semibold uppercase tracking-wider text-mute">{t("gm.lives")}</div>
    <div className="flex gap-1 text-xl sm:text-2xl" role="img" aria-label={t("gm.livesAria", { lives, max })}>
      {Array.from({ length: max }, (_, i) => <span key={i} className={i < lives ? "text-bad" : "text-slate-300"}>{i < lives ? "♥" : "♡"}</span>)}
    </div>
  </div>;
}

export function ComboBadge({ combo, multiplier }: { combo: number; multiplier: number }) {
  const { t } = useLocale();
  return <HudStat label={t("gm.combo")} value={combo} tone={combo >= 5 ? "good" : "default"} sub={multiplier > 1 ? `×${multiplier}` : undefined} />;
}

export function GameProgress({ value, label }: { value: number; label?: string }) {
  const { t } = useLocale();
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return <div>
    {label && <div className="mb-1 flex justify-between text-xs font-semibold text-mute"><span>{label}</span><span>{pct}%</span></div>}
    <div className="h-3 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label ?? t("gm.progress")}>
      <div className="h-full rounded-full bg-gradient-to-r from-brand to-accent transition-[width] duration-300" style={{ width: `${pct}%` }} />
    </div>
  </div>;
}
