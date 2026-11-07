import BestAlert from "@/components/shared/BestAlert";
import { HudStat } from "./GameHUD";

export type ResultRow = { label: string; value: React.ReactNode; tone?: "default" | "good" | "bad" | "brand" };

export default function GameResults({ rows, newBest, best, stars, bestLabel = "Best score" }: { rows: ResultRow[]; newBest: boolean; best: number; stars?: number; bestLabel?: string }) {
  return <div className="space-y-4">
    {newBest && <BestAlert score={best} />}
    {stars !== undefined && <div className="flex justify-center gap-1 text-4xl" role="img" aria-label={`${stars} of 3 stars`}>
      {[1, 2, 3].map((n) => <span key={n} className={n <= stars ? "text-amber-400" : "text-slate-300"}>★</span>)}
    </div>}
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {rows.map((row) => <HudStat key={row.label} label={row.label} value={row.value} tone={row.tone} />)}
    </div>
    <p className={`rounded-xl px-4 py-2.5 text-center text-sm font-semibold ${newBest ? "bg-emerald-50 text-good" : "bg-slate-100 text-mute"}`}>
      {newBest ? `🏆 New personal best on this device: ${best.toLocaleString("en-US")}` : `${bestLabel} on this device: ${best.toLocaleString("en-US")}`}
    </p>
  </div>;
}
