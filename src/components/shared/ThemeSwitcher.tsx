"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useLocale } from "@/components/shared/LocaleProvider";
import { AUTO_THEME, THEMES, THEME_KEY, isThemeId, isThemeMode, themeForHour, type ThemeId, type ThemeMode } from "@/lib/themes";

const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb); }; };
/** What the user chose: a theme id or "auto". Nothing stored yet means the default theme. */
const readMode = (): ThemeMode => {
  try { const v = localStorage.getItem(THEME_KEY); if (isThemeMode(v)) return v; } catch { /* storage unavailable */ }
  return "developer-blue";
};
const resolve = (mode: ThemeMode): ThemeId => (mode === AUTO_THEME ? themeForHour(new Date().getHours()) : mode);

function paint(id: ThemeId) {
  const root = document.documentElement;
  if (id === "developer-blue") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", id);
}

function apply(mode: ThemeMode) {
  paint(resolve(mode));
  try { localStorage.setItem(THEME_KEY, mode); } catch { /* storage unavailable */ }
  listeners.forEach((l) => l());
}

export default function ThemeSwitcher() {
  const mode = useSyncExternalStore(subscribe, readMode, () => "developer-blue" as ThemeMode);
  const { t: tr } = useLocale();
  // In auto mode, re-check the clock every minute so the theme changes while the page is open.
  useEffect(() => {
    if (mode !== AUTO_THEME) return;
    const tick = () => { paint(resolve(AUTO_THEME)); listeners.forEach((l) => l()); };
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [mode]);
  const isAuto = mode === AUTO_THEME;
  const theme: ThemeId = isThemeId(mode) ? mode : resolve(mode);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); ref.current?.querySelector<HTMLElement>(".ts-btn")?.focus(); }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const items = Array.from(ref.current?.querySelectorAll<HTMLElement>(".ts-item") ?? []);
        const i = items.indexOf(document.activeElement as HTMLElement);
        items[(i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus();
      }
    };
    document.addEventListener("mousedown", onDown); document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);
  const cur = THEMES.find((t) => t.id === theme) ?? THEMES[0];
  const dot = (t: (typeof THEMES)[number]) => ({ "--sw1": t.swatch[0], "--sw2": t.swatch[1] }) as React.CSSProperties;
  return (
    <div className="theme-switcher" ref={ref}>
      <button type="button" className="ts-btn" aria-haspopup="menu" aria-expanded={open} aria-label={`${tr("nav.theme")}: ${isAuto ? tr("theme.auto") : tr(`theme.${cur.id}`)}`} onClick={() => setOpen((v) => !v)}>
        <span className="ts-dot" style={dot(cur)} aria-hidden="true" />
        <span className="ts-name">{isAuto ? tr("theme.auto") : tr(`theme.${cur.id}`)}</span>
        <span className="ts-caret" aria-hidden="true">⌄</span>
      </button>
      {open && <div className="ts-menu" role="menu" aria-label={tr("nav.theme")}>
        <button type="button" role="menuitemradio" aria-checked={isAuto} autoFocus={isAuto} title={tr("theme.autoHint")}
          className={`ts-item${isAuto ? " active" : ""}`} onClick={() => { apply(AUTO_THEME); setOpen(false); }}>
          <span className="ts-dot ts-auto" aria-hidden="true" />{tr("theme.auto")}
          {isAuto && <span className="ts-check" aria-hidden="true">✓</span>}
        </button>
        <div className="ts-sep" role="separator" />
        {THEMES.map((t) => (
          <button key={t.id} type="button" role="menuitemradio" aria-checked={!isAuto && theme === t.id} autoFocus={!isAuto && theme === t.id}
            className={`ts-item${!isAuto && theme === t.id ? " active" : ""}`} onClick={() => { apply(t.id); setOpen(false); }}>
            <span className="ts-dot" style={dot(t)} aria-hidden="true" />{tr(`theme.${t.id}`)}
            {!isAuto && theme === t.id && <span className="ts-check" aria-hidden="true">✓</span>}
          </button>
        ))}
      </div>}
    </div>
  );
}
