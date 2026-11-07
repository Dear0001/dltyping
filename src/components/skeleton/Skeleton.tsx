import type { CSSProperties } from "react";

/** Reusable skeleton building blocks. Server-safe; shimmer is defined by `.sk` in globals.css. */
export function Sk({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return <span className={`sk ${className}`} style={style} aria-hidden="true" />;
}

const card = "rounded-xl border border-[color:var(--line)] bg-white/50 p-5";

export function SkCard({ lines = 2, media = "h-24", className = "" }: { lines?: number; media?: string | null; className?: string }) {
  return <div className={`${card} ${className}`}>
    {media && <Sk className={`mb-4 w-full ${media}`} />}
    <Sk className="mb-3 h-5 w-3/4" />
    {Array.from({ length: lines }, (_, i) => <Sk key={i} className={`mb-2 h-3 ${i === lines - 1 ? "w-1/2" : "w-full"}`} />)}
  </div>;
}

export function SkHeading({ actions = false }: { actions?: boolean }) {
  return <div className="mb-6 flex items-end justify-between gap-4">
    <div className="min-w-0 flex-1">
      <Sk className="mb-3 h-3 w-24" />
      <Sk className="mb-3 h-9 w-2/3 max-w-md" />
      <Sk className="h-4 w-full max-w-xl" />
    </div>
    {actions && <Sk className="hidden h-10 w-32 sm:block" />}
  </div>;
}

export function SkTabs({ count = 3 }: { count?: number }) {
  return <div className="mb-5 flex gap-2">{Array.from({ length: count }, (_, i) => <Sk key={i} className="h-9 w-28 rounded-full" />)}</div>;
}

export function SkStatRow({ count = 4 }: { count?: number }) {
  return <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
    {Array.from({ length: count }, (_, i) => <div key={i} className={card}><Sk className="mb-3 h-3 w-1/2" /><Sk className="h-8 w-2/3" /></div>)}
  </div>;
}

export function SkChart({ className = "h-64" }: { className?: string }) {
  return <div className={card}><Sk className="mb-4 h-5 w-40" /><Sk className={`w-full ${className}`} /></div>;
}

export function SkTable({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  return <div className={`${card} !p-0 overflow-hidden`}>
    <div className="flex gap-4 border-b border-[color:var(--line)] p-4">{Array.from({ length: cols }, (_, i) => <Sk key={i} className="h-3 flex-1" />)}</div>
    {Array.from({ length: rows }, (_, r) => <div key={r} className="flex gap-4 border-b border-[color:var(--line)] p-4 last:border-0">{Array.from({ length: cols }, (_, c) => <Sk key={c} className="h-4 flex-1" />)}</div>)}
  </div>;
}

export function SkForm({ fields = 4 }: { fields?: number }) {
  return <div className={card}>
    {Array.from({ length: fields }, (_, i) => <div key={i} className="mb-5"><Sk className="mb-2 h-3 w-28" /><Sk className="h-11 w-full" /></div>)}
    <Sk className="h-11 w-40" />
  </div>;
}

export function SkKeyboard() {
  return <div className={card}>{[13, 12, 11, 10].map((n) => <div key={n} className="mb-2 flex justify-center gap-1.5">{Array.from({ length: n }, (_, i) => <Sk key={i} className="h-8 w-8 sm:h-9 sm:w-9" />)}</div>)}<div className="flex justify-center"><Sk className="h-8 w-64" /></div></div>;
}

export function SkGrid({ count = 6, cols = "sm:grid-cols-2 lg:grid-cols-3", ...card }: { count?: number; cols?: string; lines?: number; media?: string | null }) {
  return <div className={`grid gap-4 ${cols}`}>{Array.from({ length: count }, (_, i) => <SkCard key={i} {...card} />)}</div>;
}

/** Page wrapper: busy region with the same width/padding the real pages use, so nothing shifts when content arrives. */
export function SkPage({ children, width = "max-w-6xl" }: { children: React.ReactNode; width?: string }) {
  return <main className={`mx-auto ${width} px-4 pb-16 pt-8 sm:px-6`} aria-busy="true" aria-label="Loading">{children}</main>;
}

/** Navbar placeholder: same `.topbar` box as SiteHeader, shown while the header's route data resolves. */
export function SiteHeaderSkeleton() {
  return <header className="topbar" aria-hidden="true">
    <Sk className="h-7 w-28" />
    <nav className="topnav">{Array.from({ length: 6 }, (_, i) => <Sk key={i} className="h-3 w-14" />)}</nav>
    <Sk className="h-5 w-16" /><Sk className="h-7 w-14" /><Sk className="h-8 w-8 rounded-full" />
  </header>;
}
