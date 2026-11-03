export const THEME_KEY = "keyflow-theme";

export type ThemeId = "developer-blue" | "midnight-blossom" | "ethereal-flora" | "velvet-petal";

export const THEMES: { id: ThemeId; name: string; swatch: [string, string] }[] = [
  { id: "developer-blue", name: "Developer Blue", swatch: ["#2563eb", "#0f172a"] },
  { id: "midnight-blossom", name: "Midnight Blossom", swatch: ["#C8A2C8", "#D98880"] },
  { id: "ethereal-flora", name: "Ethereal Flora", swatch: ["#E06D73", "#9B7EBD"] },
  { id: "velvet-petal", name: "Velvet Petal", swatch: ["#B08984", "#FF6B6B"] },
];

export const isThemeId = (v: unknown): v is ThemeId => THEMES.some((t) => t.id === v);

/** Runs before first paint so the saved theme never flashes. */
export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem(${JSON.stringify(THEME_KEY)});if(t&&t!=="developer-blue"&&/^[a-z-]+$/.test(t))document.documentElement.setAttribute("data-theme",t)}catch(e){}`;
