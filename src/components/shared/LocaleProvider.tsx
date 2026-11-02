"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { translate, type AppLocale } from "@/lib/i18n";

type LocaleContextValue = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  t: (key: string) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);
const STORAGE_KEY = "keyflow-locale";
const listeners = new Set<() => void>();
let memoryLocale: AppLocale = "en";

function getLocaleSnapshot(): AppLocale {
  if (typeof window === "undefined") return "en";
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "km") return saved;
  } catch {
    // Fall through to the in-memory choice when localStorage is unavailable.
  }
  return memoryLocale;
}

function getServerLocaleSnapshot(): AppLocale {
  return "en";
}

function subscribeToLocale(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function saveLocale(nextLocale: AppLocale) {
  memoryLocale = nextLocale;
  try {
    window.localStorage.setItem(STORAGE_KEY, nextLocale);
  } catch {
    // The current UI still updates when browser storage is disabled.
  }
  listeners.forEach((listener) => listener());
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(subscribeToLocale, getLocaleSnapshot, getServerLocaleSnapshot);

  useEffect(() => {
    document.documentElement.lang = locale === "km" ? "km" : "en";
    document.title = locale === "km" ? "Keyflow — ហាត់វាយអក្សរខ្មែរ និងអង់គ្លេស" : "Keyflow — Find your typing rhythm";
  }, [locale]);

  const setLocale = useCallback((nextLocale: AppLocale) => saveLocale(nextLocale), []);

  const value = useMemo<LocaleContextValue>(() => ({ locale, setLocale, t: (key) => translate(locale, key) }), [locale, setLocale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used within LocaleProvider");
  return context;
}
