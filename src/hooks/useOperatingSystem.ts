"use client";

import { useSyncExternalStore } from "react";
import type { KeyboardOS } from "@/components/keyboard/layouts/types";
import { detectKeyboardOS } from "@/lib/keyboard/keyboard-detection";
import type { OSChoice } from "@/hooks/useKeyboardSettings";

const subscribe = () => () => undefined;

/**
 * Resolves which keyboard to draw. A manual choice always wins; otherwise the
 * browser is inspected, then the optional server hint, then Windows (the most
 * common generic layout). Never blocks rendering: the first paint uses the hint.
 */
export function useOperatingSystem(choice: OSChoice, hint?: KeyboardOS | null) {
  const detected = useSyncExternalStore(subscribe, detectKeyboardOS, () => hint ?? null);
  const os: KeyboardOS = choice !== "auto" ? choice : (detected ?? hint ?? "windows");
  return { os, detected, auto: choice === "auto" };
}
