import { arcadeWords } from "@/data/arcade-content";
import { spaceVocabulary, TOPIC_CATEGORIES, type SpaceTopic } from "@/data/space-content";
import { pickWord, type Rng, type WordClass } from "@/lib/arcade/content";
import { codepoints, normalizeKhmer } from "@/lib/khmer-unicode";
import type { Language } from "@/types";

/** Sorts a word into a size by keystrokes (never by UTF-16 length). */
export function classify(word: string): WordClass {
  if (word.includes(" ")) return "phrase";
  const n = codepoints(normalizeKhmer(word)).length;
  return n <= 5 ? "short" : n <= 8 ? "medium" : "long";
}

const MIN_POOL = 8;
const cache = new Map<string, string[]>();

/** Every word of a topic and size; topped up from the general arcade lists when a topic has too few. */
export function spacePool(language: Language, topic: SpaceTopic, cls: WordClass): string[] {
  const key = `${language}:${topic}:${cls}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const vocab = spaceVocabulary[language];
  const words = cls === "phrase" ? [...vocab.sentences] : TOPIC_CATEGORIES[topic].flatMap((c) => vocab[c]).filter((word) => classify(word) === cls);
  if (cls === "long" && topic !== "general") words.push(...vocab.advanced);
  const pool = Array.from(new Set(words.length >= MIN_POOL ? words : [...words, ...arcadeWords[language][cls]]));
  cache.set(key, pool);
  return pool;
}

/** A challenge word that does not share its first letter with targets already on screen. */
export function spaceWord(rng: Rng, language: Language, topic: SpaceTopic, cls: WordClass, avoidFirst: ReadonlySet<string>, avoid: ReadonlySet<string>) {
  return pickWord(rng, language, cls, avoidFirst, avoid, spacePool(language, topic, cls));
}
