import { BOTTOM_CHARS, HOME_CHARS, NUMBER_ROW_CHARS, TOP_CHARS, ch, fnRow } from "./shared";
import type { PhysicalLayout } from "./types";

/** Full-size Windows (ANSI) keyboard, 15u wide. */
export const windowsLayout: PhysicalLayout = {
  os: "windows",
  rows: [
    fnRow({ code: "Delete", w: 1.5, kind: "fn", label: ["Del"], align: "right" }, ["Esc"]),
    [...NUMBER_ROW_CHARS, { code: "Backspace", w: 2, kind: "mod", label: ["⌫", "Backspace"], align: "right" }],
    [{ code: "Tab", w: 1.5, kind: "mod", label: ["Tab"], align: "left" }, ...TOP_CHARS, ch("Backslash", 1.5)],
    [{ code: "CapsLock", w: 1.75, kind: "mod", mod: "caps", label: ["Caps Lock"], align: "left" }, ...HOME_CHARS, { code: "Enter", w: 2.25, kind: "mod", label: ["Enter", "↵"], align: "right" }],
    [{ code: "ShiftLeft", w: 2.25, kind: "mod", mod: "shift", label: ["Shift", "⇧"], align: "left" }, ...BOTTOM_CHARS, { code: "ShiftRight", w: 2.75, kind: "mod", mod: "shift", label: ["Shift", "⇧"], align: "right" }],
    [
      { code: "ControlLeft", w: 1.25, kind: "mod", mod: "ctrl", label: ["Ctrl"] },
      { code: "MetaLeft", w: 1.25, kind: "mod", mod: "meta", label: ["⊞", "Win"] },
      { code: "AltLeft", w: 1.25, kind: "mod", mod: "alt", label: ["Alt"] },
      { code: "Space", w: 6.25, kind: "space", label: [""] },
      { code: "AltRight", w: 1.25, kind: "mod", mod: "alt", label: ["Alt"] },
      { code: "MetaRight", w: 1.25, kind: "mod", mod: "meta", label: ["⊞", "Win"] },
      { code: "ContextMenu", w: 1.25, kind: "mod", label: ["☰", "Menu"] },
      { code: "ControlRight", w: 1.25, kind: "mod", mod: "ctrl", label: ["Ctrl"] },
    ],
  ],
};
