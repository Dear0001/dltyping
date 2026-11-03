"use client";

import { useCallback } from "react";
import { useStoredValue } from "@/hooks/use-stored-value";
import { parseStored, readRaw, writeRaw } from "@/lib/local-progress";
import type { GuidanceMode } from "@/lib/keyboard/typing-guidance";

export type OSChoice = "auto" | "mac" | "windows";
export type KeyboardSize = "sm" | "md" | "lg";

export type KeyboardSettings = {
  os: OSChoice;
  visible: boolean;
  size: KeyboardSize;
  /** Show the shortcut hint line. */
  hints: boolean;
  /** Highlight the next expected key. */
  showNext: boolean;
  /** Show the two-hand finger guide under the keyboard. */
  guide: boolean;
  /** Learning (full help), Practice (compact) or Challenge (hints on request). */
  mode: GuidanceMode;
};

export const KEYBOARD_SETTINGS_KEY = "dlt.keyboard";
export const DEFAULT_KEYBOARD_SETTINGS: KeyboardSettings = { os: "auto", visible: true, size: "md", hints: true, showNext: true, guide: true, mode: "learning" };

function validate(value: unknown): KeyboardSettings | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;
  const d = DEFAULT_KEYBOARD_SETTINGS;
  return {
    os: v.os === "mac" || v.os === "windows" || v.os === "auto" ? v.os : d.os,
    visible: typeof v.visible === "boolean" ? v.visible : d.visible,
    size: v.size === "sm" || v.size === "md" || v.size === "lg" ? v.size : d.size,
    hints: typeof v.hints === "boolean" ? v.hints : d.hints,
    showNext: typeof v.showNext === "boolean" ? v.showNext : d.showNext,
    guide: typeof v.guide === "boolean" ? v.guide : d.guide,
    mode: v.mode === "learning" || v.mode === "practice" || v.mode === "challenge" ? v.mode : d.mode,
  };
}

/** Persisted keyboard preferences (localStorage, shared across pages and tabs). SSR-safe. */
export function useKeyboardSettings() {
  const settings = useStoredValue(KEYBOARD_SETTINGS_KEY, DEFAULT_KEYBOARD_SETTINGS, validate);
  const update = useCallback((patch: Partial<KeyboardSettings>) => {
    const current = parseStored(readRaw(KEYBOARD_SETTINGS_KEY), DEFAULT_KEYBOARD_SETTINGS, validate);
    writeRaw(KEYBOARD_SETTINGS_KEY, JSON.stringify({ ...current, ...patch }));
  }, []);
  return [settings, update] as const;
}
