import { findKeyFor } from "@/lib/keyboard/keyboard-mapping";
import type { KeyStats } from "@/lib/keyboard/key-stats";
import type { MasteryLevel } from "@/lib/progress/keyboard-analytics";
import type { Language } from "@/types";

/**
 * Speed view of the keyboard heatmap. Every keystroke in practice, tests and the
 * daily challenge stores the time since the previous key (pauses over 2.5s excluded),
 * per expected character. Here those are summed per physical key and compared with
 * the learner's own average, so the colours mean "faster/slower than you usually are".
 */
export const MIN_TIMED = 10;
/** Within ±15% of your own average counts as normal pace. */
export const FAST_RATIO = 0.85;
export const SLOW_RATIO = 1.15;

export type KeySpeed = { code: string; avgMs: number | null; timed: number; level: MasteryLevel };
export type SpeedSummary = { keys: Record<string, KeySpeed>; overallMs: number | null; slowest: KeySpeed[]; ratedKeys: number };

export const SPEED_META: Record<MasteryLevel, { label: string; blurb: string }> = {
  excellent: { label: "Fast", blurb: "15%+ quicker than your average" },
  good: { label: "Normal pace", blurb: "Within 15% of your average" },
  weak: { label: "Slow", blurb: "15%+ slower than your average" },
  learning: { label: "Too few timed presses", blurb: `Fewer than ${MIN_TIMED} timed presses, not rated yet` },
  none: { label: "No timing data", blurb: "No timed presses yet" },
};

export function speedLevel(avgMs: number | null, timed: number, overallMs: number | null): MasteryLevel {
  if (!timed || avgMs === null) return "none";
  if (timed < MIN_TIMED || !overallMs) return "learning";
  const ratio = avgMs / overallMs;
  if (ratio <= FAST_RATIO) return "excellent";
  if (ratio <= SLOW_RATIO) return "good";
  return "weak";
}

export function analyzeKeySpeed(language: Language, stats: KeyStats, slowestCount = 6): SpeedSummary {
  const byCode: Record<string, { ms: number; t: number }> = {};
  for (const [char, s] of Object.entries(stats)) {
    if (!s.t) continue;
    const code = findKeyFor(language, char)?.code;
    if (!code) continue;
    const acc = (byCode[code] ??= { ms: 0, t: 0 });
    acc.ms += s.ms;
    acc.t += s.t;
  }
  // The average is taken over rated keys only, so a handful of rare keys cannot skew it.
  const rated = Object.values(byCode).filter((k) => k.t >= MIN_TIMED);
  const totals = rated.reduce((a, k) => ({ ms: a.ms + k.ms, t: a.t + k.t }), { ms: 0, t: 0 });
  const overallMs = totals.t ? totals.ms / totals.t : null;
  const keys: Record<string, KeySpeed> = {};
  for (const [code, { ms, t }] of Object.entries(byCode)) {
    const avgMs = t ? ms / t : null;
    keys[code] = { code, avgMs, timed: t, level: speedLevel(avgMs, t, overallMs) };
  }
  const slowest = Object.values(keys)
    .filter((k) => k.level === "weak")
    .sort((a, b) => (b.avgMs ?? 0) - (a.avgMs ?? 0))
    .slice(0, slowestCount);
  return { keys, overallMs, slowest, ratedKeys: rated.length };
}

/** Typing speed for one key as words per minute, the unit the rest of the app uses. */
export const msToWpm = (ms: number) => (ms > 0 ? Math.round(60000 / ms / 5) : 0);
