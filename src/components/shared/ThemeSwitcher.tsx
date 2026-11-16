"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/components/shared/LocaleProvider";
import { useTheme } from "@/components/shared/ThemeProvider";
import BiText from "@/components/shared/BiText";
import { AUTO_THEME, DEFAULT_THEME_BY_TONE, THEMES, toneOf, type ThemeId } from "@/lib/themes";
import { DEFAULT_SCHEDULE, formatStart } from "@/lib/theme-schedule";

type View = "auto" | "light" | "dark";
const VIEWS: View[] = ["auto", "light", "dark"];
const swatch = (id: ThemeId) => THEMES.find((t) => t.id === id) ?? THEMES[0];
const dot = (t: (typeof THEMES)[number]) => ({ "--sw1": t.swatch[0], "--sw2": t.swatch[1] }) as React.CSSProperties;
/** "05:00–07:59": a period runs until the minute before the next one starts (the last wraps past midnight). */
const range = (i: number) => {
  const next = DEFAULT_SCHEDULE[(i + 1) % DEFAULT_SCHEDULE.length].start;
  return `${formatStart(DEFAULT_SCHEDULE[i].start)}–${formatStart((next + 1439) % 1440)}`;
};

export default function ThemeSwitcher() {
  const { theme, period, isAuto, setMode } = useTheme();
  const { t: tr } = useLocale();
  const [open, setOpen] = useState(false);
  /** Which tab of the menu is shown; null follows the current mode. Picking a tab other than Auto switches to manual mode. */
  const [pick, setPick] = useState<View | null>(null);
  const view: View = pick ?? (isAuto ? "auto" : toneOf(theme));
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); ref.current?.querySelector<HTMLElement>(".ts-btn")?.focus(); }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const items = Array.from(ref.current?.querySelectorAll<HTMLElement>(".ts-seg-btn, .ts-item") ?? []);
        const i = items.indexOf(document.activeElement as HTMLElement);
        items[(i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus();
      }
    };
    document.addEventListener("mousedown", onDown); document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);
  const cur = swatch(theme);
  const periodName = period ? tr(`theme.period.${period}`) : "";
  const autoLabel = period ? tr("theme.autoNow", { period: periodName }) : tr("theme.auto");
  const toggle = () => { setPick(null); setOpen((v) => !v); };
  const choose = (v: View) => {
    setPick(v);
    if (v === "auto") { setMode(AUTO_THEME); setPick(null); return; }
    // Light / Dark: manual mode right away, keeping the current look when it already has that tone.
    if (toneOf(theme) !== v || isAuto) setMode(toneOf(theme) === v ? theme : DEFAULT_THEME_BY_TONE[v]);
  };
  return (
    <div className="theme-switcher" ref={ref}>
      <button type="button" className="ts-btn" aria-haspopup="true" aria-expanded={open} title={isAuto ? autoLabel : undefined} aria-label={`${tr("nav.theme")}: ${isAuto ? autoLabel : tr(`theme.${cur.id}`)}`} onClick={toggle}>
        {/* Every option is rendered; CSS shows the stored one from the first paint, before React reads localStorage. */}
        <span className="ts-cur" data-t={AUTO_THEME}><span className="ts-dot ts-auto" aria-hidden="true" /><span className="ts-name"><BiText k="theme.auto" /></span></span>
        {THEMES.map((th) => (
          <span key={th.id} className="ts-cur" data-t={th.id}><span className="ts-dot" style={dot(th)} aria-hidden="true" /><span className="ts-name"><BiText k={`theme.${th.id}`} /></span></span>
        ))}
        <span className="ts-caret" aria-hidden="true">⌄</span>
      </button>
      {open && <div className="ts-menu" role="group" aria-label={tr("nav.theme")}>
        <div className="ts-seg" role="radiogroup" aria-label={tr("theme.modes")}>
          {VIEWS.map((v) => (
            <button key={v} type="button" role="radio" aria-checked={view === v} autoFocus={view === v} className={`ts-seg-btn${view === v ? " on" : ""}`} onClick={() => choose(v)}>{tr(`theme.seg.${v}`)}</button>
          ))}
        </div>
        {view === "auto" ? (
          <div className="ts-auto-panel">
            <p className="ts-now" role="status"><span className="ts-dot" style={dot(cur)} aria-hidden="true" />{autoLabel}</p>
            <p className="ts-hint">{tr("theme.autoHint")}</p>
            <p className="ts-sub">{tr("theme.schedule")}</p>
            <ul className="ts-sched">
              {DEFAULT_SCHEDULE.map((p, i) => (
                <li key={p.id} className={p.id === period ? "now" : undefined} aria-current={p.id === period ? "true" : undefined}>
                  <span className="ts-dot" style={dot(swatch(p.theme))} aria-hidden="true" />
                  <span className="ts-sched-name">{tr(`theme.period.${p.id}`)}<small>{tr(`theme.${p.theme}`)}</small></span>
                  <span className="ts-sched-time">{range(i)}</span>
                  {p.id === period && <span className="ts-badge">{tr("theme.nowBadge")}</span>}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div role="radiogroup" aria-label={tr(`theme.seg.${view}`)} className="ts-list">
            {THEMES.filter((t) => t.tone === view).map((t) => {
              const on = !isAuto && theme === t.id;
              return (
                <button key={t.id} type="button" role="radio" aria-checked={on} className={`ts-item${on ? " active" : ""}`} onClick={() => { setMode(t.id); setOpen(false); }}>
                  <span className="ts-dot" style={dot(t)} aria-hidden="true" />{tr(`theme.${t.id}`)}
                  {on && <span className="ts-check" aria-hidden="true">✓</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>}
    </div>
  );
}
