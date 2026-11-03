"use client";

import { useSyncExternalStore } from "react";
import { THEMES, THEME_KEY, isThemeId, type ThemeId } from "@/lib/themes";

const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb); }; };
const current = (): ThemeId => {
  const v = document.documentElement.getAttribute("data-theme");
  return isThemeId(v) ? v : "developer-blue";
};

function apply(id: ThemeId) {
  if (id === "developer-blue") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", id);
  try { localStorage.setItem(THEME_KEY, id); } catch { /* storage unavailable */ }
  listeners.forEach((l) => l());
}

export default function ThemeSwitcher() {
  const theme = useSyncExternalStore(subscribe, current, () => "developer-blue" as ThemeId);
  return (
    <div className="theme-switcher" role="radiogroup" aria-label="Color theme">
      {THEMES.map((t) => (
        <button key={t.id} type="button" role="radio" aria-checked={theme === t.id} aria-label={t.name} title={t.name}
          className={theme === t.id ? "active" : ""} onClick={() => apply(t.id)}
          style={{ background: `linear-gradient(135deg, ${t.swatch[0]} 50%, ${t.swatch[1]} 50%)` }} />
      ))}
    </div>
  );
}
