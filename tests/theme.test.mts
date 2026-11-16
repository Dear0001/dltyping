import assert from "node:assert/strict";
import { test } from "node:test";

const sch = await import("@/lib/theme-schedule");
const { THEMES, THEME_INIT_SCRIPT, THEME_KEY, toneOf, DEFAULT_THEME_BY_TONE } = await import("@/lib/themes");
const { createThemeStore } = await import("@/lib/theme-store");

const at = (h: number, m = 0, day = 16) => new Date(2026, 10, day, h, m, 0, 0); // local time

test("schedule: the six periods at the required times", () => {
  const cases: [number, number, string, string][] = [
    [5, 0, "sunrise", "dawn-peach"], [7, 59, "sunrise", "dawn-peach"],
    [8, 0, "morning", "meadow-mint"], [11, 59, "morning", "meadow-mint"],
    [12, 0, "afternoon", "developer-blue"], [15, 59, "afternoon", "developer-blue"],
    [16, 0, "sunset", "golden-hour"], [17, 59, "sunset", "golden-hour"],
    [18, 0, "evening", "velvet-petal"], [20, 59, "evening", "velvet-petal"],
    [21, 0, "night", "midnight-blossom"], [23, 59, "night", "midnight-blossom"],
    [0, 0, "night", "midnight-blossom"], [4, 59, "night", "midnight-blossom"],
  ];
  for (const [h, m, id, theme] of cases) {
    const p = sch.periodAt(at(h, m));
    assert.equal(p.id, id, `${h}:${m} period`);
    assert.equal(p.theme, theme, `${h}:${m} theme`);
  }
});

test("schedule: only existing themes, night is dark, others reuse the 8", () => {
  const ids = new Set(THEMES.map((t) => t.id));
  for (const p of sch.DEFAULT_SCHEDULE) assert.ok(ids.has(p.theme), p.theme);
  assert.equal(toneOf(sch.periodAt(at(23)).theme), "dark");
  assert.equal(toneOf(sch.periodAt(at(13)).theme), "light");
  assert.equal(THEMES.length, 8);
  assert.ok(sch.isValidSchedule(sch.DEFAULT_SCHEDULE));
  assert.ok(!sch.isValidSchedule([]) && !sch.isValidSchedule([{ id: "a", start: 600, theme: "x" }, { id: "b", start: 300, theme: "y" }]));
});

test("schedule: next boundary, including midnight wrap and month end", () => {
  assert.deepEqual(sch.nextBoundary(at(4, 59)), at(5, 0));
  assert.deepEqual(sch.nextBoundary(at(5, 0)), at(8, 0)); // exactly on a boundary -> the following one
  assert.deepEqual(sch.nextBoundary(at(21, 30)), at(5, 0, 17)); // night runs past midnight to 05:00 next day
  assert.deepEqual(sch.nextBoundary(at(0, 0)), at(5, 0));
  assert.deepEqual(sch.nextBoundary(new Date(2026, 10, 30, 22)), new Date(2026, 11, 1, 5));
  assert.equal(sch.msUntilNextBoundary(at(11, 59, 16)), 60_000);
});

test("schedule follows the local timezone, not a fixed one", () => {
  const prev = process.env.TZ;
  const instant = Date.UTC(2026, 10, 16, 15, 0); // 15:00 UTC
  try {
    process.env.TZ = "UTC"; assert.equal(sch.periodAt(new Date(instant)).id, "afternoon");
    process.env.TZ = "Asia/Phnom_Penh"; assert.equal(sch.periodAt(new Date(instant)).id, "night"); // 22:00 local
    process.env.TZ = "America/Los_Angeles"; assert.equal(sch.periodAt(new Date(instant)).id, "sunrise"); // 07:00 local
  } finally { if (prev === undefined) delete process.env.TZ; else process.env.TZ = prev; }
});

/* ---------- store with injected clock, storage, <html> and timers ---------- */
function harness(start: Date, saved?: string) {
  let now = start.getTime();
  const mem = new Map<string, string>(); if (saved !== undefined) mem.set(THEME_KEY, saved);
  const attrs = new Map<string, string>();
  const timers = new Map<number, { fn: () => void; at: number }>(); let id = 0;
  let blocked = false;
  const store = createThemeStore({
    clock: { now: () => new Date(now) }, schedule: sch.DEFAULT_SCHEDULE,
    storage: { getItem: (k) => { if (blocked) throw new Error("blocked"); return mem.get(k) ?? null; }, setItem: (k, v) => void mem.set(k, v) },
    root: { setAttribute: (k, v) => void attrs.set(k, v), removeAttribute: (k) => void attrs.delete(k) },
    setTimer: (fn, ms) => { timers.set(++id, { fn, at: now + ms }); return id; },
    clearTimer: (h) => void timers.delete(h as number),
  });
  /** Move the clock forward and fire due timers, like real time passing. */
  const advance = (ms: number) => { now += ms; for (const [k, t] of [...timers]) if (t.at <= now) { timers.delete(k); t.fn(); } };
  return { store, mem, attrs, timers, advance, block: () => { blocked = true; }, setNow: (d: Date) => { now = d.getTime(); } };
}

