import type { Language } from "@/types";

/** One physical key: [unshifted, shifted] output per layout. */
export type KeyDef = { code: string; en: [string, string]; km: [string, string] };

const k = (code: string, en: [string, string], km: [string, string]): KeyDef => ({ code, en, km });

// Khmer legends follow the Microsoft Khmer (NiDA) layout.
export const KEY_ROWS: KeyDef[][] = [
  [
    k("Digit1", ["1", "!"], ["១", "!"]), k("Digit2", ["2", "@"], ["២", "ៗ"]), k("Digit3", ["3", "#"], ["៣", '"']),
    k("Digit4", ["4", "$"], ["៤", "៛"]), k("Digit5", ["5", "%"], ["៥", "%"]), k("Digit6", ["6", "^"], ["៦", "៍"]),
    k("Digit7", ["7", "&"], ["៧", "័"]), k("Digit8", ["8", "*"], ["៨", "៏"]), k("Digit9", ["9", "("], ["៩", "("]),
    k("Digit0", ["0", ")"], ["០", ")"]), k("Minus", ["-", "_"], ["ឥ", "ឦ"]), k("Equal", ["=", "+"], ["ឲ", "៌"]),
  ],
  [
    k("KeyQ", ["q", "Q"], ["ឆ", "ឈ"]), k("KeyW", ["w", "W"], ["ឹ", "ឺ"]), k("KeyE", ["e", "E"], ["េ", "ែ"]),
    k("KeyR", ["r", "R"], ["រ", "ឬ"]), k("KeyT", ["t", "T"], ["ត", "ទ"]), k("KeyY", ["y", "Y"], ["យ", "ួ"]),
    k("KeyU", ["u", "U"], ["ុ", "ូ"]), k("KeyI", ["i", "I"], ["ិ", "ី"]), k("KeyO", ["o", "O"], ["ោ", "ៅ"]),
    k("KeyP", ["p", "P"], ["ផ", "ភ"]), k("BracketLeft", ["[", "{"], ["ៀ", "ឿ"]), k("BracketRight", ["]", "}"], ["ឪ", "ឧ"]),
  ],
  [
    k("KeyA", ["a", "A"], ["ា", "ាំ"]), k("KeyS", ["s", "S"], ["ស", "ៃ"]), k("KeyD", ["d", "D"], ["ដ", "ឌ"]),
    k("KeyF", ["f", "F"], ["ថ", "ធ"]), k("KeyG", ["g", "G"], ["ង", "អ"]), k("KeyH", ["h", "H"], ["ហ", "ះ"]),
    k("KeyJ", ["j", "J"], ["្", "ញ"]), k("KeyK", ["k", "K"], ["ក", "គ"]), k("KeyL", ["l", "L"], ["ល", "ឡ"]),
    k("Semicolon", [";", ":"], ["ើ", "ោះ"]), k("Quote", ["'", '"'], ["់", "៉"]),
  ],
  [
    k("KeyZ", ["z", "Z"], ["ឋ", "ឍ"]), k("KeyX", ["x", "X"], ["ខ", "ឃ"]), k("KeyC", ["c", "C"], ["ច", "ជ"]),
    k("KeyV", ["v", "V"], ["វ", "េះ"]), k("KeyB", ["b", "B"], ["ប", "ព"]), k("KeyN", ["n", "N"], ["ន", "ណ"]),
    k("KeyM", ["m", "M"], ["ម", "ំ"]), k("Comma", [",", "<"], ["ុំ", "ុះ"]), k("Period", [".", ">"], ["។", "៕"]),
    k("Slash", ["/", "?"], ["៊", "?"]),
  ],
];

const BY_CODE = new Map(KEY_ROWS.flat().map((key) => [key.code, key]));

/** What a physical key (identified by event.code) produces in a layout. */
export function charForCode(language: Language, code: string, shift: boolean): string | null {
  const key = BY_CODE.get(code);
  if (!key) return null;
  return (language === "khmer" ? key.km : key.en)[shift ? 1 : 0];
}

/** Which key (and shift state) types `char`. Used to highlight the next key. */
export function findKeyFor(language: Language, char: string): { code: string; shift: boolean } | null {
  if (char === " ") return { code: "Space", shift: false };
  const index = language === "khmer" ? "km" : "en";
  let loose: { code: string; shift: boolean } | null = null;
  for (const key of KEY_ROWS.flat()) {
    const [base, shifted] = key[index];
    if (base === char) return { code: key.code, shift: false };
    if (shifted === char) return { code: key.code, shift: true };
    if (!loose && base.startsWith(char)) loose = { code: key.code, shift: false };
    if (!loose && shifted.startsWith(char)) loose = { code: key.code, shift: true };
  }
  return loose;
}
