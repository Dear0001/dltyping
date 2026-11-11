export const THEME_KEY = "keyflow-theme";

export type ThemeId = "developer-blue" | "midnight-blossom" | "ethereal-flora" | "velvet-petal";

export const THEMES: { id: ThemeId; name: string; swatch: [string, string] }[] = [
  { id: "developer-blue", name: "Developer Blue", swatch: ["#2563eb", "#0f172a"] },
  { id: "midnight-blossom", name: "Midnight Blossom", swatch: ["#C8A2C8", "#D98880"] },
  { id: "ethereal-flora", name: "Ethereal Flora", swatch: ["#E06D73", "#9B7EBD"] },
  { id: "velvet-petal", name: "Velvet Petal", swatch: ["#B08984", "#FF6B6B"] },
];

export const isThemeId = (v: unknown): v is ThemeId => THEMES.some((t) => t.id === v);

export const AUTO_THEME = "auto";
export type ThemeMode = ThemeId | typeof AUTO_THEME;
export const isThemeMode = (v: unknown): v is ThemeMode => v === AUTO_THEME || isThemeId(v);

/** Automatic mode: the theme follows the local time of day. [first hour (inclusive), theme]; the last entry wraps past midnight. */
export const AUTO_SCHEDULE: [number, ThemeId][] = [
  [6, "ethereal-flora"], // morning 06:00-11:59
  [12, "developer-blue"], // afternoon 12:00-17:59
  [18, "velvet-petal"], // evening 18:00-21:59
  [22, "midnight-blossom"], // night 22:00-05:59
];

export function themeForHour(hour: number): ThemeId {
  let pick = AUTO_SCHEDULE[AUTO_SCHEDULE.length - 1][1];
  for (const [from, id] of AUTO_SCHEDULE) if (hour >= from) pick = id;
  return pick;
}

/** Runs before first paint so the saved theme never flashes. Resolves "auto" with the same schedule as themeForHour. */
export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem(${JSON.stringify(THEME_KEY)});if(t==="auto"){var h=new Date().getHours(),S=${JSON.stringify(AUTO_SCHEDULE)},p=S[S.length-1][1];for(var i=0;i<S.length;i++)if(h>=S[i][0])p=S[i][1];t=p}if(t&&t!=="developer-blue"&&/^[a-z-]+$/.test(t))document.documentElement.setAttribute("data-theme",t)}catch(e){}`;
