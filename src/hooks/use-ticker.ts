"use client";

import { useEffect, useRef } from "react";

/**
 * Calls onTick(deltaMs) about every 100ms while `running`. Delta is measured
 * with performance.now(), so timers stay accurate even if the tab throttles
 * intervals, and pausing simply stops accumulating time.
 */
export function useTicker(running: boolean, onTick: (deltaMs: number) => void) {
  const ref = useRef(onTick);
  useEffect(() => {
    ref.current = onTick;
  });
  useEffect(() => {
    if (!running) return;
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const delta = Math.min(now - last, 1000);
      last = now;
      ref.current(delta);
    }, 100);
    return () => window.clearInterval(id);
  }, [running]);
}

/** Calls onHide when the tab is hidden, used to auto-pause. */
export function useAutoPause(active: boolean, onHide: () => void) {
  const ref = useRef(onHide);
  useEffect(() => {
    ref.current = onHide;
  });
  useEffect(() => {
    if (!active) return;
    const handler = () => {
      if (document.hidden) ref.current();
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [active]);
}
