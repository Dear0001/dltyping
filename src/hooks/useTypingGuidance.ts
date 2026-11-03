"use client";

import { useMemo, useState } from "react";
import { feedbackFor, guidanceFor, hintsVisible, type Feedback, type Guidance, type GuidanceMode } from "@/lib/keyboard/typing-guidance";
import type { KeyFlash } from "@/hooks/useKeyboardInput";
import type { Language } from "@/types";

type Options = {
  language: Language;
  /** Next expected character from the lesson, test or game; null when nothing is active. */
  expected: string | null;
  /** Effective Caps Lock state (physical Caps Lock combined with the on-screen one). */
  caps: boolean;
  mode: GuidanceMode;
  flash: KeyFlash | null;
  locale: "en" | "km";
};

export type TypingGuidanceState = {
  /** Resolved key/finger for the expected character (always computed). */
  guidance: Guidance | null;
  /** True when the expected character has no key in the layout. */
  unmapped: boolean;
  /** Whether key and finger hints may be drawn right now (false in Challenge mode until revealed). */
  visible: boolean;
  /** Challenge mode: reveal the hint for the current character. */
  reveal: () => void;
  feedback: Feedback | null;
};

/**
 * Single source of truth for the keyboard highlight AND the hand illustration:
 * both read the same `guidance`, so the key and the fingertip can never disagree.
 * It never stores typed text, only the character currently expected.
 */
export function useTypingGuidance({ language, expected, caps, mode, flash, locale }: Options): TypingGuidanceState {
  const guidance = useMemo(() => guidanceFor(language, expected, caps), [language, expected, caps]);
  // A reveal belongs to one expected character in one mode: moving on (or switching mode) hides it again.
  const scope = `${language}|${mode}|${expected ?? ""}`;
  const [revealedFor, setRevealedFor] = useState<string | null>(null);
  const visible = hintsVisible(mode, revealedFor === scope);
  const feedback = useMemo(() => feedbackFor(flash, guidance, mode, locale), [flash, guidance, mode, locale]);
  return { guidance, unmapped: Boolean(expected) && guidance === null, visible, reveal: () => setRevealedFor(scope), feedback };
}
