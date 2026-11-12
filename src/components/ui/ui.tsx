/**
 * DL Typing design system: the shared building blocks every page uses, so cards, buttons, badges and stats look
 * the same everywhere. Server-safe (no hooks). Colours come from theme tokens (globals.css), so all colour themes
 * keep working: brand = primary, navy = main text, mute = secondary text, line = borders, card = surface.
 */
import type { ReactNode } from "react";
import Icon, { type IconName } from "./Icon";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

/* ---------- Buttons (class strings, so they work on <Link>, <a> and <button>) ---------- */
const btnBase = "inline-flex items-center justify-center gap-2 rounded-xl font-bold transition duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap";
const btnSizes = { sm: "h-9 px-3.5 text-[13px]", md: "h-11 px-5 text-sm", lg: "h-12 px-6 text-[15px]" } as const;
const btnKinds = {
  primary: "bg-brand text-white shadow-sm shadow-brand/20 hover:bg-blue-700 active:translate-y-px",
  secondary: "border border-line bg-card text-navy shadow-sm hover:border-slate-300 hover:bg-slate-50 active:translate-y-px",
  ghost: "text-navy hover:bg-slate-100",
  inverse: "bg-white text-navy shadow-sm hover:bg-blue-50 active:translate-y-px",
  outlineLight: "border border-white/30 bg-white/5 text-white hover:bg-white/15",
} as const;
export type ButtonKind = keyof typeof btnKinds;
export const btn = (kind: ButtonKind = "primary", size: keyof typeof btnSizes = "md", extra = "") => cx(btnBase, btnSizes[size], btnKinds[kind], extra);

/* ---------- Surfaces ---------- */
export const cardClass = "rounded-2xl border border-line bg-card shadow-[var(--shadow-sm)]";
export const cardHover = "transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[var(--shadow-md)]";

export function Card({ as: Tag = "div", className = "", children, ...rest }: { as?: "div" | "section" | "article" | "li" | "aside"; className?: string; children: ReactNode } & Record<string, unknown>) {
  return <Tag className={cx(cardClass, className)} {...rest}>{children}</Tag>;
}

/* ---------- Page + section headings ---------- */
export function PageHeader({ kicker, title, subtitle, actions }: { kicker?: ReactNode; title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 max-w-2xl">
        {kicker && <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">{kicker}</p>}
        <h1 className="mt-1.5 text-3xl font-extrabold tracking-tight text-navy sm:text-[2.5rem] sm:leading-[1.1]">{title}</h1>
        {subtitle && <p className="mt-2 text-[15px] leading-relaxed text-mute">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function SectionHeading({ id, title, subtitle, action }: { id?: string; title: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 id={id} className="text-xl font-extrabold tracking-tight text-navy sm:text-2xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-mute">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ---------- Badges ---------- */
const tones = {
  brand: "bg-blue-50 text-brand ring-blue-100",
  neutral: "bg-slate-100 text-slate-600 ring-slate-200/70",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  warning: "bg-amber-50 text-amber-700 ring-amber-100",
  danger: "bg-red-50 text-red-700 ring-red-100",
  dark: "bg-navy/80 text-white ring-white/10 backdrop-blur",
  new: "bg-amber-400 text-navy ring-amber-300",
} as const;
export type Tone = keyof typeof tones;
export function Badge({ tone = "neutral", icon, children, className = "" }: { tone?: Tone; icon?: IconName; children: ReactNode; className?: string }) {
  return <span className={cx("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ring-inset", tones[tone], className)}>{icon && <Icon name={icon} size={12} strokeWidth={2.2} />}{children}</span>;
}

/* ---------- Progress ---------- */
export function ProgressBar({ value, tone = "brand", size = "md", label, className = "" }: { value: number; tone?: "brand" | "success" | "amber" | "white"; size?: "sm" | "md"; label?: string; className?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const fill = { brand: "bg-brand", success: "bg-emerald-500", amber: "bg-amber-400", white: "bg-white" }[tone];
  const track = tone === "white" ? "bg-white/20" : "bg-slate-100";
  return (
    <div className={cx("overflow-hidden rounded-full", size === "sm" ? "h-1.5" : "h-2", track, className)} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={label}>
      <div className={cx("h-full rounded-full transition-[width] duration-500", fill)} style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Circular progress (0-100) with content in the middle. */
export function ProgressRing({ value, size = 64, stroke = 6, children, className = "", trackClass = "text-slate-100", fillClass = "text-brand" }: { value: number; size?: number; stroke?: number; children?: ReactNode; className?: string; trackClass?: string; fillClass?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cx("relative grid flex-none place-items-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className={trackClass} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (c * pct) / 100} className={cx(fillClass, "transition-[stroke-dashoffset] duration-700")} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

/* ---------- Stats ---------- */
export function StatTile({ label, value, hint, icon, tone = "brand", className = "" }: { label: ReactNode; value: ReactNode; hint?: ReactNode; icon?: IconName; tone?: "brand" | "success" | "amber" | "danger" | "neutral"; className?: string }) {
  const ic = { brand: "bg-blue-50 text-brand", success: "bg-emerald-50 text-emerald-600", amber: "bg-amber-50 text-amber-600", danger: "bg-red-50 text-red-600", neutral: "bg-slate-100 text-slate-600" }[tone];
  return (
    <div className={cx(cardClass, "flex items-start gap-3 p-4", className)}>
      {icon && <span className={cx("grid h-10 w-10 flex-none place-items-center rounded-xl", ic)}><Icon name={icon} size={20} /></span>}
      <div className="min-w-0">
        <p className="text-xs font-semibold text-mute">{label}</p>
        <p className="mt-0.5 text-2xl font-extrabold tabular-nums tracking-tight text-navy">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-mute">{hint}</p>}
      </div>
    </div>
  );
}

/* ---------- Segmented control ---------- */
export function Segmented<T extends string>({ value, options, onChange, label, size = "md" }: { value: T; options: { value: T; label: ReactNode }[]; onChange: (v: T) => void; label: string; size?: "sm" | "md" }) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-xl bg-slate-100 p-1">
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}
          className={cx("rounded-lg font-bold transition", size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-[13px]", value === o.value ? "bg-card text-brand shadow-sm" : "text-mute hover:text-navy")}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Empty state ---------- */
export function EmptyState({ icon = "sparkle", title, text, action }: { icon?: IconName; title: ReactNode; text?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-card px-6 py-10 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-brand"><Icon name={icon} size={24} /></span>
      <h2 className="mt-3 text-lg font-bold text-navy">{title}</h2>
      {text && <p className="mx-auto mt-1 max-w-md text-sm text-mute">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export { Icon, cx };
