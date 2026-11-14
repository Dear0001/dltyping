"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocale } from "@/components/shared/LocaleProvider";

export type ChartPoint = { label: string; value: number | null; note?: string };

const GRID = "#e2e8f0";
const AXIS = "#64748b";

/** Measured width so SVG text stays a readable size at any screen width. */
function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(560);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setWidth(Math.max(240, Math.round(el.clientWidth)));
    update();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Axis label with enough decimals that small ranges (e.g. 0.2 min) don't repeat. */
const tickLabel = (v: number, top: number) => (top >= 5 ? String(Math.round(v)) : top >= 1 ? v.toFixed(1) : v.toFixed(2));

/** Rounds a maximum up to a tidy axis value. */
function niceMax(max: number) {
  if (max <= 0) return 10;
  const pow = 10 ** Math.floor(Math.log10(max));
  const n = max / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
}

export function ChartCard({ title, subtitle, children, empty, emptyText, action }: { title: string; subtitle?: string; children: ReactNode; empty?: boolean; emptyText?: string; action?: ReactNode }) {
  const { t } = useLocale();
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-base font-extrabold text-navy">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-mute">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="mt-4">
        {empty ? (
          <div className="grid h-40 place-items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 text-center text-sm text-mute">{emptyText ?? t("dash.chartEmpty")}</div>
        ) : children}
      </div>
    </section>
  );
}

type SeriesProps = {
  points: ChartPoint[];
  color: string;
  unit: string;
  ariaLabel: string;
  /** Fixed axis maximum (e.g. 100 for accuracy). Auto-scaled otherwise. */
  max?: number;
  height?: number;
  decimals?: number;
};

const PAD = { l: 38, r: 12, t: 12, b: 26 };

function Axes({ width, height, max, unit, labels, count }: { width: number; height: number; max: number; unit: string; labels: { i: number; text: string }[]; count: number }) {
  const innerH = height - PAD.t - PAD.b;
  return (
    <>
      {[0, 0.25, 0.5, 0.75, 1].map((f) => {
        const y = PAD.t + innerH * (1 - f);
        return (
          <g key={f}>
            <line x1={PAD.l} x2={width - PAD.r} y1={y} y2={y} stroke={GRID} strokeWidth={1} />
            <text x={PAD.l - 6} y={y + 3.5} textAnchor="end" fontSize={10} fill={AXIS}>{Math.round(max * f)}{unit === "%" ? "%" : ""}</text>
          </g>
        );
      })}
      {labels.map(({ i, text }) => (
        <text key={i} x={xAt(i, count, width)} y={height - 7} textAnchor="middle" fontSize={10} fill={AXIS}>{text}</text>
      ))}
    </>
  );
}

const xAt = (i: number, count: number, width: number) => {
  const inner = width - PAD.l - PAD.r;
  return count <= 1 ? PAD.l + inner / 2 : PAD.l + (inner * i) / (count - 1);
};

/** About five evenly spaced x labels. */
const pickLabels = (points: ChartPoint[], maxLabels: number) => {
  const step = Math.max(1, Math.ceil(points.length / maxLabels));
  const last = points.length - 1;
  // Skip a regular label that would crowd the final one.
  return points.map((p, i) => ({ i, text: p.label })).filter(({ i }) => i === last || (i % step === 0 && last - i >= step / 2));
};

function Tooltip({ x, width, children }: { x: number; width: number; children: ReactNode }) {
  const flip = x > width * 0.65;
  return (
    <div
      role="status"
      className="pointer-events-none absolute top-1 z-10 whitespace-nowrap rounded-lg bg-navy px-2.5 py-1.5 text-xs text-white shadow-lg"
      style={{ left: x, transform: `translateX(${flip ? "calc(-100% - 10px)" : "10px"})` }}
    >
      {children}
    </div>
  );
}

