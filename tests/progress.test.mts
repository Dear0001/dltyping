const store = new Map<string, string>();
(globalThis as any).window = { localStorage: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) }, addEventListener() {} };
const assert = (await import("node:assert/strict")).default;
const st = await import("@/lib/progress/progress-storage");
const an = await import("@/lib/progress/progress-analytics");
const ka = await import("@/lib/progress/keyboard-analytics");
const tr = await import("@/lib/progress/training-recommendations");
const dp = await import("@/lib/progress/drill-params");
let pass = 0; const t = (name: string, fn: () => void) => { fn(); pass++; console.log("ok -", name); };

t("stats formula", () => {
  assert.deepEqual(an.computeSessionStats(50, 0, 60), { wpm: 10, accuracy: 100 });
  assert.deepEqual(an.computeSessionStats(90, 10, 120), { wpm: 9, accuracy: 90 });
  assert.deepEqual(an.computeSessionStats(0, 0, 0), { wpm: 0, accuracy: 0 });
});

t("empty store / no sessions ignored", () => {
  assert.equal(st.readStore().sessions.length, 0);
  assert.equal(st.recordSession({ activity: "lesson", language: "english", durationSec: 30, correct: 0, incorrect: 0 }), null);
  assert.equal(st.readStore().sessions.length, 0);
});

// Build a session with key tally: Q typed 30x at 65% correct, P 25x at 72%, A 40x at 100%. Khmer: KeyQ chars.
const mk = () => {
  const tally = st.createTally();
  const feed = (lang: any, ch: string, n: number, acc: number) => { for (let i = 0; i < n; i++) st.tallyKeystroke(tally, lang, ch, i < Math.round(n * acc), false); };
  feed("english", "q", 30, 0.65); feed("english", "p", 25, 0.72); feed("english", "a", 40, 1); feed("english", "Q", 10, 1);
  feed("khmer", "ឆ", 22, 0.5); feed("khmer", "ឈ", 5, 1);
  return tally;
};
const now = new Date("2026-11-03T10:00:00");
t("recordSession saves session + keys atomically, consistent id/layout", () => {
  const s = st.recordSession({ activity: "lesson", language: "english", durationSec: 60, correct: 100, incorrect: 25, difficulty: "easy", detail: "Home row" }, mk(), now)!;
  assert.equal(s.wpm, 20); assert.equal(s.accuracy, 80); assert.equal(s.layout, "english-qwerty");
  const k = st.readStore();
  assert.equal(k.sessions.length, 1);
  assert.equal(k.keys["english:KeyQ"].n, 40); // q (30) + Q (10)
  assert.equal(k.keys["english:KeyQ"].chars["q"].n, 30); assert.equal(k.keys["english:KeyQ"].chars["Q"].n, 10);
  assert.equal(k.keys["khmer:KeyQ"].chars["ឆ"].n, 22); assert.equal(k.keys["khmer:KeyQ"].chars["ឈ"].n, 5);
  assert.equal(k.sessions[0].language, "english");
});

t("persists across 'refresh' (re-read from raw storage)", () => {
  const raw = [...store.values()][0];
  store.clear(); store.set("dlt.progress.v1", raw);
  assert.equal(st.readStore().sessions[0].detail, "Home row");
});

t("khmer vs english stay separate + physical vs unicode", () => {
  const s = st.readStore();
  const e = ka.analyzeKey(s, "english", "KeyQ"), k = ka.analyzeKey(s, "khmer", "KeyQ");
  assert.equal(e.total, 40); assert.equal(k.total, 27);
  assert.deepEqual(k.chars.map((c) => [c.char, c.layer, c.total]), [["ឆ", "base", 22], ["ឈ", "shift", 5]]);
  assert.deepEqual(e.chars.map((c) => [c.char, c.layer]), [["q", "base"], ["Q", "shift"]]);
});

