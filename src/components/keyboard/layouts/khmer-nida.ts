import type { CharMap } from "./types";

/**
 * Khmer NiDA (Microsoft "Khmer (NIDA)") layout: physical key -> [base, shift].
 * Key positions are those of US QWERTY. Backquote («/») and Backslash (ឮ/ឭ)
 * were cross-checked against the NiDA-authored XKB `kh` layout.
 */
export const khmerNida: CharMap = {
  Backquote: ["«", "»"],
  Digit1: ["១", "!"], Digit2: ["២", "ៗ"], Digit3: ["៣", '"'], Digit4: ["៤", "៛"], Digit5: ["៥", "%"],
  Digit6: ["៦", "៍"], Digit7: ["៧", "័"], Digit8: ["៨", "៏"], Digit9: ["៩", "("], Digit0: ["០", ")"],
  Minus: ["ឥ", "ឦ"], Equal: ["ឲ", "៌"],
  KeyQ: ["ឆ", "ឈ"], KeyW: ["ឹ", "ឺ"], KeyE: ["េ", "ែ"], KeyR: ["រ", "ឬ"], KeyT: ["ត", "ទ"],
  KeyY: ["យ", "ួ"], KeyU: ["ុ", "ូ"], KeyI: ["ិ", "ី"], KeyO: ["ោ", "ៅ"], KeyP: ["ផ", "ភ"],
  BracketLeft: ["ៀ", "ឿ"], BracketRight: ["ឪ", "ឧ"], Backslash: ["ឮ", "ឭ"],
  KeyA: ["ា", "ាំ"], KeyS: ["ស", "ៃ"], KeyD: ["ដ", "ឌ"], KeyF: ["ថ", "ធ"], KeyG: ["ង", "អ"],
  KeyH: ["ហ", "ះ"], KeyJ: ["្", "ញ"], KeyK: ["ក", "គ"], KeyL: ["ល", "ឡ"],
  Semicolon: ["ើ", "ោះ"], Quote: ["់", "៉"],
  KeyZ: ["ឋ", "ឍ"], KeyX: ["ខ", "ឃ"], KeyC: ["ច", "ជ"], KeyV: ["វ", "េះ"], KeyB: ["ប", "ព"],
  KeyN: ["ន", "ណ"], KeyM: ["ម", "ំ"], Comma: ["ុំ", "ុះ"], Period: ["។", "៕"], Slash: ["៊", "?"],
};
