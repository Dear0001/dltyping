"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useStoredValue } from "@/hooks/use-stored-value";
import { playArcadeSound } from "@/lib/arcade/audio";
import { ARCADE_KEY, EMPTY_ARCADE, validateArcade } from "@/lib/arcade/progress";

/** Arcade progression (XP, achievements, unlocks, history) from this device. */
export const useArcadeStore = () => useStoredValue(ARCADE_KEY, EMPTY_ARCADE, validateArcade);

// ---- Game session manager ---------------------------------------------------
export type ArcadePhase = "lobby" | "countdown" | "playing" | "paused" | "finished";

/**
 * Start / pause / resume / restart / end for every arcade game, including the
 * 3-2-1-GO countdown and automatic pausing when the tab or window loses focus.
 */
export function useArcadeSession(sound: boolean) {
  const [phase, setPhase] = useState<ArcadePhase>("lobby");
  /** 3, 2, 1, then 0 = "GO!". */
  const [count, setCount] = useState(3);
  /** True when the current countdown is a resume after a pause (not a fresh start). */
  const [resuming, setResuming] = useState(false);

  useEffect(() => {
    if (phase !== "countdown") return;
    playArcadeSound(count > 0 ? "count" : "go", sound);
    const id = window.setTimeout(() => (count > 0 ? setCount(count - 1) : setPhase("playing")), count > 0 ? 750 : 450);
    return () => window.clearTimeout(id);
    // Sound preference changes must not restart the countdown step.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, count]);

  useEffect(() => {
    if (phase !== "playing") return;
    const pause = () => setPhase((p) => (p === "playing" ? "paused" : p));
    const onVisibility = () => {
      if (document.hidden) pause();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", pause);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", pause);
    };
  }, [phase]);

  const start = useCallback(() => {
    setCount(3);
    setResuming(false);
    setPhase("countdown");
  }, []);
  const pause = useCallback(() => setPhase((p) => (p === "playing" ? "paused" : p)), []);
  // Resuming goes through a short 3-2-1 so the player has their hands back on the keys before ships move again.
  // The countdown never steps the simulation, so nothing is lost or gained while it runs.
  const resume = useCallback(() => {
    if (phase !== "paused") return;
    setCount(3);
    setResuming(true);
    setPhase("countdown");
  }, [phase]);
  const finish = useCallback(() => setPhase((p) => (p === "lobby" ? p : "finished")), []);
  const toLobby = useCallback(() => setPhase("lobby"), []);

  return { phase, count, resuming, start, pause, resume, finish, toLobby };
}
export type ArcadeSession = ReturnType<typeof useArcadeSession>;

// ---- Animation loop ---------------------------------------------------------
/**
 * Calls `frame(dtMs, timeMs)` once per animation frame while `active`. Time
 * steps are capped so a slow frame or a background tab never makes the game jump.
 */
export function useGameLoop(active: boolean, frame: (dtMs: number, timeMs: number) => void) {
  const ref = useRef(frame);
  useEffect(() => {
    ref.current = frame;
  });
  useEffect(() => {
    if (!active) return;
    let id = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(Math.max(now - last, 0), 50);
      last = now;
      ref.current(dt, now);
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [active]);
}

// ---- Canvas -----------------------------------------------------------------
export type CanvasView = { ctx: CanvasRenderingContext2D; w: number; h: number; dpr: number; fontLatin: string; fontKhmer: string };

/**
 * Keeps a canvas sized to its box (sharp on high-density screens) and hands out
 * a drawing context in CSS pixels. `onResize` lets a paused game redraw itself.
 */
export function useCanvas(onResize?: (view: CanvasView) => void) {
  const viewRef = useRef<CanvasView | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const resizeRef = useRef(onResize);
  useEffect(() => {
    resizeRef.current = onResize;
  });

  // A callback ref, because the canvas only exists while a run is on screen.
  const attachCanvas = useCallback((canvas: HTMLCanvasElement | null) => {
    cleanupRef.current?.();
    cleanupRef.current = null;
    viewRef.current = null;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const fontLatin = getComputedStyle(canvas).fontFamily || "sans-serif";
    const fontKhmer = getComputedStyle(document.documentElement).getPropertyValue("--font-khmer").trim() || fontLatin;
    const measure = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(rect.width)), h = Math.max(1, Math.round(rect.height));
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      viewRef.current = { ctx, w, h, dpr, fontLatin, fontKhmer };
      resizeRef.current?.(viewRef.current);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(canvas);
    cleanupRef.current = () => observer.disconnect();
  }, []);

  useEffect(() => () => cleanupRef.current?.(), []);

  return { attachCanvas, viewRef };
}

/** Live result of a CSS media query (false on the server and on the first render). */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (notify) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", notify);
      return () => list.removeEventListener("change", notify);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** True when the OS asks for reduced motion. */
export const usePrefersReducedMotion = () => useMediaQuery("(prefers-reduced-motion: reduce)");
