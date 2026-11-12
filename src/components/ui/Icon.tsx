/**
 * Small stroke icon set for navigation and UI chrome (24px grid, currentColor, 1.8 stroke).
 * Decorative by default; pass `label` to expose one to assistive tech.
 */
const PATHS = {
  home: "M3 10.5 12 3l9 7.5M5 9v11h5v-6h4v6h5V9",
  learn: "M2 7.5 12 3l10 4.5-10 4.5L2 7.5Zm4 2.3V15c0 1.7 2.7 3 6 3s6-1.3 6-3V9.8M22 7.5V13",
  practice: "M3 6h18v12H3zM7 10h.01M11 10h.01M15 10h.01M7 14h10",
  games: "M7 8h10a5 5 0 0 1 0 10c-1.6 0-2.4-1-3.2-2h-3.6C9.4 17 8.6 18 7 18A5 5 0 0 1 7 8Zm1 3v4m-2-2h4m5-1h.01M17 14h.01",
  progress: "M4 20V10m6 10V4m6 16v-7m4 7H2",
  library: "M4 4h4v16H4zM10 4h4v16h-4zM16.5 4.5l3.5-1 3 15.5-3.5 1z",
  test: "M12 8v5l3 2M12 22a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM9 2h6",
  daily: "M4 6h16v15H4zM4 10h16M9 3v4m6-4v4m-6 8 2 2 4-4",
  dashboard: "M3 3h8v10H3zM13 3h8v6h-8zM13 11h8v10h-8zM3 15h8v6H3z",
  keyboard: "M2 6h20v12H2zM6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10",
  target: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-5a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-4a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
  paw: "M12 13c-3 0-5 3-5 5 0 1.7 1.4 3 3 3 .8 0 1.4-.4 2-.4s1.2.4 2 .4c1.6 0 3-1.3 3-3 0-2-2-5-5-5ZM6 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm12 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM9.5 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm5 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
  help: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm-2.5-13a2.6 2.6 0 0 1 5 1c0 2-2.5 2.2-2.5 4M12 17h.01",
  arrow: "M5 12h14m-6-6 6 6-6 6",
  chevron: "m6 9 6 6 6-6",
  check: "m5 12 5 5 9-10",
  lock: "M6 11h12v10H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3",
  play: "M7 4.5v15l12-7.5z",
  flame: "M12 22c4 0 7-2.8 7-7 0-3.3-2-5.6-3.5-7.5-.4 1.6-1.4 2.6-2.5 3C13 7.8 11.6 4.6 9 2c.3 3.2-1.4 5.3-3 7.3C4.9 10.8 5 12.5 5 15c0 4.2 3 7 7 7Z",
  star: "m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z",
  trophy: "M8 21h8m-4-4v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4m10-4h3a3 3 0 0 1-3 4",
  bolt: "M13 2 4 14h7l-1 8 9-12h-7z",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-15v5l3 3",
  focus: "M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5",
  sound: "M4 9v6h4l5 4V5L8 9zm12.5-.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12",
  mute: "M4 9v6h4l5 4V5L8 9zm12 0 5 6m0-6-5 6",
  restart: "M3 12a9 9 0 1 0 3-6.7L3 8m0-5v5h5",
  pause: "M7 5h3v14H7zm7 0h3v14h-3z",
  globe: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM2 12h20M12 2c2.8 3 4 6.4 4 10s-1.2 7-4 10c-2.8-3-4-6.4-4-10s1.2-7 4-10Z",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.35-4.35",
  sparkle: "M12 3v4m0 10v4M3 12h4m10 0h4M6 6l2.5 2.5m7 7L18 18M6 18l2.5-2.5m7-7L18 6",
} as const;

export type IconName = keyof typeof PATHS;

export default function Icon({ name, size = 18, className = "", label, strokeWidth = 1.8 }: { name: IconName; size?: number; className?: string; label?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      className={`flex-none ${className}`} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <path d={PATHS[name]} />
    </svg>
  );
}
