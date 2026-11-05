const assert = (await import("node:assert/strict")).default;
const sl = await import("@/lib/progress/streak-levels");
const s = (wpm: number, accuracy: number, incorrect: number, correct = 100): any => ({ id: "x", activity: "lesson", language: "english", durationSec: 60, wpm, accuracy, correct, incorrect, score: null, difficulty: null, layout: "english-qwerty", completedAt: "2026-01-01T00:00:00.000Z" });
assert.equal(sl.STREAK_LEVELS.length, 20);
assert.deepEqual(sl.STREAK_LEVELS[0], { level: 1, minWpm: 5, minAccuracy: 70, maxErrors: 20 });
assert.deepEqual(sl.STREAK_LEVELS[19], { level: 20, minWpm: 60, minAccuracy: 98, maxErrors: 1 });
for (let i = 1; i < 20; i++) { const a = sl.STREAK_LEVELS[i - 1], b = sl.STREAK_LEVELS[i]; assert.ok(b.minWpm >= a.minWpm && b.minAccuracy >= a.minAccuracy && b.maxErrors <= a.maxErrors); }
assert.equal(sl.sessionLevel(s(60, 99, 0)), 20);
assert.equal(sl.sessionLevel(s(60, 99, 5)) < 20, true);
assert.equal(sl.sessionLevel(s(4, 100, 0)), 0);
assert.equal(sl.sessionLevel(s(60, 100, 0, 10)), 0);
assert.equal(sl.levelStatuses([s(30, 90, 5)]).filter((l) => l.unlocked).length, sl.sessionLevel(s(30, 90, 5)));
console.log("ok - streak levels");
