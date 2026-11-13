"use client";

import { useSyncExternalStore } from "react";
import { useStoredValue } from "@/hooks/use-stored-value";
import { EMPTY_STORE, PROGRESS_KEY, validateStore } from "@/lib/progress/progress-storage";
import { currentStreak } from "@/lib/progress/progress-analytics";

const noopSubscribe = () => () => undefined;

/** False during server render and the first client render, true afterwards. Avoids flashing an empty state at returning users. */
export function useHydrated() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

const minuteClock = () => Math.floor(Date.now() / 60_000) * 60_000;

/** Current time (rounded to the minute) on the client; 0 while server rendering, so prerendering never depends on the clock. */
export function useNow() {
  return useSyncExternalStore(noopSubscribe, minuteClock, () => 0);
}

/**
 * The learner's saved progress. Updates automatically when any tab or activity
 * writes a session, so the dashboard is always current.
 */
export function useTypingProgress() {
  const store = useStoredValue(PROGRESS_KEY, EMPTY_STORE, validateStore);
  const hydrated = useHydrated();
  return { store, hydrated, isEmpty: store.sessions.length === 0 };
}

/**
 * The learner's current streak, from saved practice sessions: the same number the dashboard shows.
 * 0 until hydrated. (The old `userProgress.streak` only counted lesson completions, by UTC day.)
 */
export function useStreak() {
  const { store, hydrated } = useTypingProgress();
  const now = useNow();
  return hydrated && now ? currentStreak(store.sessions, now) : 0;
}
