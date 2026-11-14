"use client";

import BestAlert from "@/components/shared/BestAlert";
import { HudStat } from "./GameHUD";
import { useLocale } from "@/components/shared/LocaleProvider";

export type ResultRow = { label: string; value: React.ReactNode; tone?: "default" | "good" | "bad" | "brand" };

export default function GameResults({ rows, newBest, best, stars, bestLabel }: { rows: ResultRow[]; newBest: boolean; best: number; stars?: number; bestLabel?: string }) {
  const { t } = useLocale();
  return <div className="space-y-4">
    {newBest && <BestAlert score={best} />}
    {stars !== undefined && <div className="flex justify-center gap-1 text-4xl" role="img" aria-label={t("gm.starsAria", { n: stars })}>
      {[1, 2, 3].map((n) => <span key={n} className={n <= stars ? "text-amber-400" : "text-slate-300"}>★</span>)}
    </div>}
    {rows.length > 0 && <ResultGrid rows={rows} />}
    <p className={`rounded-xl px-4 py-2.5 text-center text-sm font-semibold ${newBest ? "bg-emerald-50 text-good" : "bg-slate-100 text-mute"}`}>
      {newBest ? t("gm.newBest", { n: best.toLocaleString("en-US") }) : best > 0 ? t("gm.bestOnDevice", { label: bestLabel ?? t("gm.bestScore"), n: best.toLocaleString("en-US") }) : t("gm.noBestYet")}
    </p>
  </div>;
}

/** Plain grid of result stats (no best-score line). */
export function ResultGrid({ rows }: { rows: ResultRow[] }) {
  return <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
    {rows.map((row) => <HudStat key={row.label} label={row.label} value={row.value} tone={row.tone} />)}
  </div>;
}