/** Line chart over time. Days without practice are skipped, never drawn as zero. */
export function LineChart({ points, color, unit, ariaLabel, max, height = 220, decimals = 0 }: SeriesProps) {
  const { t } = useLocale();
  const [ref, width] = useWidth();
  const [active, setActive] = useState<number | null>(null);
  const values = points.map((p) => p.value).filter((v): v is number => v !== null);
  const top = max ?? niceMax(Math.max(...values, 0) * 1.1);
  const innerH = height - PAD.t - PAD.b;
  const y = (v: number) => PAD.t + innerH * (1 - Math.min(v, top) / top);
  const plotted = points.map((p, i) => (p.value === null ? null : { i, x: xAt(i, points.length, width), y: y(p.value), p })).filter((v): v is NonNullable<typeof v> => v !== null);
  const path = plotted.map((d, k) => `${k ? "L" : "M"}${d.x.toFixed(1)} ${d.y.toFixed(1)}`).join(" ");
  // Soft fill under the line makes the trend easier to read than a thin stroke alone.
  const area = plotted.length > 1 ? `${path} L${plotted[plotted.length - 1].x.toFixed(1)} ${height - PAD.b} L${plotted[0].x.toFixed(1)} ${height - PAD.b} Z` : "";
  const sparse = points.length <= 45;
  const activePoint = active === null ? null : points[active];

  return (
    <div ref={ref} className="relative" onMouseLeave={() => setActive(null)}>
      <svg width={width} height={height} role="img" aria-label={ariaLabel} className="block overflow-visible">
        <Axes width={width} height={height} max={top} unit={unit} labels={pickLabels(points, Math.max(2, Math.floor(width / 90)))} count={points.length} />
        {area && <path d={area} fill={color} opacity={0.1} />}
        {plotted.length > 1 && <path d={path} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />}
        {active !== null && <line x1={xAt(active, points.length, width)} x2={xAt(active, points.length, width)} y1={PAD.t} y2={height - PAD.b} stroke={AXIS} strokeDasharray="3 3" />}
        {plotted.map((d) => (
          <circle key={d.i} cx={d.x} cy={d.y} r={active === d.i ? 5.5 : sparse ? 3.5 : 2} fill={color} stroke="#fff" strokeWidth={1.5} />
        ))}
        {points.map((p, i) => {
          const w = Math.max(10, (width - PAD.l - PAD.r) / Math.max(points.length - 1, 1));
          return (
            <rect
              key={i} x={xAt(i, points.length, width) - w / 2} y={PAD.t} width={w} height={innerH} fill="transparent" tabIndex={p.value === null ? -1 : 0}
              aria-label={`${p.label}: ${p.value === null ? t("dash.noPractice") : `${p.value.toFixed(decimals)} ${unit}`}`}
              onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)} onBlur={() => setActive(null)}
            />
          );
        })}
      </svg>
      {activePoint && active !== null && (
        <Tooltip x={xAt(active, points.length, width)} width={width}>
          <strong>{activePoint.label}</strong>
          <div>{activePoint.value === null ? t("dash.noPractice") : `${activePoint.value.toFixed(decimals)} ${unit}`}</div>
          {activePoint.note && <div className="text-slate-300">{activePoint.note}</div>}
        </Tooltip>
      )}
    </div>
  );
}

