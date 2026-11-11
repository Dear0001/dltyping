export type AppLocale = "en" | "km";
/** One entry per key, both languages together so a missing translation is a type error. */
export type Dict = Record<string, { en: string; km: string }>;
export type Vars = Record<string, string | number>;
