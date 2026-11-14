import { englishQwerty } from "@/components/keyboard/layouts/english-qwerty";
import { khmerNida, khmerNidaAltGr } from "@/components/keyboard/layouts/khmer-nida";
import type { CharMap } from "@/components/keyboard/layouts/types";
import { isKhmerChar } from "@/lib/khmer-unicode";
import type { Language } from "@/types";

export const charMapFor = (language: Language): CharMap => (language === "khmer" ? khmerNida : englishQwerty);
/** Third-level (AltGr / Option) outputs. English QWERTY has none that lessons use. */
export const altGrMapFor = (language: Language): Record<string, string> => (language === "khmer" ? khmerNidaAltGr : {});

/** What a physical key (event.code) produces in a layout. */
export function charForCode(language: Language, code: string, shift: boolean, altGr = false): string | null {
  if (code === "Space") return " ";
  if (altGr) return altGrMapFor(language)[code] ?? null;
  return charMapFor(language)[code]?.[shift ? 1 : 0] ?? null;
}

export type KeyTarget = { code: string; shift: boolean; altGr?: boolean };

/** Which key (and Shift / AltGr state) types `char`. Exact legend match first, then a legend that starts with it. */
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
  if (loose) return loose;
  for (const [code, out] of Object.entries(altGrMapFor(language))) if (out === char) return { code, shift: false, altGr: true };
  return null;
}

/**
 * Did this physical press produce the expected character? Compares what the key
 * outputs in the layout (not the browser's text), so it works the same with or
 * without a Khmer IME. A shifted legend that begins with the expected character
 * (e.g. ាំ for ា) counts as correct.
 */
export function isCorrectPress(language: Language, code: string, shift: boolean, caps: boolean, expected: string, altGr = false): boolean {
  const effectiveShift = language === "english" && /^Key[A-Z]$/.test(code) ? shift !== caps : shift;
  const produced = charForCode(language, code, effectiveShift, altGr);
  return produced !== null && (produced === expected || produced.startsWith(expected));
}

/** Multi-code-point outputs of a single NiDA key (ាំ, ោះ, េះ, ុំ, ុះ), longest first. */
const MULTI_KEY_OUTPUTS = Object.values(khmerNida).flat().filter((out) => Array.from(out).length > 1).sort((a, b) => b.length - a.length);

/**
 * Groups newly typed code points into physical keystrokes, so one press of a NiDA key
 * that types two code points (Shift+A → ាំ) counts as one keystroke for accuracy.
 * Each group is judged wrong when any of its code points misses the expected text.
 */
export function keystrokesOf(added: readonly string[], expected: readonly string[], language: Language): { total: number; wrong: number } {
  let total = 0, wrong = 0;
  for (let i = 0; i < added.length;) {
    let size = 1;
    if (language === "khmer") {
      const rest = added.slice(i).join("");
      const multi = MULTI_KEY_OUTPUTS.find((out) => rest.startsWith(out));
      if (multi) size = Array.from(multi).length;
    }
    total++;
    for (let k = i; k < i + size; k++) if (added[k] !== expected[k]) { wrong++; break; }
    i += size;
  }
  return { total, wrong };
}

type KeyLike = Pick<KeyboardEvent, "key" | "code" | "shiftKey" | "altKey" | "ctrlKey" | "metaKey" | "repeat"> & { isComposing?: boolean };

/** AltGr arrives as Ctrl+Alt on Windows and Linux, and as Option (alt without ctrl) on macOS. */
const isAltGr = (e: KeyLike) => e.altKey && !e.metaKey;

/**
 * NiDA emulation for a text box. Returns the Khmer text a key press should type when
 * the operating system is NOT on a Khmer keyboard (the browser reports a Latin key),
 * or null to let the browser handle the key normally: a real Khmer IME, IME
 * composition, shortcuts, Space, Backspace and other non-character keys.
 * The physical key (event.code) decides the output, so it also works on AZERTY,
 * Dvorak or any other Latin layout.
 */
export function emulatedNidaInput(e: KeyLike, language: Language): string | null {
  if (language !== "khmer" || e.isComposing || e.key === "Process" || e.key === "Dead" || e.code === "Space") return null;
  if (e.metaKey || (e.ctrlKey && !e.altKey)) return null;
  const key = e.key ?? "";
  // A Khmer character means the OS keyboard is already Khmer: trust it.
  if (isKhmerChar(key)) return null;
  // Printable keys only: named keys ("Enter", "Tab", "ArrowLeft"...) are longer than one code point.
  const printable = Array.from(key).length === 1 || (isAltGr(e) && /^Key|^Semicolon$|^Quote$/.test(e.code));
  if (!printable) return null;
  const out = charForCode("khmer", e.code, e.shiftKey, isAltGr(e));
  if (!out) return null;
  // Same text the browser would type (e.g. "!" on Shift+1): no need to intercept.
  return out === key ? null : out;
}
