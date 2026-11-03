/**
 * Touch-typing finger assignments, as data. Fingers depend on the PHYSICAL key
 * (KeyboardEvent.code), never on the language layout or the operating system:
 * Khmer NiDA sits on QWERTY key positions, and Mac and Windows boards differ
 * only in modifier keys, so one table serves every keyboard configuration.
 * To change a finger assignment, edit FINGER_ASSIGNMENTS only.
 */
export type Hand = "left" | "right";
export type FingerName = "pinky" | "ring" | "middle" | "index" | "thumb";
export type FingerId = `${Hand}-${FingerName}`;

export const FINGER_NAMES: readonly FingerName[] = ["pinky", "ring", "middle", "index", "thumb"];
export const FINGER_IDS: readonly FingerId[] = [
  "left-pinky", "left-ring", "left-middle", "left-index", "left-thumb",
  "right-thumb", "right-index", "right-middle", "right-ring", "right-pinky",
];

/**
 * One colour per finger type, shared by both hands (the hand is shown by position and in the
 * instruction text). Every colour keeps 4.5:1 contrast with white text.
 */
export const FINGER_COLORS: Record<FingerName, string> = {
  pinky: "#7c3aed",
  ring: "#be185d",
  middle: "#c2410c",
  index: "#2563eb",
  thumb: "#0f766e",
};

export const FINGER_ASSIGNMENTS: Record<FingerId, readonly string[]> = {
  "left-pinky": ["Backquote", "Digit1", "KeyQ", "KeyA", "KeyZ", "Tab", "CapsLock", "ShiftLeft", "ControlLeft", "Escape", "Fn"],
  "left-ring": ["Digit2", "KeyW", "KeyS", "KeyX"],
  "left-middle": ["Digit3", "KeyE", "KeyD", "KeyC"],
  "left-index": ["Digit4", "Digit5", "KeyR", "KeyT", "KeyF", "KeyG", "KeyV", "KeyB"],
  "left-thumb": ["MetaLeft", "AltLeft"],
  "right-thumb": ["Space", "MetaRight", "AltRight"],
  "right-index": ["Digit6", "Digit7", "KeyY", "KeyU", "KeyH", "KeyJ", "KeyN", "KeyM"],
  "right-middle": ["Digit8", "KeyI", "KeyK", "Comma"],
  "right-ring": ["Digit9", "KeyO", "KeyL", "Period"],
  "right-pinky": [
    "Digit0", "Minus", "Equal", "Backspace", "KeyP", "BracketLeft", "BracketRight", "Backslash",
    "Semicolon", "Quote", "Slash", "Enter", "ShiftRight", "ControlRight",
  ],
};

/** Where each hand rests: the home-row key under each fingertip. */
export const HOME_ROW: Record<FingerId, string | null> = {
  "left-pinky": "KeyA", "left-ring": "KeyS", "left-middle": "KeyD", "left-index": "KeyF", "left-thumb": "Space",
  "right-thumb": "Space", "right-index": "KeyJ", "right-middle": "KeyK", "right-ring": "KeyL", "right-pinky": "Semicolon",
};

const BY_CODE: Record<string, FingerId> = {};
for (const [finger, codes] of Object.entries(FINGER_ASSIGNMENTS) as [FingerId, readonly string[]][]) {
  for (const code of codes) BY_CODE[code] = finger;
}

export const fingerForCode = (code: string): FingerId | null => BY_CODE[code] ?? null;
export const handOf = (finger: FingerId): Hand => (finger.startsWith("left") ? "left" : "right");
export const fingerNameOf = (finger: FingerId): FingerName => finger.slice(finger.indexOf("-") + 1) as FingerName;
export const colorOfFinger = (finger: FingerId) => FINGER_COLORS[fingerNameOf(finger)];

/** The Shift key (and its finger, the pinky) on the hand opposite the typing finger, so both hands share the work. */
export function shiftFor(code: string): { code: "ShiftLeft" | "ShiftRight"; finger: FingerId } {
  const finger = fingerForCode(code);
  const leftKey = finger !== null && handOf(finger) === "left";
  return leftKey ? { code: "ShiftRight", finger: "right-pinky" } : { code: "ShiftLeft", finger: "left-pinky" };
}

/** key code -> colour, for tinting every mapped key on the board. */
export const FINGER_COLOR_BY_CODE: Record<string, string> = Object.fromEntries(Object.entries(BY_CODE).map(([code, f]) => [code, colorOfFinger(f)]));
