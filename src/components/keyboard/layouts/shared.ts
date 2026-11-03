import type { KeySpec } from "./types";

const ch = (code: string, w = 1): KeySpec => ({ code, w, kind: "char" });
const letters = (s: string) => s.split("").map((l) => ch(`Key${l}`));

export const NUMBER_ROW_CHARS: KeySpec[] = [
  ch("Backquote"),
  ...["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].map((d) => ch(`Digit${d}`)),
  ch("Minus"),
  ch("Equal"),
];
export const TOP_CHARS: KeySpec[] = [...letters("QWERTYUIOP"), ch("BracketLeft"), ch("BracketRight")];
export const HOME_CHARS: KeySpec[] = [...letters("ASDFGHJKL"), ch("Semicolon"), ch("Quote")];
export const BOTTOM_CHARS: KeySpec[] = [...letters("ZXCVBNM"), ch("Comma"), ch("Period"), ch("Slash")];

export const fnRow = (last: KeySpec, escLabel: [string, string?]): KeySpec[] => [
  { code: "Escape", w: 1.5, kind: "fn", label: escLabel, align: "left" },
  ...Array.from({ length: 12 }, (_, i): KeySpec => ({ code: `F${i + 1}`, w: 1, kind: "fn", label: [`F${i + 1}`] })),
  last,
];

export { ch };
