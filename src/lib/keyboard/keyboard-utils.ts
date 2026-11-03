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

/** Keys typed with the left hand: used to suggest the opposite Shift. */
const LEFT_HAND = new Set(["Backquote", "Digit1", "Digit2", "Digit3", "Digit4", "Digit5", "KeyQ", "KeyW", "KeyE", "KeyR", "KeyT", "KeyA", "KeyS", "KeyD", "KeyF", "KeyG", "KeyZ", "KeyX", "KeyC", "KeyV", "KeyB"]);
export const oppositeShift = (code: string) => (LEFT_HAND.has(code) ? "ShiftRight" : "ShiftLeft");
