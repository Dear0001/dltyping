/** Inline logo so its colors follow the active theme (see public/images/logo.svg for the static copy). */
export default function Logo({ height = 38 }: { height?: number }) {
  return (
    <svg viewBox="30 25 690 150" height={height} role="img" aria-label="DL Typing" style={{ display: "block", width: "auto" }}>
      <defs>
        <linearGradient id="logo-l" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-accent, #38bdf8)" />
          <stop offset="100%" stopColor="var(--green, #2563eb)" />
        </linearGradient>
      </defs>
      <path d="M 40 40 H 85 A 50 50 0 0 1 85 140 H 40 Z M 75 70 H 85 A 20 20 0 0 1 85 110 H 75 Z" fill="var(--ink, #0f172a)" fillRule="evenodd" />
      <path d="M 145 40 H 180 V 110 H 240 V 140 H 145 Z" fill="url(#logo-l)" />
      <path d="M 215 30 Q 215 60 245 60 Q 215 60 215 90 Q 215 60 185 60 Q 215 60 215 30 Z" fill="var(--color-accent, #38bdf8)" />
      <text x="260" y="140" fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" fontSize="135" fontWeight="900" fill="var(--ink, #0f172a)" letterSpacing="-3">Typing</text>
    </svg>
  );
}
