import { test } from "node:test";
const assert = (await import("node:assert/strict")).default;
const a = await import("@/lib/achievements");

const at = (day: number, over: Record<string, unknown> = {}): any => ({ id: `s${day}${Math.random()}`, activity: "lesson", language: "english", durationSec: 60, wpm: 30, accuracy: 96, correct: 150, incorrect: 5, score: null, difficulty: null, layout: "english-qwerty", completedAt: new Date(2026, 10, day, 12).toISOString(), ...over });
const data = (sessions: any[], over: Record<string, unknown> = {}): any => ({ sessions, xp: 0, completedLessons: {}, lessonTotals: { english: 14, khmer: 13 }, arcadeBadges: { earned: 0, total: 30 }, ...over });
const get = (list: any[], id: string) => list.find((x) => x.id === id);

test("streak achievements count real consecutive practice days only", () => {
  assert.equal(a.longestDayRun([at(1), at(2), at(2), at(4), at(5), at(6)]), 3);
  assert.equal(a.longestDayRun([at(1, { correct: 3 }), at(2)]), 1, "a tiny session is not a practice day");
  const s = a.achievementStatuses(data([at(1), at(2), at(3)]));
  assert.equal(get(s, "on-a-roll").unlocked, true);
  assert.equal(get(s, "unstoppable").unlocked, false);
  assert.equal(get(s, "unstoppable").current, 3);
});

test("speed needs accuracy and a real run; progress is capped at the target", () => {
  const s = a.achievementStatuses(data([at(1, { wpm: 90, accuracy: 60 }), at(2, { wpm: 99, correct: 10 }), at(3, { wpm: 45 })]));
  assert.equal(get(s, "speed-40").unlocked, true);
  assert.equal(get(s, "speed-60").unlocked, false);
  assert.equal(get(s, "speed-60").current, 45);
  assert.equal(get(s, "speed-20").current, 20);
  assert.equal(get(s, "speed-20").pct, 100);
});

test("learning and gaming come from lessons and game sessions", () => {
  const s = a.achievementStatuses(data([at(1, { activity: "car-racing" }), at(2, { activity: "zombie-survival" })], { xp: 250, completedLessons: { "english:a": true, "khmer:b": true } }));
  for (const id of ["first-step", "khmer-explorer", "bilingual", "rising-star", "gamer-first"]) assert.equal(get(s, id).unlocked, true, id);
  assert.equal(get(s, "gamer-explorer").current, 2);
  assert.equal(get(s, "graduate").current, 8);
  assert.deepEqual(new Set(s.map((x: any) => x.category)), new Set(a.ACHIEVEMENT_CATEGORIES));
});
