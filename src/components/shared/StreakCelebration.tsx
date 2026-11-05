"use client";

import { useEffect, useRef, useState } from "react";
import { useNow, useTypingProgress } from "@/hooks/useTypingProgress";
import { useAccount } from "@/lib/account";
import { currentStreak } from "@/lib/progress/progress-analytics";

export const STREAK_ANIMATION_MS = 3000;
const SPARKS = ["✨", "⭐", "🔥", "✨", "💫", "🔥"].map((symbol, i) => {
  const angle = (i / 6) * Math.PI * 2;
  return { symbol, x: `${Math.round(Math.cos(angle) * 70)}px`, y: `${Math.round(Math.sin(angle) * 45 - 20)}px`, delay: `${i * 0.06}s` };
});

/**
 * Plays a 3 second flame animation whenever the streak goes up (a new day, a completed lesson, or a game level with stars).
 * The first value after page load is only a baseline, so opening or refreshing the site never animates.
 */
export default function StreakCelebration() {
  const { store, hydrated } = useTypingProgress();
  const signedIn = useAccount().status === "user";
  const now = useNow();
  const streak = hydrated && now ? currentStreak(store.sessions, now) : null;
  const last = useRef<number | null>(null);
  const [burst, setBurst] = useState<{ gained: number; total: number; key: number } | null>(null);

  useEffect(() => {
    if (streak === null || !signedIn) return;
    const before = last.current;
    last.current = streak;
    if (before !== null && streak > before) setBurst({ gained: streak - before, total: streak, key: Date.now() });
  }, [streak, signedIn]);

  useEffect(() => {
    if (!burst) return;
    const id = window.setTimeout(() => setBurst(null), STREAK_ANIMATION_MS);
    return () => window.clearTimeout(id);
  }, [burst]);

  if (!burst) return null;
  return (
    <div key={burst.key} className="streak-burst" role="status" aria-live="polite" style={{ "--streak-ms": `${STREAK_ANIMATION_MS}ms` } as React.CSSProperties}>
      <div className="streak-burst-sparks" aria-hidden="true">
        {SPARKS.map((s, i) => <span key={i} style={{ "--sx": s.x, "--sy": s.y, animationDelay: s.delay } as React.CSSProperties}>{s.symbol}</span>)}
      </div>
      <span className="streak-burst-flame" aria-hidden="true">🔥</span>
      <div>
        <p className="streak-burst-gain">Streak +{burst.gained}</p>
        <p className="streak-burst-total">{burst.total} {burst.total === 1 ? "day" : "days"} in a row</p>
      </div>
    </div>
  );
}
