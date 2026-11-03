import type { ReactNode } from "react";

type Props = {
  label: string;
  /** null renders an em dash, so an empty history never shows a misleading 0. */
  value: string | number | null;
  unit?: string;
  hint?: string;
  icon: string;
  /** Explains how the number is calculated. */
  tooltip?: string;
  accent?: "brand" | "sky" | "navy";
  children?: ReactNode;
};

const TINT = { brand: "bg-blue-50 text-brand", sky: "bg-sky-50 text-sky-700", navy: "bg-slate-100 text-navy" } as const;

export default function StatCard({ label, value, unit, hint, icon, tooltip, accent = "brand", children }: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" title={tooltip}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-mute">{label}</p>
        <span className={`grid h-8 w-8 flex-none place-items-center rounded-lg text-base ${TINT[accent]}`} aria-hidden="true">{icon}</span>
      </div>
      <p className="mt-2 text-3xl font-extrabold tabular-nums leading-none text-navy">
        {value ?? "—"}
        {value !== null && unit && <span className="ml-1 text-sm font-semibold text-mute">{unit}</span>}
      </p>
      {hint && <p className="mt-1.5 text-xs text-mute">{hint}</p>}
      {children}
    </div>
  );
}