t("mastery thresholds + minimum sample gate", () => {
  assert.equal(ka.masteryLevel(0, 0), "none");
  assert.equal(ka.masteryLevel(19, 10), "learning"); // too few -> never "weak"
  assert.equal(ka.masteryLevel(20, 10), "weak");
  assert.equal(ka.masteryLevel(20, 85), "good");
  assert.equal(ka.masteryLevel(20, 95), "excellent");
  const s = st.readStore(); const a = ka.analyzeKeyboard(s, "english");
  assert.equal(a.KeyQ.level, "weak"); // 30*.65=20 + 10 = 30/40 = 75%
  assert.equal(a.KeyQ.accuracy, 75); assert.equal(a.KeyP.accuracy, 72); assert.equal(a.KeyA.level, "excellent");
  assert.equal(a.KeyZ.level, "none");
  assert.deepEqual(ka.weakKeysOf(a).map((k) => k.code), ["KeyP", "KeyQ"]);
  const kh = ka.analyzeKeyboard(s, "khmer"); assert.equal(kh.KeyQ.level, "weak"); assert.equal(kh.KeyQ.accuracy, 59);
});

const day = (d: number, h = 12) => new Date(2026, 10, d, h).toISOString();
const sess = (id: string, d: number, o: any = {}) => ({ id, activity: "lesson", language: "english", durationSec: 60, wpm: 30, accuracy: 90, correct: 150, incorrect: 15, score: null, difficulty: "easy", layout: "english-qwerty", completedAt: day(d), ...o });
const NOW = new Date(2026, 10, 3, 15).getTime();

t("range filters, overview, empty overview is zero-safe", () => {
  const all = [sess("a", 3, { wpm: 40 }), sess("b", 2, { wpm: 20, accuracy: 80 }), sess("c", 1, { activity: "letter-jump", wpm: 30, difficulty: "hard" }), { ...sess("d", 1), completedAt: new Date(2026, 7, 1).toISOString(), wpm: 10 }] as any[];
  assert.equal(an.filterSessions(all, "7d", NOW).length, 3);
  assert.equal(an.filterSessions(all, "30d", NOW).length, 3);
  assert.equal(an.filterSessions(all, "90d", NOW).length, 3); // Aug 1 is 94 days back: excluded
  assert.equal(an.filterSessions(all, "all", NOW).length, 4);
});

t("overview values", () => {
  const all = [sess("a", 3, { wpm: 40 }), sess("b", 2, { wpm: 20, accuracy: 80 }), sess("c", 1, { activity: "letter-jump", wpm: 30, difficulty: "hard" })] as any[];
  const o = an.overview(all);
  assert.equal(o.sessions, 3); assert.equal(o.avgWpm, 30); assert.equal(o.bestWpm, 40); assert.equal(o.avgAccuracy, 87); assert.equal(o.gamesCompleted, 1); assert.equal(o.practiceSeconds, 180);
  const z = an.overview([]); assert.equal(z.avgWpm, 0); assert.equal(z.bestWpm, 0); assert.equal(z.sessions, 0);
});

t("streak: consecutive days, alive until end of tomorrow, broken by gap", () => {
  const s = (ds: number[]) => ds.map((d, i) => sess(String(i), d)) as any[];
  assert.equal(an.currentStreak(s([1, 2, 3]), NOW), 3);
  assert.equal(an.currentStreak(s([1, 2]), NOW), 2);
  assert.equal(an.currentStreak(s([3, 1]), NOW), 1);
  assert.equal(an.currentStreak([], NOW), 0);
  assert.equal(an.currentStreak([sess("old", 1, { completedAt: new Date(2026, 9, 30).toISOString() })] as any[], NOW), 0);
});

t("daily series: gaps are null (not zero); minutes summed; language & difficulty split", () => {
  const all = [sess("a", 3, { wpm: 40, durationSec: 90 }), sess("b", 3, { wpm: 20, durationSec: 30 }), sess("c", 1, { language: "khmer", wpm: 12, difficulty: "medium" })] as any[];
  const ser = an.dailySeries(all, "7d", NOW);
  assert.equal(ser.length, 7); assert.equal(ser.at(-1)!.wpm, 30); assert.equal(ser.at(-1)!.minutes, 2); assert.equal(ser.at(-2)!.wpm, null); assert.equal(ser.at(-3)!.wpm, 12);
  assert.equal(an.dailySeries([], "7d", NOW).length, 0);
  const l = an.byLanguage(all); assert.equal(l[0].sessions, 2); assert.equal(l[1].sessions, 1); assert.equal(l[1].avgWpm, 12);
  assert.deepEqual(an.byDifficulty(all).map((x) => x.sessions), [2, 1, 0]);
});

