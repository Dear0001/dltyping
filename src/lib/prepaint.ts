/**
 * Tiny inline scripts that run before the first paint, so the navbar is correct in the server HTML itself
 * (no flash of English, of the default theme name, or of guest-only links for a signed-in visitor).
 * Plain module (no "use client"): the layout, a server component, inlines these strings.
 */
import { THEME_INIT_SCRIPT } from "@/lib/themes";

export const LOCALE_KEY = "keyflow-locale";
/** Last known sign-in state ("user" | "anon"). Only a hint for first paint; /api/auth/me stays the source of truth. */
export const ACCOUNT_HINT_KEY = "dlt-acct";

/** Sets <html lang>, data-locale and data-acct from localStorage. CSS uses them until React has hydrated. */
const LOCALE_ACCOUNT_SCRIPT = `try{var d=document.documentElement,l=localStorage.getItem(${JSON.stringify(LOCALE_KEY)});if(l==="km"){d.lang="km";d.setAttribute("data-locale","km")}var a=localStorage.getItem(${JSON.stringify(ACCOUNT_HINT_KEY)});if(a==="user"||a==="anon")d.setAttribute("data-acct",a)}catch(e){}`;

export const PREPAINT_SCRIPT = THEME_INIT_SCRIPT + LOCALE_ACCOUNT_SCRIPT;

/**
 * Runs right after the header HTML is parsed: marks the active nav link before paint. The real active state is
 * rendered by React once the pathname is known (it's URL data, so it streams after the static shell); this only
 * makes the shell's first paint match it. Same rule as isNavActive() in SiteHeader.
 */
export const NAV_ACTIVE_SCRIPT = `try{var p=location.pathname;document.querySelectorAll(".topbar [data-nav]").forEach(function(a){var h=a.getAttribute("href"),on=h==="/"?p==="/":p.indexOf(h)===0;a.classList.toggle("active",on);if(on&&!a.classList.contains("gm-trigger"))a.setAttribute("aria-current","page")})}catch(e){}`;
