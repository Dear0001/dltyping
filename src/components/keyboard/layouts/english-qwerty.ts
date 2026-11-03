import type { CharMap } from "./types";

const map: CharMap = {
  Backquote: ["`", "~"], Digit1: ["1", "!"], Digit2: ["2", "@"], Digit3: ["3", "#"], Digit4: ["4", "$"],
  Digit5: ["5", "%"], Digit6: ["6", "^"], Digit7: ["7", "&"], Digit8: ["8", "*"], Digit9: ["9", "("],
  Digit0: ["0", ")"], Minus: ["-", "_"], Equal: ["=", "+"],
  BracketLeft: ["[", "{"], BracketRight: ["]", "}"], Backslash: ["\\", "|"],
  Semicolon: [";", ":"], Quote: ["'", '"'], Comma: [",", "<"], Period: [".", ">"], Slash: ["/", "?"],
};
for (const l of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") map[`Key${l}`] = [l.toLowerCase(), l];

/** US QWERTY: physical key (event.code) -> [base, shift]. */
export const englishQwerty = map;
