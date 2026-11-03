"use client";

import { useCallback, useEffect, useRef } from "react";
import { commitTally, createTally, recordSession, tallyKeystroke, tallyWord, tallyWordsFromText } from "@/lib/progress/progress-storage";
import type { Language } from "@/types";
import type { SessionInput, SessionRecord } from "@/types/progress";

/**
 * Shared by every typing activity (practice, tests, all games). It collects
 * per-key results while the activity runs and writes one session when it
 * finishes. Leaving early still saves the key statistics, but no session.
 */
export function useActivityRecorder() {
  const tally = useRef(createTally());

  const flush = useCallback(() => {
    commitTally(tally.current);
    tally.current = createTally();
  }, []);

  /** Call for every keystroke judged against an expected character. */
  const keystroke = useCallback((language: Language, expected: string, ok: boolean, sequence = true) => {
    tallyKeystroke(tally.current, language, expected, ok, sequence);
  }, []);

  const word = useCallback((language: Language, text: string, hadError: boolean) => tallyWord(tally.current, language, text, hadError), []);
  const wordsFromText = useCallback((language: Language, target: string, typed: string) => tallyWordsFromText(tally.current, language, target, typed), []);

  /** Saves the session together with the keys collected so far, then starts a fresh tally. */
  const finish = useCallback((input: SessionInput): SessionRecord | null => {
    const saved = recordSession(input, tally.current);
    tally.current = createTally();
    return saved;
  }, []);

  // Keep key statistics from a run the learner walked away from.
  useEffect(() => () => {
    commitTally(tally.current);
    tally.current = createTally();
  }, []);

  return { keystroke, word, wordsFromText, finish, flush };
}
