"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { DEFAULT_SETTINGS, DEFAULT_USER_PROGRESS, levelsKeyFor, PRACTICE_KEY, SCORES_KEY, SEEN_KEY, SETTINGS_KEY, USER_PROGRESS_KEY, parseStored, readRaw, subscribeStorage, validateLevels, validatePractice, validateScores, validateSeen, validateSettings, validateUserProgress, writeRaw, type GameSettings, type LevelBook, type PracticeBest, type ScoreBook } from "@/lib/local-progress";
import type { UserProgressData } from "@/types";

/**
 * Reads a validated JSON value from localStorage without hydration mismatch:
 * the server (and first client render) always see `fallback`.
 */
export function useStoredValue<T>(key: string, fallback: T, validate: (value: unknown) => T | null): T {
  const raw = useSyncExternalStore(subscribeStorage, () => readRaw(key), () => null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => parseStored(raw, fallback, validate), [raw]);
}

export function useSettings() {
  const settings = useStoredValue(SETTINGS_KEY, DEFAULT_SETTINGS, validateSettings);
  const update = useCallback((patch: Partial<GameSettings>) => {
    const current = parseStored(readRaw(SETTINGS_KEY), DEFAULT_SETTINGS, validateSettings);
    writeRaw(SETTINGS_KEY, JSON.stringify({ ...current, ...patch }));
  }, []);
  return [settings, update] as const;
}

const EMPTY_SCORES: ScoreBook = {};
export const useScores = () => useStoredValue(SCORES_KEY, EMPTY_SCORES, validateScores);
const EMPTY_LEVELS: LevelBook = {};
export const useLevelBook = (gameId = "mario-khmer-quest") => useStoredValue(levelsKeyFor(gameId), EMPTY_LEVELS, validateLevels);
const EMPTY_PRACTICE: Record<string, PracticeBest> = {};
export const usePracticeBest = () => useStoredValue(PRACTICE_KEY, EMPTY_PRACTICE, validatePractice);
const EMPTY_SEEN: Record<string, boolean> = {};
export const useSeen = () => useStoredValue(SEEN_KEY, EMPTY_SEEN, validateSeen);

export const useUserProgress = (): UserProgressData =>
  useStoredValue(USER_PROGRESS_KEY, DEFAULT_USER_PROGRESS, validateUserProgress);
