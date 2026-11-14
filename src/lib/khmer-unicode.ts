// Khmer Unicode helpers. Khmer is written in clusters: a base consonant plus
// subscript consonants (COENG + consonant), vowels and signs. Treating every
// code point as a visible character breaks rendering and feedback, so game and
// practice code should go through splitGraphemes() for display and codepoints()
// for keystroke-level validation.

export const COENG = "្";
const KHMER_CHAR = /[ក-៿᧠-᧿]/u;

/**
 * Normalize canonically equivalent sequences and strip zero-width characters.
 * Subscript DA (្ដ) and subscript TA (្ត) are drawn identically, and Khmer texts
 * use both for the same words, so a learner cannot see which one is expected.
 * Both are folded to ្ត: typing J then T (or J then D) is correct either way.
 */
export function normalizeKhmer(value: string) {
  return value.normalize("NFC").replace(/[​‌‍﻿]/g, "").replace(/\u17D2\u178A/g, "\u17D2\u178F");
}

/**
 * Text the learner typed, ready to compare with the lesson. The Windows Khmer
 * (NiDA) layout types ZERO WIDTH SPACE (U+200B) on the Space bar, which
 * normalizeKhmer would silently drop, leaving the learner stuck on every space.
 * A typed U+200B is therefore read as a space press.
 */
export function normalizeTypedInput(value: string, khmer: boolean) {
  return khmer ? value.replace(/\u200B/g, " ") : value;
}

export function isKhmerChar(value: string) {
  return KHMER_CHAR.test(value);
}

export function isKhmerText(value: string) {
  return /^[ក-៿᧠-᧿\s​‌‍﻿]*$/u.test(value);
}

/** Unicode code points (never UTF-16 halves). One entry per typed keystroke. */
export function codepoints(value: string) {
  return Array.from(value);
}

type SegmenterLike = { segment(input: string): Iterable<{ segment: string }> };
let segmenter: SegmenterLike | null | undefined;

function getSegmenter(): SegmenterLike | null {
  if (segmenter !== undefined) return segmenter;
  try {
    const Ctor = (Intl as unknown as { Segmenter?: new (locale: string, options: { granularity: string }) => SegmenterLike }).Segmenter;
    segmenter = Ctor ? new Ctor("km", { granularity: "grapheme" }) : null;
  } catch {
    segmenter = null;
  }
  return segmenter;
}

function baseGraphemes(value: string): string[] {
  const seg = getSegmenter();
  if (seg) return Array.from(seg.segment(value), (part) => part.segment);
  // Fallback: a base character followed by any combining marks.
  return value.match(/\P{M}\p{M}*/gu) ?? [];
}

/**
 * Split text into user-perceived characters. Intl.Segmenter (or the regex
 * fallback) keeps vowels and signs attached to their base, and the merge step
 * additionally attaches a subscript consonant to its COENG, so "ក្រុម" is
 * [ក្រុ, ម] style clusters rather than loose code points.
 */
export function splitGraphemes(value: string): string[] {
  const parts = baseGraphemes(normalizeKhmer(value));
  const merged: string[] = [];
  for (const part of parts) {
    const previous = merged[merged.length - 1];
    if (previous !== undefined && previous.endsWith(COENG) && isKhmerChar(part)) merged[merged.length - 1] = previous + part;
    else merged.push(part);
  }
  return merged;
}

export const splitKhmerClusters = splitGraphemes;
