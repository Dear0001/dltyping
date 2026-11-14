import { makeDrill } from "@/lib/keyboard/key-stats";
import { findKeyFor } from "@/lib/keyboard/keyboard-mapping";
import type { Language } from "@/types";

/**
 * Practice links from the dashboard carry what to drill as URL params:
 *   drill=QP        single characters
 *   combo=th,er     two-character combinations
 *   words=because   whole words
 * The server page turns them into drill text, so the page and the client agree.
 */
export type DrillParams = { drill?: string; combo?: string; words?: string };

const MAX_ITEMS = 8;

/** Unique characters that exist on the layout, capped. */
export function parseChars(language: Language, raw?: string): string[] {
  if (!raw) return [];
  return [...new Set(Array.from(raw))].filter((c) => c.trim() !== "" && findKeyFor(language, c)).slice(0, MAX_ITEMS);
}

function parseList(raw: string | undefined, valid: (item: string) => boolean): string[] {
  return (raw ?? "").split(",").map((s) => s.trim()).filter((s) => s && valid(s)).slice(0, MAX_ITEMS);
}

export const parseCombos = (language: Language, raw?: string) =>
  parseList(raw, (c) => Array.from(c).length === 2 && Array.from(c).every((ch) => ch.trim() !== "" && findKeyFor(language, ch)));
export const parseWords = (raw?: string, language: Language = "english") =>
  parseList(raw, (w) => (language === "khmer" ? /^[\u1780-\u17DD]{2,24}$/u.test(w) : /^[a-z']{2,24}$/i.test(w)));

/** Repeats each item a few times, shuffled, until the text is about `length` characters. */
function repeatDrill(items: string[], length: number, rand: () => number): string {
  const out: string[] = [];
  let size = 0;
  while (size < length) {
    const item = items[Math.floor(rand() * items.length)];
    const times = 2 + Math.floor(rand() * 2);
    for (let i = 0; i < times && size < length; i++) {
      out.push(item);
      size += Array.from(item).length + 1;
    }
  }
  return out.join(" ");
}

/** Drill text for the given params, or null when none are valid. */
export function buildDrillText(language: Language, params: DrillParams, rand: () => number = Math.random): string | null {
  // Khmer words come from the dictionary word breaker (see tallyWordsFromText); the drill separates them with spaces.
  const words = parseWords(params.words, language);
  if (words.length) return repeatDrill(words, 60, rand);
  const combos = parseCombos(language, params.combo);
  if (combos.length) return repeatDrill(combos, 54, rand);
  const chars = parseChars(language, params.drill);
  if (chars.length) return makeDrill(chars, 48, rand) || null;
  return null;
}

export function drillHref(language: Language, params: DrillParams, extra?: Record<string, string>): string {
  const q = new URLSearchParams();
  if (params.drill) q.set("drill", params.drill);
  if (params.combo) q.set("combo", params.combo);
  if (params.words) q.set("words", params.words);
  for (const [k, v] of Object.entries(extra ?? {})) q.set(k, v);
  return `/learn/${language}?${q.toString()}`;
}

/** Letter Jump limited to the given characters. `keys` is read by the game page. */
export function letterJumpHref(language: Language, chars: string[]): string {
  const q = new URLSearchParams({ lang: language, keys: chars.join("") });
  return `/games/letter-jump?${q.toString()}`;
}
