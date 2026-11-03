import { shiftFor } from "@/lib/keyboard/finger-mapping";

/** Split text into user-perceived characters (grapheme clusters). Khmer clusters stay whole. */
export function graphemes(text: string): string[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    return Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text), (s) => s.segment);
  }
  return Array.from(text);
}

// Khmer dependent vowels and signs need a base to render sensibly on a keycap.
const DEPENDENT = /^[ា-៑៓៝]/u;

/** Legend text for a keycap: dependent signs get a dotted-circle base. */
export function legendGlyph(text: string): string {
  return DEPENDENT.test(text) ? `◌${text}` : text;
}

export const isLetterKey = (code: string) => /^Key[A-Z]$/.test(code);

/** Shift key on the hand opposite the typing finger. Finger data lives in finger-mapping. */
export const oppositeShift = (code: string) => shiftFor(code).code;
