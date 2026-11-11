"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { translate, type AppLocale, type Vars } from "@/lib/i18n";

type LocaleContextValue = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  t: (key: string, vars?: Vars) => string;
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
    document.title = locale === "km" ? "DL Typing — ហាត់វាយអក្សរខ្មែរ និងអង់គ្លេស" : "DL Typing — Find your typing rhythm";
  }, [locale]);

  const setLocale = useCallback((nextLocale: AppLocale) => saveLocale(nextLocale), []);

  const value = useMemo<LocaleContextValue>(() => ({ locale, setLocale, t: (key, vars) => translate(locale, key, vars) }), [locale, setLocale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

const subscribeNever = () => () => {};

/**
 * The saved language only exists in the browser, so the server always renders English. A component that
 * hydrates after the provider has already switched to Khmer (Suspense boundaries hydrate on their own
 * schedule) would then disagree with its server HTML. So every component reads English for its own
 * hydration pass (useSyncExternalStore's server snapshot) and re-renders in the real language right after.
 */
export function useLocale() {
  const context = useContext(LocaleContext);
  const hydrated = useSyncExternalStore(subscribeNever, () => true, () => false);
  const setLocale = context?.setLocale;
  const english = useMemo<LocaleContextValue | null>(() => (setLocale ? { locale: "en", setLocale, t: (key, vars) => translate("en", key, vars) } : null), [setLocale]);
  if (!context || !english) throw new Error("useLocale must be used within LocaleProvider");
  return hydrated ? context : english;
}