test("store: auto at each required time paints the right theme", () => {
  const expect: [number, number, string | undefined, string | undefined][] = [
    [5, 0, "dawn-peach", undefined], [8, 0, "meadow-mint", undefined], [12, 0, undefined, undefined],
    [16, 0, "golden-hour", undefined], [18, 0, "velvet-petal", undefined], [21, 0, "midnight-blossom", "dark"],
    [0, 0, "midnight-blossom", "dark"], [4, 59, "midnight-blossom", "dark"],
  ];
  for (const [h, m, theme, tone] of expect) {
    const t = harness(at(h, m), "auto");
    t.store.attach();
    assert.equal(t.attrs.get("data-theme"), theme, `${h}:${m}`); // developer-blue = no attribute
    assert.equal(t.attrs.get("data-tone"), tone);
    assert.equal(t.attrs.get("data-theme-mode"), "auto");
  }
});

test("store: a timer at the boundary flips the theme (and handles midnight) without polling", () => {
  const t = harness(at(20, 58), "auto");
  t.store.attach();
  assert.equal(t.timers.size, 1);
  assert.equal(t.store.getSnapshot().period, "evening");
  let notified = 0; t.store.subscribe(() => notified++);
  t.advance(60_000); assert.equal(notified, 0); // 20:59, still evening: no change, no re-render
  t.advance(60_100);
  assert.equal(t.store.getSnapshot().period, "night"); assert.equal(notified, 1);
  assert.equal(t.attrs.get("data-tone"), "dark");
  assert.equal(t.timers.size, 1); // next boundary (05:00) is already scheduled
  t.setNow(at(4, 59, 17)); t.advance(60_100);
  assert.equal(t.store.getSnapshot().period, "sunrise");
});

test("store: waking after a long sleep catches up via refresh()", () => {
  const t = harness(at(10, 0), "auto"); t.store.attach();
  assert.equal(t.store.getSnapshot().period, "morning");
  t.setNow(at(19, 0)); // laptop slept; the timer never fired
  t.store.refresh();
  assert.equal(t.store.getSnapshot().period, "evening");
});

test("store: manual selection leaves auto, persists, and cancels the timer; Auto resumes immediately", () => {
  const t = harness(at(13, 0), "auto"); t.store.attach();
  t.store.setMode("twilight-indigo");
  assert.equal(t.mem.get(THEME_KEY), "twilight-indigo");
  assert.equal(t.store.getSnapshot().mode, "twilight-indigo");
  assert.equal(t.attrs.get("data-theme"), "twilight-indigo"); assert.equal(t.attrs.get("data-theme-period"), undefined);
  assert.equal(t.timers.size, 0);
  t.advance(24 * 3600_000); assert.equal(t.store.getSnapshot().theme, "twilight-indigo");
  t.setNow(at(17, 0));
  t.store.setMode("auto");
  assert.equal(t.mem.get(THEME_KEY), "auto");
  assert.equal(t.store.getSnapshot().theme, "golden-hour");
  assert.equal(t.timers.size, 1);
});

test("store: all 8 themes can be selected manually and persist across a reload", () => {
  for (const th of THEMES) {
    const t = harness(at(9, 0)); t.store.attach(); t.store.setMode(th.id);
    assert.equal(t.attrs.get("data-tone"), th.tone === "dark" ? "dark" : undefined);
    const reloaded = harness(at(9, 0), t.mem.get(THEME_KEY)); reloaded.store.attach();
    assert.equal(reloaded.store.getSnapshot().theme, th.id);
  }
});

test("store: invalid or missing saved values fall back safely; unreadable storage keeps the in-memory mode", () => {
  for (const bad of [undefined, "", "nope", "AUTO", "{}", "dark"]) {
    const t = harness(at(9, 0), bad); t.store.attach();
    assert.equal(t.store.getSnapshot().mode, "developer-blue", String(bad));
  }
  const t = harness(at(9, 0), "auto"); t.store.attach();
  t.block();
  t.store.refresh();
  assert.equal(t.store.getSnapshot().mode, "auto");
});

test("store: another tab changing the preference is picked up by refresh()", () => {
  const t = harness(at(9, 0), "auto"); t.store.attach();
  t.mem.set(THEME_KEY, "velvet-petal"); t.store.refresh();
  assert.equal(t.store.getSnapshot().theme, "velvet-petal"); assert.equal(t.timers.size, 0);
});

test("pre-paint script resolves auto with the same schedule as the store", () => {
  const run = (d: Date, saved: string | null) => {
    const attrs: Record<string, string> = {};
    const RealDate = Date; const fixed = d.getTime();
    class FakeDate extends RealDate { constructor(...a: any[]) { super(...(a.length ? (a as [number]) : [fixed])); } }
    new Function("document", "localStorage", "Date", THEME_INIT_SCRIPT)(
      { documentElement: { setAttribute: (k: string, v: string) => (attrs[k] = v) } }, { getItem: () => saved }, FakeDate);
    return attrs;
  };
  for (const [h, m] of [[5, 0], [8, 0], [12, 0], [16, 0], [18, 0], [21, 0], [0, 0], [4, 59]] as const) {
    const a = run(at(h, m), "auto"); const p = sch.periodAt(at(h, m));
    assert.equal(a["data-theme-period"], p.id); assert.equal(a["data-theme"], p.theme === "developer-blue" ? undefined : p.theme);
    assert.equal(a["data-tone"], toneOf(p.theme) === "dark" ? "dark" : undefined);
  }
  assert.equal(run(at(9), "ethereal-flora")["data-theme"], "ethereal-flora");
  assert.equal(run(at(9), "bad value!")["data-theme"], undefined);
  assert.equal(DEFAULT_THEME_BY_TONE.dark, "midnight-blossom");
});
