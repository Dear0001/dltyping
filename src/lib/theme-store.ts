/**
 * The one theme state holder. A factory so tests can inject the clock, schedule, storage, <html> element and timers;
 * the app uses the singleton from getThemeStore(). It owns: the saved mode, the resolved theme, painting <html>,
 * and the boundary timer that re-resolves "auto" when the time period changes (no polling).
 * ThemeProvider mounts it once and feeds it the visibility/focus/storage events.
 */
import { AUTO_THEME, DARK_THEME_IDS, THEME_KEY, THEME_MODE_ATTR, THEME_PERIOD_ATTR, isThemeMode, type ThemeId, type ThemeMode } from "@/lib/themes";
import { DEFAULT_SCHEDULE, isValidSchedule, msUntilNextBoundary, periodAt, systemClock, type ThemeClock, type ThemePeriodId, type ThemeSchedule } from "@/lib/theme-schedule";

export const DEFAULT_THEME: ThemeId = "developer-blue";

export interface ThemeState {
  /** What the user chose: "auto" or a specific theme id. */
  mode: ThemeMode;
  /** The theme actually applied right now. */
  theme: ThemeId;
  /** The active time period; only set in Auto mode. */
  period: ThemePeriodId | null;
}

export interface ThemeEnv {
  clock: ThemeClock;
  schedule: ThemeSchedule;
  storage: Pick<Storage, "getItem" | "setItem"> | null;
  root: Pick<HTMLElement, "setAttribute" | "removeAttribute"> | null;
  setTimer: (fn: () => void, ms: number) => unknown;
  clearTimer: (handle: unknown) => void;
}

/** Slack added to the boundary timer so it fires just after the boundary, never a hair before it. */
const BOUNDARY_SLACK_MS = 50;

export const SERVER_THEME_STATE: ThemeState = { mode: DEFAULT_THEME, theme: DEFAULT_THEME, period: null };

export function createThemeStore(env: ThemeEnv) {
  const listeners = new Set<() => void>();
  let state: ThemeState | null = null;
  let timer: unknown = null;
  let attached = 0;

  /** Saved mode. Missing or invalid values fall back to the default; unreadable storage keeps `fallback` (the in-memory mode). */
  const readMode = (fallback: ThemeMode = DEFAULT_THEME): ThemeMode => {
    if (!env.storage) return fallback;
    try { const v = env.storage.getItem(THEME_KEY); return isThemeMode(v) ? v : DEFAULT_THEME; } catch { return fallback; }
  };

  const resolve = (mode: ThemeMode): ThemeState => {
    if (mode !== AUTO_THEME) return { mode, theme: mode, period: null };
    const p = periodAt(env.clock.now(), env.schedule);
    return { mode, theme: p.theme, period: p.id };
  };

  function paint(s: ThemeState) {
    const root = env.root;
    if (!root) return;
    if (s.theme === DEFAULT_THEME) root.removeAttribute("data-theme"); else root.setAttribute("data-theme", s.theme);
    if (DARK_THEME_IDS.includes(s.theme)) root.setAttribute("data-tone", "dark"); else root.removeAttribute("data-tone");
    root.setAttribute(THEME_MODE_ATTR, s.mode); // drives the header button label CSS (THEME_LABEL_CSS)
    if (s.period) root.setAttribute(THEME_PERIOD_ATTR, s.period); else root.removeAttribute(THEME_PERIOD_ATTR);
  }

  const emit = () => listeners.forEach((l) => l());

  function clearTimer() { if (timer != null) { env.clearTimer(timer); timer = null; } }

  /** Auto mode: sleep until the next period boundary, then re-resolve (which schedules the following one). */
  function scheduleNext() {
    clearTimer();
    if (!attached || get().mode !== AUTO_THEME) return;
    const ms = Math.max(0, msUntilNextBoundary(env.clock.now(), env.schedule)) + BOUNDARY_SLACK_MS;
    timer = env.setTimer(() => { timer = null; refresh(); }, ms);
  }

  function commit(next: ThemeState) {
    const prev = state;
    state = next;
    if (!prev || prev.mode !== next.mode || prev.theme !== next.theme || prev.period !== next.period) { paint(next); emit(); }
  }

  /** Stable snapshot for useSyncExternalStore: the same object until mode, theme or period changes. */
  function get(): ThemeState {
    if (!state) state = resolve(readMode());
    return state;
  }

  /**
   * Re-read the clock (and saved mode) and apply. Called by the boundary timer, when the tab becomes visible or
   * focused again (covers sleep/wake, throttled background timers and time-zone changes) and on `storage` events from
   * other tabs. Does nothing visible when nothing changed.
   */
  function refresh() {
    commit(resolve(readMode(state?.mode)));
    scheduleNext();
  }

  /** The user picked a mode: persist it and apply it immediately (picking Auto resumes scheduling at once). */
  function setMode(mode: ThemeMode) {
    if (!isThemeMode(mode)) return;
    try { env.storage?.setItem(THEME_KEY, mode); } catch { /* storage unavailable: still applies for this page view */ }
    const next = resolve(mode);
    const prev = state;
    state = next;
    paint(next); // always repaint: the pre-paint script may have left stale attributes
    if (!prev || prev.mode !== next.mode || prev.theme !== next.theme || prev.period !== next.period) emit();
    scheduleNext();
  }

  return {
    getSnapshot: get,
    getServerSnapshot: () => SERVER_THEME_STATE,
    subscribe(cb: () => void) { listeners.add(cb); return () => { listeners.delete(cb); }; },
    setMode,
    refresh,
    /** Start scheduling (provider mount). Returns the cleanup. Safe to call more than once (counted). */
    attach() {
      attached++;
      refresh();
      return () => { attached = Math.max(0, attached - 1); if (!attached) clearTimer(); };
    },
  };
}

export type ThemeStore = ReturnType<typeof createThemeStore>;

let singleton: ThemeStore | null = null;
let clockOverride: ThemeClock | null = null;
let scheduleOverride: ThemeSchedule | null = null;

/** Browser singleton. Only call on the client. */
export function getThemeStore(): ThemeStore {
  if (!singleton) {
    singleton = createThemeStore({
      clock: { now: () => (clockOverride ?? systemClock).now() },
      get schedule() { return scheduleOverride ?? DEFAULT_SCHEDULE; },
      storage: (() => { try { return window.localStorage; } catch { return null; } })(),
      root: document.documentElement,
      setTimer: (fn, ms) => window.setTimeout(fn, ms),
      clearTimer: (h) => window.clearTimeout(h as number),
    });
  }
  return singleton;
}

/**
 * Manual QA hooks (browser console): `__setThemeClock(() => new Date(2026, 10, 16, 21, 0))` then `refresh`.
 * Exposed by ThemeProvider as window.__dltTheme only outside production.
 */
export function setThemeClockOverride(clock: ThemeClock | null) { clockOverride = clock; }
export function setThemeScheduleOverride(schedule: ThemeSchedule | null) {
  if (schedule && !isValidSchedule(schedule)) throw new Error("Invalid theme schedule");
  scheduleOverride = schedule;
}
