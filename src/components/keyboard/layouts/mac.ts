import { BOTTOM_CHARS, HOME_CHARS, NUMBER_ROW_CHARS, TOP_CHARS, ch, fnRow } from "./shared";
import type { PhysicalLayout } from "./types";

/** MacBook-style keyboard, 15u wide. Modifier legends: symbol above name. */
export const macLayout: PhysicalLayout = {
  os: "mac",
  rows: [
    fnRow({ code: "Power", w: 1.5, kind: "fn", label: ["⏻"], align: "right" }, ["esc"]),
    [...NUMBER_ROW_CHARS, { code: "Backspace", w: 2, kind: "mod", label: ["⌫", "delete"], align: "right" }],
    [{ code: "Tab", w: 1.5, kind: "mod", label: ["⇥", "tab"], align: "left" }, ...TOP_CHARS, ch("Backslash", 1.5)],
    [{ code: "CapsLock", w: 1.75, kind: "mod", mod: "caps", label: ["⇪", "caps lock"], align: "left" }, ...HOME_CHARS, { code: "Enter", w: 2.25, kind: "mod", label: ["⏎", "return"], align: "right" }],
    [{ code: "ShiftLeft", w: 2.25, kind: "mod", mod: "shift", label: ["⇧", "shift"], align: "left" }, ...BOTTOM_CHARS, { code: "ShiftRight", w: 2.75, kind: "mod", mod: "shift", label: ["⇧", "shift"], align: "right" }],
    [
      { code: "Fn", w: 1, kind: "mod", label: ["fn"] },
      { code: "ControlLeft", w: 1, kind: "mod", mod: "ctrl", label: ["⌃", "control"] },
      { code: "AltLeft", w: 1, kind: "mod", mod: "alt", label: ["⌥", "option"] },
      { code: "MetaLeft", w: 1.25, kind: "mod", mod: "meta", label: ["⌘", "command"] },
      { code: "Space", w: 5.5, kind: "space", label: [""] },
      { code: "MetaRight", w: 1.25, kind: "mod", mod: "meta", label: ["⌘", "command"] },
      { code: "AltRight", w: 1, kind: "mod", mod: "alt", label: ["⌥", "option"] },
      { code: "ArrowLeft", w: 1, kind: "mod", label: ["◀"] },
      {
        code: "ArrowStack", w: 1, kind: "mod",
        stack: [{ code: "ArrowUp", w: 1, kind: "mod", label: ["▲"] }, { code: "ArrowDown", w: 1, kind: "mod", label: ["▼"] }],
      },
      { code: "ArrowRight", w: 1, kind: "mod", label: ["▶"] },
    ],
  ],
};
