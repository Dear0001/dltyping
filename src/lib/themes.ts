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

/** Automatic mode: the theme follows the local time of day. [first hour (inclusive), theme]; the last entry wraps past midnight. */
export const AUTO_SCHEDULE: [number, ThemeId][] = [
  [5, "dawn-peach"], // dawn 05:00-06:59
  [7, "ethereal-flora"], // morning 07:00-09:59
  [10, "meadow-mint"], // late morning 10:00-11:59
  [12, "developer-blue"], // midday 12:00-14:59
  [15, "golden-hour"], // afternoon 15:00-17:59
  [18, "velvet-petal"], // evening 18:00-19:59 (warm, dimmer paper)
  [20, "twilight-indigo"], // dusk 20:00-21:59 (dark, cool-dim)
  [22, "midnight-blossom"], // night 22:00-04:59 (darkest, warm, least blue light)
];

export function themeForHour(hour: number): ThemeId {
  let pick = AUTO_SCHEDULE[AUTO_SCHEDULE.length - 1][1];
  for (const [from, id] of AUTO_SCHEDULE) if (hour >= from) pick = id;
  return pick;
}

/** Runs before first paint so the saved theme never flashes. Resolves "auto" with the same schedule as themeForHour. */
export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem(${JSON.stringify(THEME_KEY)});if(t&&/^[a-z-]+$/.test(t))document.documentElement.setAttribute("data-theme-mode",t);if(t==="auto"){var h=new Date().getHours(),S=${JSON.stringify(AUTO_SCHEDULE)},p=S[S.length-1][1];for(var i=0;i<S.length;i++)if(h>=S[i][0])p=S[i][1];t=p}if(t&&t!=="developer-blue"&&/^[a-z-]+$/.test(t)){document.documentElement.setAttribute("data-theme",t);if(${JSON.stringify(DARK_THEME_IDS)}.indexOf(t)>-1)document.documentElement.setAttribute("data-tone","dark")}}catch(e){}`;

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
