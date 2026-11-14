// Date and time labels that read correctly in Khmer everywhere. Browsers (Chrome in particular)
// ship trimmed ICU data, so Intl with "km-KH" often falls back to "Nov 14" / "8:55 PM".
// Khmer is formatted here by hand; English keeps using Intl.
import type { AppLocale } from "./types";

const KM_MONTHS = ["មករា", "កុម្ភៈ", "មីនា", "មេសា", "ឧសភា", "មិថុនា", "កក្កដា", "សីហា", "កញ្ញា", "តុលា", "វិច្ឆិកា", "ធ្នូ"];

/** "Nov 14" / "14 វិច្ឆិកា" (add the year with `withYear`). */
export function formatDay(date: Date, locale: AppLocale, withYear = false): string {
  if (locale === "km") return `${date.getDate()} ${KM_MONTHS[date.getMonth()]}${withYear ? ` ${date.getFullYear()}` : ""}`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", ...(withYear ? { year: "numeric" } : {}) });
}

/** "8:55 PM" / "ម៉ោង 20:55" (24-hour clock, as commonly written in Khmer). */
export function formatClock(date: Date, locale: AppLocale): string {
  if (locale === "km") return `ម៉ោង ${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
