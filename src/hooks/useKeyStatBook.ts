"use client";

import { useMemo } from "react";
import { useStoredValue } from "@/hooks/use-stored-value";
import { EMPTY_BOOK, KEYSTATS_KEY, KEYSTATS_REMOTE_KEY, combineBooks, validateBook } from "@/lib/keyboard/key-stats";

/** Typing history for this device plus synced history from the account's other devices. */
export function useKeyStatBook() {
  const own = useStoredValue(KEYSTATS_KEY, EMPTY_BOOK, validateBook);
  const remote = useStoredValue(KEYSTATS_REMOTE_KEY, EMPTY_BOOK, validateBook);
  return useMemo(() => combineBooks(own, remote), [own, remote]);
}
