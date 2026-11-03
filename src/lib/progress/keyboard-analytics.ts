import { charMapFor, findKeyFor } from "@/lib/keyboard/keyboard-mapping";
import { legendGlyph } from "@/lib/keyboard/keyboard-utils";
import type { Language } from "@/types";
import type { ProgressStore } from "@/types/progress";

/** Below this many keystrokes a key is "too early to rate": a few slips must not brand a key as weak. */
export const MIN_SAMPLES = 20;
export const EXCELLENT_AT = 95;
export const GOOD_AT = 85;

export type MasteryLevel = "excellent" | "good" | "weak" | "learning" | "none";

export const MASTERY_META: Record<MasteryLevel, { label: string; blurb: string }> = {
  excellent: { label: "Excellent", blurb: `${EXCELLENT_AT}%+ accuracy, strong mastery` },
  good: { label: "Good", blurb: `${GOOD_AT}-${EXCELLENT_AT - 1}% accuracy, moderate mastery` },
  weak: { label: "Needs improvement", blurb: `Under ${GOOD_AT}% accuracy` },
  learning: { label: "Too few keystrokes", blurb: `Fewer than ${MIN_SAMPLES} keystrokes, not rated yet` },
  none: { label: "Not practiced", blurb: "No data yet" },
};

export function masteryLevel(total: number, accuracy: number): MasteryLevel {
  if (total <= 0) return "none";
  if (total < MIN_SAMPLES) return "learning";
  if (accuracy >= EXCELLENT_AT) return "excellent";
  if (accuracy >= GOOD_AT) return "good";
  return "weak";
}

export type CharPerformance = { char: string; layer: "base" | "shift"; total: number; correct: number; accuracy: number | null };

export type KeyAnalysis = {
  code: string;
  language: Language;
  total: number;
  correct: number;
  incorrect: number;
  /** 0-100, or null when never practiced */
  accuracy: number | null;
  /** epoch ms, or null when never practiced */
  lastPracticed: number | null;
  level: MasteryLevel;
  /** keystrokes still needed before the key is rated */
  samplesNeeded: number;
  /** What this physical key produces in the layout: base and Shift layers, each with its own record. */
  chars: CharPerformance[];
};

const pct = (c: number, n: number) => (n > 0 ? Math.round((c / n) * 100) : null);

/** Physical key name for headings and tooltips, e.g. KeyQ -> "Q", Semicolon -> ";". */
export function physicalKeyName(code: string): string {
  if (code === "Space") return "Space";
  const latin = charMapFor("english")[code]?.[0];
  if (latin) return latin.toUpperCase();
  return code;
}

/** What the cap shows for a key in a language (Khmer glyph or Latin letter). */
export const keyCapGlyph = (language: Language, code: string) => {
  const base = charMapFor(language)[code]?.[0];
  return base ? legendGlyph(base) : code;
};

export function analyzeKey(store: ProgressStore, language: Language, code: string): KeyAnalysis {
  const rec = store.keys[`${language}:${code}`];
  const map = charMapFor(language)[code];
  const chars: CharPerformance[] = [];
  const seen = new Set<string>();
  const add = (char: string, layer: "base" | "shift") => {
    if (seen.has(char)) return;
    seen.add(char);
    const t = rec?.chars[char];
    chars.push({ char, layer, total: t?.n ?? 0, correct: t?.c ?? 0, accuracy: t ? pct(t.c, t.n) : null });
  };
  if (code === "Space") add(" ", "base");
  if (map) {
    add(map[0], "base");
    add(map[1], "shift");
  }
  // Characters recorded through a looser match (e.g. a Khmer unit that starts with the legend).
  for (const ch of Object.keys(rec?.chars ?? {})) {
    const target = findKeyFor(language, ch);
    if (target?.code === code) add(ch, target.shift ? "shift" : "base");
  }
  const total = rec?.n ?? 0, correct = rec?.c ?? 0;
  const accuracy = pct(correct, total);
  return {
    code, language, total, correct, incorrect: total - correct, accuracy,
    lastPracticed: rec && total > 0 ? rec.last : null,
    level: masteryLevel(total, accuracy ?? 0),
    samplesNeeded: total > 0 && total < MIN_SAMPLES ? MIN_SAMPLES - total : 0,
    chars,
  };
}

export function analyzeKeyboard(store: ProgressStore, language: Language): Record<string, KeyAnalysis> {
  const codes = new Set(Object.keys(charMapFor(language)));
  codes.add("Space");
  for (const id of Object.keys(store.keys)) if (id.startsWith(`${language}:`)) codes.add(id.slice(language.length + 1));
  return Object.fromEntries([...codes].map((code) => [code, analyzeKey(store, language, code)]));
}

/** Keys rated "needs improvement" (enough data and low accuracy), worst first. */
export function weakKeysOf(analysis: Record<string, KeyAnalysis>, limit = 8): KeyAnalysis[] {
  return Object.values(analysis)
    .filter((k) => k.level === "weak" && k.code !== "Space")
    .sort((a, b) => (a.accuracy ?? 100) - (b.accuracy ?? 100) || b.total - a.total)
    .slice(0, limit);
}

export function masterySummary(analysis: Record<string, KeyAnalysis>) {
  const counts: Record<MasteryLevel, number> = { excellent: 0, good: 0, weak: 0, learning: 0, none: 0 };
  let total = 0;
  for (const k of Object.values(analysis)) {
    if (k.total > 0) { counts[k.level] += 1; total += k.total; }
  }
  return { counts, totalKeystrokes: total, practicedKeys: Object.values(analysis).filter((k) => k.total > 0).length };
}

/** Chars worth drilling for a key: everything its layers produce (a Khmer key has two), minus whitespace. */
export const drillCharsFor = (analysis: KeyAnalysis): string[] => analysis.chars.map((c) => c.char).filter((c) => c.trim() !== "");

export function describeLastPracticed(ms: number | null, now: number): string {
  if (ms === null) return "Never";
  const days = Math.floor((now - ms) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function keyTooltip(a: KeyAnalysis): string {
  const name = physicalKeyName(a.code);
  if (a.total === 0) return `${name}: not practiced yet`;
  if (a.level === "learning") return `${name}: ${a.accuracy}% over ${a.total} keystrokes, ${a.samplesNeeded} more to rate`;
  return `${name}: ${a.accuracy}% accuracy over ${a.total} keystrokes (${MASTERY_META[a.level].label})`;
}
