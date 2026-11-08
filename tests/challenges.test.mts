const store = new Map<string, string>();
(globalThis as any).window = { localStorage: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) }, addEventListener() {} };
const assert = (await import("node:assert/strict")).default;
const tt = await import("@/lib/typing-test");
const dc = await import("@/lib/daily-challenge");
const ks = await import("@/lib/progress/key-speed");
const { test } = await import("node:test");

test("word text is deterministic per seed and has the requested length", () => {
  const a = tt.buildWordText("english", "medium", 50, 42);
  assert.equal(a, tt.buildWordText("english", "medium", 50, 42));
  assert.notEqual(a, tt.buildWordText("english", "medium", 50, 43));
  const words = a.split(" ");
  assert.equal(words.length, 50);
  words.forEach((w, i) => i && assert.notEqual(w, words[i - 1]));
  assert.equal(tt.buildWordText("khmer", "mixed", 10, 7).split(" ").length, 10);
});

test("consistency: even pace is 100, erratic pace is lower", () => {
  const even = [1, 2, 3, 4].map((s) => ({ second: s, wpm: 60, raw: 60, errors: 0, chars: s * 5 }));
  assert.equal(tt.consistency(even), 100);
  const bumpy = [5, 5, 20, 21, 40, 40].map((chars, i) => ({ second: i + 1, wpm: 0, raw: 0, errors: 0, chars }));
  assert.ok(tt.consistency(bumpy) < 50);
  assert.equal(tt.consistency([]), 100);
});

test("personal best needs 80% accuracy and a higher WPM", () => {
  assert.equal(tt.saveBest({ language: "english", durationSec: 60, wpm: 50, accuracy: 70 }, "t").isBest, false);
  assert.equal(tt.saveBest({ language: "english", durationSec: 60, wpm: 50, accuracy: 95 }, "t").isBest, true);
  const again = tt.saveBest({ language: "english", durationSec: 60, wpm: 45, accuracy: 99 }, "t");
  assert.equal(again.isBest, false);
  assert.equal(again.previous?.wpm, 50);
  assert.equal(tt.saveBest({ language: "english", durationSec: 30, wpm: 45, accuracy: 99 }, "t").isBest, true);
});

test("daily challenge is the same for a date and scales the speed goal", () => {
  const a = dc.dailyChallenge("2026-11-08", "english", 40);
  assert.deepEqual(a, dc.dailyChallenge("2026-11-08", "english", 40));
  assert.notEqual(a.text, dc.dailyChallenge("2026-11-09", "english", 40).text);
  const kinds = new Set(Array.from({ length: 30 }, (_, i) => dc.dailyChallenge(dc.shiftDay("2026-11-01", i), "english", 40).kind));
  assert.ok(kinds.size >= 3, "challenges rotate");
  const sprint = Array.from({ length: 60 }, (_, i) => dc.dailyChallenge(dc.shiftDay("2026-01-01", i), "english", 40)).find((c) => c.kind === "sprint")!;
  assert.equal(sprint.targetWpm, 44);
  assert.equal(dc.goalMet(sprint, 44, 90), true);
  assert.equal(dc.goalMet(sprint, 43, 99), false);
  assert.equal(dc.goalMet({ minAccuracy: 95, targetWpm: null }, 5, 95), true);
});

test("daily attempts keep the best result and never undo completion", () => {
  let book = dc.applyAttempt({}, "2026-11-08", "english", 30, 80, false);
  book = dc.applyAttempt(book, "2026-11-08", "english", 25, 96, true);
  assert.deepEqual(book["2026-11-08"].english, { wpm: 25, accuracy: 96, done: true, attempts: 2 });
  book = dc.applyAttempt(book, "2026-11-08", "english", 60, 50, false);
  assert.deepEqual(book["2026-11-08"].english, { wpm: 25, accuracy: 96, done: true, attempts: 3 });
  assert.deepEqual(dc.validateDaily(JSON.parse(JSON.stringify(book))), book);
  assert.equal(dc.validateDaily({ "bad-date": { english: { wpm: 1, accuracy: 1, done: true, attempts: 1 } } })!["bad-date"], undefined);
});

test("daily streak counts back from today, or yesterday if today is pending", () => {
  const done = (d: string) => ({ english: { wpm: 1, accuracy: 100, done: true, attempts: 1 } });
  const book = { "2026-11-05": done(""), "2026-11-06": done(""), "2026-11-07": done("") };
  assert.equal(dc.dailyStreak(book, "2026-11-08"), 3);
  assert.equal(dc.dailyStreak({ ...book, "2026-11-08": done("") }, "2026-11-08"), 4);
  assert.equal(dc.dailyStreak(book, "2026-11-09"), 0);
  assert.equal(dc.shiftDay("2026-03-01", -1), "2026-02-28");
  assert.equal(dc.shiftDay("2026-12-31", 1), "2027-01-01");
  assert.deepEqual(dc.recentDays(book, "2026-11-08", 3).map((d) => d.done), [true, true, false]);
});

test("key speed compares each key with the learner's own average", () => {
  const stat = (ms: number, t: number) => ({ n: t, e: 0, ms: ms * t, t });
  const r = ks.analyzeKeySpeed("english", { a: stat(150, 20), s: stat(240, 20), q: stat(400, 20), z: stat(300, 3), x: { n: 2, e: 0, ms: 0, t: 0 } });
  assert.equal(Math.round(r.overallMs!), 263);
  assert.equal(r.keys.KeyA.level, "excellent");
  assert.equal(r.keys.KeyS.level, "good");
  assert.equal(r.keys.KeyQ.level, "weak");
  assert.equal(r.keys.KeyZ.level, "learning");
  assert.equal(r.keys.KeyX, undefined);
  assert.deepEqual(r.slowest.map((k) => k.code), ["KeyQ"]);
  assert.equal(ks.msToWpm(200), 60);
});
