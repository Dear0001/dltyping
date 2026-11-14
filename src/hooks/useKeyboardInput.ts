"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isCorrectPress } from "@/lib/keyboard/keyboard-mapping";
import type { Language } from "@/types";

export type KeyFlash = { code: string; ok: boolean; seq: number };
type Mods = { shift: boolean; caps: boolean; ctrl: boolean; alt: boolean; meta: boolean };
const NO_MODS: Mods = { shift: false, caps: false, ctrl: false, alt: false, meta: false };
const MODIFIER_CODES = /^(Shift|Control|Alt|Meta|CapsLock)/;
const FLASH_MS = 320;
/** A wrong key stays marked longer so the learner can read the feedback. */
const WRONG_FLASH_MS = 900;

type Options = {
  language: Language;
  /** Next expected character; when set, presses of character keys are judged. */
  expected?: string | null;
  /** Pause judging (not tracking), e.g. when a game is not running. */
  judge?: boolean;
};

/**
 * Mirrors the physical keyboard: which keys are held, modifier state and a
 * short correct/incorrect flash. Passive listeners only: it never calls
 * preventDefault, so typing, IME composition and shortcuts are untouched.
 * Keys are identified by event.code, which stays valid during IME composition
 * (key === "Process"). State is cleared on blur / tab hide so keys cannot stick.
 */
export function useKeyboardInput({ language, expected, judge = true }: Options) {
  const [pressed, setPressed] = useState<ReadonlySet<string>>(new Set());
  const [mods, setMods] = useState<Mods>(NO_MODS);
  const [flash, setFlash] = useState<KeyFlash | null>(null);
  const opts = useRef({ language, expected, judge });
  const seq = useRef(0);
  const flashTimer = useRef<number | null>(null);
  const metaTimers = useRef(new Map<string, number>());

  /** Marks a key correct/incorrect for a moment. Used for physical presses and for taps on the on-screen keys. */
  const showFlash = useCallback((code: string, ok: boolean) => {
    seq.current += 1;
    setFlash({ code, ok, seq: seq.current });
    if (flashTimer.current) window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash(null), ok ? FLASH_MS : WRONG_FLASH_MS);
  }, []);

  useEffect(() => {
    opts.current = { language, expected, judge };
  });

  useEffect(() => {
    const syncMods = (e: KeyboardEvent) => {
      const next = { shift: e.shiftKey, ctrl: e.ctrlKey, alt: e.altKey, meta: e.metaKey, caps: e.getModifierState?.("CapsLock") ?? false };
      setMods((prev) => (prev.shift === next.shift && prev.ctrl === next.ctrl && prev.alt === next.alt && prev.meta === next.meta && prev.caps === next.caps ? prev : next));
    };
    const drop = (code: string) => setPressed((prev) => {
      if (!prev.has(code)) return prev;
      const next = new Set(prev);
      next.delete(code);
      return next;
    });
    const clearAll = () => {
      setPressed((prev) => (prev.size ? new Set() : prev));
      setMods((prev) => ({ ...NO_MODS, caps: prev.caps }));
      metaTimers.current.forEach((id) => window.clearTimeout(id));
      metaTimers.current.clear();
    };

    function onKeyDown(e: KeyboardEvent) {
      syncMods(e);
      const code = e.code;
      if (!code) return;
      setPressed((prev) => (prev.has(code) ? prev : new Set(prev).add(code)));
      // macOS never sends keyup for keys pressed while Command is held: release them ourselves.
      if (e.metaKey && !MODIFIER_CODES.test(code)) {
        window.clearTimeout(metaTimers.current.get(code));
        metaTimers.current.set(code, window.setTimeout(() => drop(code), 180));
      }
      const { language: lang, expected: want, judge: on } = opts.current;
      // AltGr (Ctrl+Alt on Windows, Option on Mac) types Khmer third-level characters, so it is judged for Khmer.
      const altGr = lang === "khmer" && e.altKey && !e.metaKey;
      if (!on || !want || e.repeat || e.metaKey || (e.ctrlKey && !altGr) || (e.altKey && !altGr) || MODIFIER_CODES.test(code)) return;
      const judged = code === "Space" || /^(Key[A-Z]|Digit\d|Backquote|Minus|Equal|Bracket(Left|Right)|Backslash|Semicolon|Quote|Comma|Period|Slash)$/.test(code);
      if (!judged) return;
      const ok = code === "Space" ? want === " " : isCorrectPress(lang, code, e.shiftKey, e.getModifierState?.("CapsLock") ?? false, want, altGr);
      showFlash(code, ok);
    }

    function onKeyUp(e: KeyboardEvent) {
      syncMods(e);
      // Autofill and some IME events arrive without a code.
      if (!e.code) return;
      drop(e.code);
      // Releasing Command releases everything that was held with it.
      if (e.code.startsWith("Meta")) clearAll();
    }
    const onVisibility = () => { if (document.hidden) clearAll(); };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", clearAll);
    document.addEventListener("visibilitychange", onVisibility);
    const timers = metaTimers.current;
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", clearAll);
      document.removeEventListener("visibilitychange", onVisibility);
      timers.forEach((id) => window.clearTimeout(id));
      if (flashTimer.current) window.clearTimeout(flashTimer.current);
    };
  }, [showFlash]);

  return { pressed, mods, flash, showFlash };
}