t("corrupted / hostile storage degrades gracefully", () => {
  for (const raw of ["not json{{", "null", "[]", '"x"', JSON.stringify({ sessions: "nope", keys: 5, pairs: [], words: null })]) {
    store.set("dlt.progress.v1", raw);
    const s = st.readStore(); assert.equal(s.sessions.length, 0); assert.equal(s.version, 1);
  }
  store.set("dlt.progress.v1", JSON.stringify({ version: 1, sessions: [sess("ok", 1), { id: "bad" }, sess("bad2", 1, { wpm: "x" }), sess("big", 1, { wpm: 9999, accuracy: 500 })], keys: { "english:KeyA": { n: 5, c: 99, last: 1, chars: {} }, junk: 1 } }));
  const s = st.readStore();
  assert.deepEqual(s.sessions.map((x) => x.id), ["ok", "big"]); assert.equal(s.sessions[1].wpm, 400); assert.equal(s.sessions[1].accuracy, 100);
  assert.equal(s.keys["english:KeyA"].c, 5); assert.equal(Object.keys(s.keys).length, 1);
});

t("storage unavailable falls back to memory without throwing", () => {
  const w = (globalThis as any).window.localStorage; const orig = [w.getItem, w.setItem];
  w.getItem = () => { throw new Error("blocked"); }; w.setItem = () => { throw new Error("quota"); };
  st.clearProgress();
  const r = st.recordSession({ activity: "lesson", language: "english", durationSec: 10, correct: 10, incorrect: 0 });
  assert.ok(r); assert.equal(st.readStore().sessions.length, 1);
  [w.getItem, w.setItem] = orig;
});

t("pairs & words tallies; sequence:false skips pairs; unmapped chars ignored", () => {
  st.clearProgress(); store.clear();
  const tl = st.createTally();
  for (let i = 0; i < 10; i++) { st.tallyKeystroke(tl, "english", "t", true); st.tallyKeystroke(tl, "english", "h", i < 3); st.tallyKeystroke(tl, "english", " ", true); }
  assert.equal(tl.pairs["english:th"].n, 10); assert.equal(tl.pairs["english:th"].c, 3);
  assert.equal(Object.keys(tl.pairs).filter((k) => k.includes(" ")).length, 0);
  const t2 = st.createTally(); st.tallyKeystroke(t2, "english", "a", true, false); st.tallyKeystroke(t2, "english", "b", true, false);
  assert.equal(Object.keys(t2.pairs).length, 0);
  const t3 = st.createTally(); st.tallyWordsFromText(t3, "english", "the quick fox", "the qxick fox");
  assert.deepEqual(t3.words, { "english:the": { n: 1, e: 0 }, "english:quick": { n: 1, e: 1 }, "english:fox": { n: 1, e: 0 } });
  const t4 = st.createTally(); st.tallyWordsFromText(t4, "english", "the quick fox", "the qu");
  assert.deepEqual(Object.keys(t4.words), ["english:the"]);
  const t5 = st.createTally(); st.tallyKeystroke(t5, "english", "€", true); assert.equal(Object.keys(t5.keys).length, 0);
});

