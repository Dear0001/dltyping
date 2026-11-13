"use client";

import { useEffect, useRef, useState } from "react";
import { useNow, useTypingProgress } from "@/hooks/useTypingProgress";
import { useAccount } from "@/lib/account";
import { useLocale } from "@/components/shared/LocaleProvider";
import { currentStreak, dayKey, dayPoints } from "@/lib/progress/progress-analytics";

export const STREAK_ANIMATION_MS = 4000;
const SPARKS = ["✨", "⭐", "🔥", "✨", "💫", "🔥", "⭐", "✨"].map((symbol, i) => {
  const angle = (i / 8) * Math.PI * 2;
  return { symbol, x: `${Math.round(Math.cos(angle) * 150)}px`, y: `${Math.round(Math.sin(angle) * 110 - 30)}px`, delay: `${i * 0.06}s` };
});

/**
 * Plays a 4 second full-screen flame animation whenever the streak goes up (a new day, a completed lesson, or a game level with stars).
 * It also plays once per day on the first page load after that day already has qualifying practice (never for just opening the site).
 * Refreshing the page the same day never repeats it. Signed-out visitors see the animation too, with a prompt to sign in to keep the points.
 */
const SHOWN_KEY = "dlt.streak-shown";
export default function StreakCelebration() {
  const { t } = useLocale();
  const { store, hydrated } = useTypingProgress();
  const signedIn = useAccount().status === "user";
  const now = useNow();
  const streak = hydrated && now ? currentStreak(store.sessions, now) : null;
  const last = useRef<number | null>(null);
  const [burst, setBurst] = useState<{ gained: number; total: number; key: number; daily?: boolean } | null>(null);

  useEffect(() => {
    if (streak === null) return;
    const before = last.current;
    last.current = streak;
    if (before !== null) {
      if (streak > before) setBurst({ gained: streak - before, total: streak, key: Date.now() });
      return;
    }
    // First reading after page load: announce today's points once per day, but only once today has real practice.
    try {
      const today = dayKey(Date.now());
      const todayPoints = dayPoints(store.sessions).get(today);
      if (window.localStorage.getItem(SHOWN_KEY) === today || streak <= 0 || !todayPoints) return;
      window.localStorage.setItem(SHOWN_KEY, today);
      setBurst({ gained: todayPoints, total: streak, key: Date.now(), daily: true });
    } catch {
      // Storage unavailable: skip the daily announcement.
    }
  }, [streak, store.sessions]);

  useEffect(() => {
    if (!burst) return;
    const id = window.setTimeout(() => setBurst(null), STREAK_ANIMATION_MS);
    return () => window.clearTimeout(id);
  }, [burst]);

  if (!burst) return null;
  return (
    <div key={burst.key} className="streak-burst" role="alert" aria-live="assertive" style={{ "--streak-ms": `${STREAK_ANIMATION_MS}ms` } as React.CSSProperties}>
      <div className="streak-burst-card">
        <div className="streak-burst-sparks" aria-hidden="true">
          {SPARKS.map((s, i) => <span key={i} style={{ "--sx": s.x, "--sy": s.y, animationDelay: s.delay } as React.CSSProperties}>{s.symbol}</span>)}
        </div>
        <span className="streak-burst-flame" aria-hidden="true">🔥</span>
        <p className="streak-burst-label">{t(burst.daily ? "streakfx.daily" : "streakfx.earned")}</p>
        <p className="streak-burst-gain">+{burst.gained}</p>
        <p className="streak-burst-total">{t(burst.total === 1 ? "streakfx.totalOne" : "streakfx.total", { n: burst.total })}{!signedIn && ` · ${t("streakfx.signIn")}`}</p>
      </div>
    </div>
  );
}
