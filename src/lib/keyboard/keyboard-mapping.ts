import { englishQwerty } from "@/components/keyboard/layouts/english-qwerty";
import { khmerNida } from "@/components/keyboard/layouts/khmer-nida";
import type { CharMap } from "@/components/keyboard/layouts/types";
import type { Language } from "@/types";

export const charMapFor = (language: Language): CharMap => (language === "khmer" ? khmerNida : englishQwerty);

/** What a physical key (event.code) produces in a layout. */
export function charForCode(language: Language, code: string, shift: boolean): string | null {
  if (code === "Space") return " ";
  return charMapFor(language)[code]?.[shift ? 1 : 0] ?? null;
}

export type KeyTarget = { code: string; shift: boolean };

/** Which key (and Shift state) types `char`. Exact legend match first, then a legend that starts with it. */
export function findKeyFor(language: Language, char: string): KeyTarget | null {
  if (!char) return null;
  if (char === " ") return { code: "Space", shift: false };
  const map = charMapFor(language);
  let loose: KeyTarget | null = null;
  for (const [code, [base, shifted]] of Object.entries(map)) {
    if (base === char) return { code, shift: false };
    if (shifted === char) return { code, shift: true };
    if (!loose && base.startsWith(char)) loose = { code, shift: false };
    if (!loose && shifted.startsWith(char)) loose = { code, shift: true };
  }
  return loose;
}

/**
 * Did this physical press produce the expected character? Compares what the key
 * outputs in the layout (not the browser's text), so it works the same with or
 * without a Khmer IME. A shifted legend that begins with the expected character
 * (e.g. ាំ for ា) counts as correct.
 */
export function isCorrectPress(language: Language, code: string, shift: boolean, caps: boolean, expected: string): boolean {
  const effectiveShift = language === "english" && /^Key[A-Z]$/.test(code) ? shift !== caps : shift;
  const produced = charForCode(language, code, effectiveShift);
  return produced !== null && (produced === expected || produced.startsWith(expected));
}
