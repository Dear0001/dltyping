"use client";

import { useEffect, useRef } from "react";
import { charForCode } from "@/lib/keyboard-layouts";
import { isKhmerChar } from "@/lib/khmer-unicode";
import type { Language } from "@/types";

type Handlers = { onChar: (char: string) => void; onBackspace?: () => void; onEscape?: () => void };

/**
 * Turns a keydown into the character it should type, or null.
 * - English: event.key (respects Shift / Caps Lock).
 * - Khmer: a real Khmer character from the OS keyboard is used as-is; otherwise
 *   (Latin layout, or an IME reporting "Process") the physical key is mapped
 *   through the NiDA layout so the games are playable without a Khmer IME.
 */
export function resolveKey(event: Pick<KeyboardEvent, "key" | "code" | "shiftKey">, language: Language): string | null {
  const { key, code, shiftKey } = event;
  if (key === " " || code === "Space") return " ";
  if (language === "khmer") {
    if (key.length > 0 && Array.from(key).length === 1 && isKhmerChar(key)) return key;
    return charForCode("khmer", code, shiftKey);
  }
  return Array.from(key).length === 1 ? key : null;
}

function isEditable(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

/** Global physical-keyboard capture for games. Composition events never reach us because we read keydown directly. */
export function useKeyInput(enabled: boolean, language: Language, handlers: Handlers) {
  const ref = useRef(handlers);
  useEffect(() => {
    ref.current = handlers;
  });

  useEffect(() => {
    if (!enabled) return;
    function onKeyDown(event: KeyboardEvent) {
      if (isEditable(event.target) || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === "Escape") {
        ref.current.onEscape?.();
        return;
      }
      if (event.key === "Backspace") {
        event.preventDefault();
        ref.current.onBackspace?.();
        return;
      }
      if (event.key === "Shift" || event.key === "CapsLock" || event.key === "Tab" || event.key === "Enter") return;
      const char = resolveKey(event, language);
      if (!char) return;
      event.preventDefault();
      if (event.repeat) return;
      // Keep focus off buttons so Space never "clicks" Pause/Restart.
      if (document.activeElement instanceof HTMLButtonElement) document.activeElement.blur();
      for (const part of Array.from(char)) ref.current.onChar(part);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, language]);
}
