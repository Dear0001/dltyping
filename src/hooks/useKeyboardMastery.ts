"use client";

import { useMemo } from "react";
import { useTypingProgress } from "@/hooks/useTypingProgress";
import { analyzeKeyboard, masterySummary, weakKeysOf } from "@/lib/progress/keyboard-analytics";
import type { Language } from "@/types";

/** Per-key performance for one language layout, plus the weak keys and a mastery summary. */
export function useKeyboardMastery(language: Language) {
  const { store, hydrated } = useTypingProgress();
  return useMemo(() => {
    const analysis = analyzeKeyboard(store, language);
    return { hydrated, analysis, weak: weakKeysOf(analysis), summary: masterySummary(analysis) };
  }, [store, language, hydrated]);
}