t("recommendations need sufficient data and quote it", () => {
  st.clearProgress(); store.clear();
  assert.equal(tr.buildRecommendations(st.readStore()).length, 0);
  const few = st.createTally(); for (let i = 0; i < 10; i++) st.tallyKeystroke(few, "english", "q", false, false);
  st.recordSession({ activity: "lesson", language: "english", durationSec: 30, correct: 5, incorrect: 10 }, few);
  assert.equal(tr.buildRecommendations(st.readStore()).filter((r) => r.category === "weak-keys").length, 0);
  const more = st.createTally(); for (let i = 0; i < 30; i++) st.tallyKeystroke(more, "english", "q", i < 20, false);
  st.recordSession({ activity: "lesson", language: "english", durationSec: 60, correct: 200, incorrect: 10 }, more);
  const wk = tr.buildRecommendations(st.readStore()).find((r) => r.category === "weak-keys")!;
  assert.ok(wk); assert.match(wk.reason, /Q 50%/); assert.equal(wk.priority, "high");
  assert.ok(wk.actions.some((a) => a.kind === "game") && wk.actions.some((a) => a.kind === "practice"));
  assert.ok(wk.actions[0].href.includes("drill="));
});

t("speed / accuracy / consistency rules", () => {
  const base = (over: any[]) => ({ ...st.readStore(), keys: {}, sessions: over } as any);
  const slow = [1, 2, 3].map((d) => sess(`s${d}`, d, { wpm: 15, accuracy: 96 }));
  assert.ok(tr.buildRecommendations(base(slow)).some((r) => r.category === "speed"));
  assert.ok(!tr.buildRecommendations(base(slow.slice(0, 2))).some((r) => r.category === "speed"));
  const sloppy = [1, 2, 3].map((d) => sess(`a${d}`, d, { wpm: 40, accuracy: 70 }));
  const r = tr.buildRecommendations(base(sloppy)); assert.ok(r.some((x) => x.category === "accuracy")); assert.ok(!r.some((x) => x.category === "speed"));
  const erratic = [20, 55, 25, 60, 18].map((w, i) => sess(`e${i}`, i + 1, { wpm: w, accuracy: 95 }));
  assert.ok(tr.buildRecommendations(base(erratic)).some((x) => x.category === "consistency"));
  const steady = [40, 41, 39, 40, 42].map((w, i) => sess(`t${i}`, i + 1, { wpm: w, accuracy: 95 }));
  assert.equal(tr.buildRecommendations(base(steady)).length, 0);
});

t("drill params: validated, capped, built server-side", () => {
  assert.deepEqual(dp.parseChars("english", "qpq"), ["q", "p"]);
  assert.deepEqual(dp.parseWords("because,a,<x>,tomorrow"), ["because", "tomorrow"]);
  assert.equal(dp.buildDrillText("english", {}), null);
  assert.ok(/^[qp ]+$/.test(dp.buildDrillText("english", { drill: "qp" })!));
  assert.ok(/^(th|er| )+$/.test(dp.buildDrillText("english", { combo: "th,er" })!));
  assert.ok(dp.buildDrillText("khmer", { drill: "ឆឈ" })!.length > 10);
  assert.equal(dp.buildDrillText("khmer", { words: "hello" }), null);
});

console.log(`\n${pass} test groups passed`);

t("daily streak: +1 a day, extra tasks add more", () => {
  const day = (d: number, extra: { stars?: 1 | 2 | 3; lessonDone?: true } = {}) => ({ id: `s${d}${JSON.stringify(extra)}`, activity: "english-quest", language: "english", durationSec: 60, wpm: 10, accuracy: 90, correct: 50, incorrect: 5, score: null, difficulty: null, layout: "english-qwerty", completedAt: new Date(2026, 5, d, 12).toISOString(), ...extra }) as any;
  assert.equal(an.longestStreak([day(1), day(2)]), 2); // plain practice: 1 point a day
  assert.equal(an.longestStreak([day(1, { stars: 1 })]), 2); // 1 base + 1 star
  assert.equal(an.longestStreak([day(1, { stars: 3 })]), 4);
  assert.equal(an.longestStreak([day(1, { lessonDone: true })]), 2);
  assert.equal(an.longestStreak([day(1, { lessonDone: true }), day(1, { stars: 2 })]), 4); // 1 + lesson + 2 stars
  assert.equal(an.longestStreak([day(1, { stars: 2 }), day(2), day(4, { stars: 3 })]), 4 + 0); // 3 + 1 = 4; day 4 starts over at 4
});
