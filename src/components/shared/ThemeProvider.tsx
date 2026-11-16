"use client";

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { SERVER_THEME_STATE, getThemeStore, setThemeClockOverride, setThemeScheduleOverride } from "@/lib/theme-store";
import { THEME_KEY, type ThemeId, type ThemeMode } from "@/lib/themes";
import type { ThemePeriodId } from "@/lib/theme-schedule";

interface ThemeContextValue {
  mode: ThemeMode;
  /** The theme applied right now (resolved from the time of day in Auto mode). */
  theme: ThemeId;
  /** The active time period in Auto mode, otherwise null. */
  period: ThemePeriodId | null;
  isAuto: boolean;
  setMode: (mode: ThemeMode) => void;
}

// Module-level so their identity is stable; the server only ever calls getServerSnapshot.
const subscribe = (cb: () => void) => getThemeStore().subscribe(cb);
const getSnapshot = () => getThemeStore().getSnapshot();
const getServerSnapshot = () => SERVER_THEME_STATE;

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * The single theme provider. It subscribes to the shared store (so consumers re-render only when mode, theme or
 * period actually change) and, while mounted, keeps Auto mode current: a timer at the next period boundary, plus a
 * re-check when the tab becomes visible/focused again (sleep/wake, throttled timers, time-zone change) and when
 * another tab changes the saved preference.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    const s = getThemeStore();
    const detach = s.attach();
    const onVisible = () => { if (document.visibilityState === "visible") s.refresh(); };
    const onStorage = (e: StorageEvent) => { if (e.key === THEME_KEY || e.key === null) s.refresh(); };
    const onRefresh = () => s.refresh();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onRefresh);
    window.addEventListener("pageshow", onRefresh); // back/forward cache restores
    window.addEventListener("storage", onStorage);
    if (process.env.NODE_ENV !== "production") {
      (window as unknown as { __dltTheme?: unknown }).__dltTheme = { store: s, setClock: setThemeClockOverride, setSchedule: setThemeScheduleOverride };
    }
    return () => {
      detach();
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onRefresh);
      window.removeEventListener("pageshow", onRefresh);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ ...state, isAuto: state.mode === "auto", setMode: (m) => getThemeStore().setMode(m) }),
    [state],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}


export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
