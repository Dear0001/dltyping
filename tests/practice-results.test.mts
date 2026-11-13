import { test } from "node:test";
const assert = (await import("node:assert/strict")).default;
const pr = await import("@/lib/practice-results");

const NOW = new Date(2026, 10, 13, 15, 0).getTime();
const session = (over: Record<string, unknown> = {}): any => ({ id: Math.random().toString(36), activity: "lesson", language: "english", durationSec: 60, wpm: 30, accuracy: 94, correct: 150, incorrect: 5, score: null, difficulty: null, layout: "english-qwerty", completedAt: new Date(2026, 10, 10, 12).toISOString(), ...over });

test("history compares with earlier comparable sessions in the same language only", () => {
  const sessions = [session({ wpm: 20 }), session({ wpm: 40 }), session({ language: "khmer", wpm: 90 }), session({ activity: "car-racing", wpm: 90 }), session({ wpm: 99, correct: 3 })];
  const h = pr.practiceHistory(sessions, "english", { bestWpm: 41, bestAccuracy: 97 }, NOW);
  assert.deepEqual(h.recent, { wpm: 30, accuracy: 94, count: 2 });
  assert.deepEqual(h.best, { wpm: 41, accuracy: 97 });
  assert.equal(h.dayAlreadyCounted, false);
});

test("today is only reported as newly counted once", () => {
  const today = session({ completedAt: new Date(2026, 10, 13, 9).toISOString() });
  assert.equal(pr.practiceHistory([today], "khmer", undefined, NOW).dayAlreadyCounted, true);
  const first = pr.practiceOutcome({ wpm: 30, accuracy: 95, correct: 100, lessonDone: false, comparable: true }, pr.practiceHistory([], "english", undefined, NOW));
  assert.ok(first.highlights.includes("day-counted"));
  assert.ok(first.highlights.includes("first-result"));
  const second = pr.practiceOutcome({ wpm: 30, accuracy: 95, correct: 100, lessonDone: false, comparable: true }, pr.practiceHistory([today], "english", undefined, NOW));
  assert.ok(!second.highlights.includes("day-counted"));
});

test("personal best, improvement and feedback come from real numbers", () => {
  const history = { best: { wpm: 40, accuracy: 96 }, recent: { wpm: 30, accuracy: 90, count: 5 }, dayAlreadyCounted: true };
  const pb = pr.practiceOutcome({ wpm: 44, accuracy: 98, correct: 200, lessonDone: true, comparable: true }, history);
  assert.deepEqual(pb.highlights, ["lesson-done", "new-best", "accuracy-up"]);
  assert.equal(pb.bestDelta, 4);
  assert.equal(pb.feedback, "excellent");
  const sloppy = pr.practiceOutcome({ wpm: 35, accuracy: 80, correct: 200, lessonDone: false, comparable: true }, history);
  assert.deepEqual(sloppy.highlights, ["speed-up"]);
  assert.equal(sloppy.feedback, "slow-down");
  // A drill never claims a personal best, and a tiny session neither counts nor gets praised.
  assert.ok(!pr.practiceOutcome({ wpm: 99, accuracy: 100, correct: 200, lessonDone: false, comparable: false }, history).highlights.includes("new-best"));
  const tiny = pr.practiceOutcome({ wpm: 99, accuracy: 100, correct: 4, lessonDone: false, comparable: true }, { ...history, dayAlreadyCounted: false });
  assert.deepEqual(tiny.highlights, []);
  assert.equal(tiny.feedback, "too-short");
  assert.equal(tiny.qualifies, false);
});
