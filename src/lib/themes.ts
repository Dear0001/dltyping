import { DEFAULT_SCHEDULE } from "@/lib/theme-schedule";

export const THEME_KEY = "keyflow-theme";

export type ThemeId = "developer-blue" | "midnight-blossom" | "ethereal-flora" | "velvet-petal" | "dawn-peach" | "meadow-mint" | "golden-hour" | "twilight-indigo";

/** tone "dark" themes also set <html data-tone="dark">, which flips the surfaces/status colours in globals.css. */
export const THEMES: { id: ThemeId; name: string; swatch: [string, string]; tone: "light" | "dark" }[] = [
  { id: "developer-blue", name: "Developer Blue", swatch: ["#2563eb", "#0f172a"], tone: "light" },
  { id: "midnight-blossom", name: "Midnight Blossom", swatch: ["#C8A2C8", "#D98880"], tone: "dark" },
  { id: "ethereal-flora", name: "Ethereal Flora", swatch: ["#E06D73", "#9B7EBD"], tone: "light" },
  { id: "velvet-petal", name: "Velvet Petal", swatch: ["#B08984", "#FF6B6B"], tone: "light" },
  { id: "dawn-peach", name: "Dawn Peach", swatch: ["#F4A58A", "#7C93C4"], tone: "light" },
  { id: "meadow-mint", name: "Meadow Mint", swatch: ["#5FB894", "#E0A93B"], tone: "light" },
  { id: "golden-hour", name: "Golden Hour", swatch: ["#F2B544", "#D9534F"], tone: "light" },
  { id: "twilight-indigo", name: "Twilight Indigo", swatch: ["#8E86D6", "#E58BB0"], tone: "dark" },
];

export const DARK_THEME_IDS: ThemeId[] = THEMES.filter((t) => t.tone === "dark").map((t) => t.id);

export const isThemeId = (v: unknown): v is ThemeId => THEMES.some((t) => t.id === v);

export const AUTO_THEME = "auto";
export type ThemeMode = ThemeId | typeof AUTO_THEME;
export const isThemeMode = (v: unknown): v is ThemeMode => v === AUTO_THEME || isThemeId(v);

export const toneOf = (id: ThemeId): "light" | "dark" => (THEMES.find((t) => t.id === id)?.tone ?? "light");

/** Themes offered when the user picks Dark / Light manually, and the one chosen when switching tone without a matching theme. */
export const DEFAULT_THEME_BY_TONE: Record<"light" | "dark", ThemeId> = { light: "developer-blue", dark: "midnight-blossom" };

/**
 * Runs before first paint so the saved theme never flashes. Resolves "auto" with the same schedule (DEFAULT_SCHEDULE)
 * and the same local-time rule as periodAt(): the last period whose start is <= the minute of day, else the last period.
 */
export const THEME_INIT_SCRIPT = `try{var d=document.documentElement,t=localStorage.getItem(${JSON.stringify(THEME_KEY)});if(t&&/^[a-z-]+$/.test(t))d.setAttribute("data-theme-mode",t);if(t==="auto"){var n=new Date(),m=n.getHours()*60+n.getMinutes(),S=${JSON.stringify(DEFAULT_SCHEDULE.map((p) => [p.start, p.theme, p.id]))},p=S[S.length-1];for(var i=0;i<S.length;i++)if(m>=S[i][0])p=S[i];t=p[1];d.setAttribute("data-theme-period",p[2])}if(t&&t!=="developer-blue"&&/^[a-z-]+$/.test(t)){d.setAttribute("data-theme",t);if(${JSON.stringify(DARK_THEME_IDS)}.indexOf(t)>-1)d.setAttribute("data-tone","dark")}}catch(e){}`;

/** The <html> attribute that mirrors the stored mode (a theme id or "auto"), set before paint and by ThemeSwitcher. */
export const THEME_MODE_ATTR = "data-theme-mode";

/**
 * The theme button renders every theme's dot + name; this CSS shows the one matching html[data-theme-mode], so the
 * button is right in the server HTML (before React knows the stored theme). Built from THEMES so it can't drift.
 */
const shownLabels = [
  `html:not([${THEME_MODE_ATTR}]) .ts-cur[data-t="developer-blue"]`,
  ...[...THEMES.map((t) => t.id), AUTO_THEME].map((id) => `html[${THEME_MODE_ATTR}="${id}"] .ts-cur[data-t="${id}"]`),
].join(",");
export const THEME_LABEL_CSS = `.ts-cur{display:none}${shownLabels}{display:contents}`;

/** The <html> attribute naming the active time period while in Auto mode (absent in manual mode). */
export const THEME_PERIOD_ATTR = "data-theme-period";