/** Bar chart over time (e.g. minutes per day). Zero-value days stay as empty slots. */
export function BarChart({ points, color, unit, ariaLabel, max, height = 220, decimals = 0 }: SeriesProps) {
  const [ref, width] = useWidth();
  const [active, setActive] = useState<number | null>(null);
  const values = points.map((p) => p.value ?? 0);
  const top = max ?? niceMax(Math.max(...values, 0) * 1.1);
  const innerH = height - PAD.t - PAD.b;
  const slot = (width - PAD.l - PAD.r) / Math.max(points.length, 1);
  const barW = Math.max(2, Math.min(28, slot * 0.7));
  const cx = (i: number) => PAD.l + slot * i + slot / 2;
  const activePoint = active === null ? null : points[active];

  return (
    <div ref={ref} className="relative" onMouseLeave={() => setActive(null)}>
      <svg width={width} height={height} role="img" aria-label={ariaLabel} className="block overflow-visible">
        {[0, 0.25, 0.5, 0.75, 1].map((f) => {
          const y = PAD.t + innerH * (1 - f);
          return (
            <g key={f}>
              <line x1={PAD.l} x2={width - PAD.r} y1={y} y2={y} stroke={GRID} />
              <text x={PAD.l - 6} y={y + 3.5} textAnchor="end" fontSize={10} fill={AXIS}>{tickLabel(top * f, top)}</text>
            </g>
          );
        })}
        {pickLabels(points, Math.max(2, Math.floor(width / 90))).map(({ i, text }) => (
          <text key={i} x={cx(i)} y={height - 7} textAnchor="middle" fontSize={10} fill={AXIS}>{text}</text>
        ))}
        {points.map((p, i) => {
          const h = ((p.value ?? 0) / top) * innerH;
          return (
            <g key={i}>
              {(p.value ?? 0) > 0 && <rect x={cx(i) - barW / 2} y={PAD.t + innerH - Math.max(h, 2)} width={barW} height={Math.max(h, 2)} rx={3} fill={color} opacity={active === null || active === i ? 1 : 0.55} />}
              <rect
                x={PAD.l + slot * i} y={PAD.t} width={slot} height={innerH} fill="transparent" tabIndex={(p.value ?? 0) > 0 ? 0 : -1}
                aria-label={`${p.label}: ${(p.value ?? 0).toFixed(decimals)} ${unit}`}
                onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)} onBlur={() => setActive(null)}
              />
            </g>
          );
        })}
      </svg>
      {activePoint && active !== null && (
        <Tooltip x={cx(active)} width={width}>
          <strong>{activePoint.label}</strong>
          <div>{(activePoint.value ?? 0).toFixed(decimals)} {unit}</div>
          {activePoint.note && <div className="text-slate-300">{activePoint.note}</div>}
        </Tooltip>
      )}
    </div>
  );
}

export type ComparisonGroup = { key: string; label: string; sessions: number; avgWpm: number; avgAccuracy: number };

/** Side-by-side WPM and accuracy bars for groups such as English vs Khmer, or Easy/Medium/Hard. */
export function ComparisonBars({ groups, colors, labelFor }: { groups: ComparisonGroup[]; colors?: Record<string, string>; /** Localized name for a group key. */ labelFor?: (key: string) => string }) {
  const { t } = useLocale();
  const maxWpm = niceMax(Math.max(...groups.map((g) => g.avgWpm), 0));
  return (
    <ul className="space-y-4">
      {groups.map((g) => (
        <li key={g.key}>
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-sm font-bold text-navy">{labelFor?.(g.key) ?? g.label}</span>
            <span className="text-xs text-mute">{g.sessions ? t(g.sessions === 1 ? "dash.sessionCountOne" : "dash.sessionCountMany", { n: g.sessions }) : t("dash.noSessionsShort")}</span>
          </div>
          {g.sessions === 0 ? (
            <div className="h-9 rounded-lg border border-dashed border-slate-300 bg-slate-50" />
          ) : (
            <div className="space-y-1.5">
              <Bar label={t("dash.barSpeed")} valueText={`${g.avgWpm} WPM`} pct={(g.avgWpm / maxWpm) * 100} color={colors?.[g.key] ?? "#2563eb"} />
              <Bar label={t("dash.barAcc")} valueText={`${g.avgAccuracy}%`} pct={g.avgAccuracy} color="#38bdf8" />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function Bar({ label, valueText, pct, color }: { label: string; valueText: string; pct: number; color: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-24 flex-none text-mute">{label}</span>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100" role="meter" aria-label={label} aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full" style={{ width: `${Math.max(2, Math.min(100, pct))}%`, background: color }} />
      </div>
      <span className="w-16 flex-none text-right font-bold tabular-nums text-navy">{valueText}</span>
    </div>
  );
}
