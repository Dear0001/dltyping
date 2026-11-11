import { arcadeSentences, arcadeWords, type WordClass } from "@/data/arcade-content";
import { DIFFICULTY_INDEX, type ArcadeDifficulty } from "@/lib/arcade/difficulty";
import { nextSeed, randomFloat } from "@/lib/game-engine";
import { codepoints, normalizeKhmer } from "@/lib/khmer-unicode";
import type { Language } from "@/types";

export type { WordClass };

/** Small seeded generator: the same seed replays the same game content. */
export type Rng = { seed: number };
export const createRng = (seed: number): Rng => ({ seed: seed >>> 0 });
export function rand(rng: Rng) {
  rng.seed = nextSeed(rng.seed);
  return randomFloat(rng.seed);
}
export const randInt = (rng: Rng, n: number) => Math.floor(rand(rng) * n);
export const randRange = (rng: Rng, min: number, max: number) => min + rand(rng) * (max - min);
export const pickOne = <T>(rng: Rng, pool: readonly T[]): T => pool[randInt(rng, pool.length)];

const CLASSES: readonly WordClass[] = ["short", "medium", "long", "phrase"];
/** Moves a size up or down, staying inside the scale. */
export function shiftClass(cls: WordClass, by: number): WordClass {
  return CLASSES[Math.max(0, Math.min(CLASSES.length - 1, CLASSES.indexOf(cls) + by))];
}

const first = (text: string) => codepoints(normalizeKhmer(text))[0] ?? "";

/**
 * Picks a challenge of the given size. `avoidFirst` holds the first characters
 * already on screen, so each target can be selected by its first keystroke;
 * `avoid` holds texts that should not repeat right away.
 */
export function pickWord(rng: Rng, language: Language, cls: WordClass, avoidFirst?: ReadonlySet<string>, avoid?: ReadonlySet<string>, pool: readonly string[] = arcadeWords[language][cls]): string {
  let fallback = pickOne(rng, pool);
  for (let attempt = 0; attempt < 24; attempt++) {
    const word = pickOne(rng, pool);
    if (avoid?.has(word)) continue;
    fallback = word;
    if (!avoidFirst?.has(first(word))) return word;
  }
  return fallback;
}

/**
 * Lines of running text for a race: word rows on the lower difficulties,
 * real sentences (capitals and punctuation) on the higher ones.
 */
export function buildLines(rng: Rng, language: Language, difficulty: ArcadeDifficulty, minChars: number): string[] {
  const level = DIFFICULTY_INDEX[difficulty];
  const lines: string[] = [];
  let total = 0;
  let last = "";
  while (total < minChars) {
    let line: string;
    if (level <= 1) {
      const cls: WordClass = level === 0 ? "short" : "medium";
      const words: string[] = [];
      const count = level === 0 ? 5 : 4;
      while (words.length < count) {
        const word = pickWord(rng, language, cls, undefined, new Set(words));
        words.push(word);
      }
      line = words.join(" ");
    } else {
      const bank = arcadeSentences[language];
      const pool = level === 2 ? [...bank.easy, ...bank.medium] : [...bank.medium, ...bank.hard];
      line = pickOne(rng, pool);
      if (line === last) line = pool[(pool.indexOf(line) + 1) % pool.length];
    }
    last = line;
    lines.push(line);
    total += codepoints(normalizeKhmer(line)).length;
  }
  return lines;
}
