/** Shared types for configuration-driven keyboard layouts. */
export type KeyboardOS = "mac" | "windows";
export type ModifierName = "shift" | "ctrl" | "alt" | "meta" | "caps";

export type KeySpec = {
  /** KeyboardEvent.code of the physical key. Unique per layout. */
  code: string;
  /** Key width in standard 1u keys (a 60% board is 15u wide). */
  w: number;
  kind: "char" | "mod" | "fn" | "space";
  /** Modifier this key represents (for active-state highlighting). */
  mod?: ModifierName;
  /** Printed legend for non-character keys: [symbol?, name]. */
  label?: [string, string?];
  /** Align the legend to the key's left/right (Tab, Caps, Shift, Enter...). */
  align?: "left" | "right";
  /** Two half-height keys stacked in one cell (arrow keys). */
  stack?: [KeySpec, KeySpec];
};

export type PhysicalLayout = { os: KeyboardOS; rows: KeySpec[][] };

/** Output of a physical key per layer: [base, shift]. */
export type CharMap = Record<string, [string, string]>;
