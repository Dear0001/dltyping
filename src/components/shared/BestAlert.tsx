"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLocale } from "@/components/shared/LocaleProvider";
import { useHydrated } from "@/hooks/useTypingProgress";

export const BEST_ANIMATION_MS = 4000;
const CONFETTI = ["🎉", "⭐", "✨", "🎊", "🌟", "💫", "🎈", "✨"].map((symbol, i) => {
  const angle = (i / 8) * Math.PI * 2;
  return { symbol, x: `${Math.round(Math.cos(angle) * 150)}px`, y: `${Math.round(Math.sin(angle) * 100 - 20)}px`, delay: `${i * 0.05}s` };
});

/**
 * Full-screen "new personal best" award. Rendered into <body> above every dialog and the navbar, never blocks clicks,
 * and removes itself after a few seconds.
 */
export default function BestAlert({ score }: { score: number }) {
  const { t } = useLocale();
  const mounted = useHydrated();
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const id = window.setTimeout(() => setVisible(false), BEST_ANIMATION_MS);
    return () => window.clearTimeout(id);
  }, []);
  if (!mounted || !visible) return null;
  return createPortal(
    <div className="best-burst" role="alert" aria-live="assertive" style={{ "--best-ms": `${BEST_ANIMATION_MS}ms` } as React.CSSProperties}>
      <div className="best-burst-card">
        <div className="best-burst-sparks" aria-hidden="true">
          {CONFETTI.map((c, i) => <span key={i} style={{ "--sx": c.x, "--sy": c.y, animationDelay: c.delay } as React.CSSProperties}>{c.symbol}</span>)}
        </div>
        <span className="best-burst-trophy" aria-hidden="true">🏆</span>
        <p className="best-burst-label">{t("gm.newBestTitle")}</p>
        <p className="best-burst-score">{score.toLocaleString("en-US")}</p>
      </div>
    </div>,
    document.body,
  );
}
