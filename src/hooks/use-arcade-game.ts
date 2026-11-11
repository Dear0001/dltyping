"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createFx, stepFx, type Fx } from "@/components/games/arcade/canvas-utils";
import { useArcadeSession, useArcadeStore, useCanvas, useGameLoop, usePrefersReducedMotion, type CanvasView } from "@/hooks/use-arcade";
import { useScores, useSettings } from "@/hooks/use-stored-value";
import { useActivityRecorder } from "@/hooks/useActivityRecorder";
import type { ArcadeGameId } from "@/lib/arcade/progress";
import type { RunReport } from "@/lib/arcade/save";
import { markSeen } from "@/lib/local-progress";

type Recorder = ReturnType<typeof useActivityRecorder>;

export type ArcadeGameConfig<S, H> = {
  game: ArcadeGameId;
  /** HUD values shown before a run exists. */
  initialHud: H;
  /** Reads the values the HUD and typing panel need from the simulation. */
  snapshot: (sim: S) => H;
  /** Advances the simulation. */
  step: (sim: S, dtMs: number) => void;
  /** Turns the simulation's pending events into sounds and visual effects, then clears them. */
  drain: (sim: S, fx: Fx, view: CanvasView | null) => void;
  draw: (view: CanvasView, sim: S, fx: Fx, timeMs: number) => void;
  isOver: (sim: S) => boolean;
  /** Saves the run and returns its report (null when there is nothing worth saving). */
  save: (sim: S, recorder: Recorder) => RunReport | null;
  /** Lets the simulation follow the canvas shape. */
  resize?: (sim: S, view: CanvasView) => void;
};

/**
 * The loop every arcade game runs: session state, a simulation kept outside
 * React (so typing never waits for a render), a canvas redraw per animation
 * frame, and a HUD snapshot pushed to React about ten times a second.
 */
export function useArcadeGame<S, H>(config: ArcadeGameConfig<S, H>) {
  const [settings] = useSettings();
  const store = useArcadeStore();
  const scores = useScores();
  const recorder = useActivityRecorder();
  const session = useArcadeSession(settings.sound);
  const reduced = usePrefersReducedMotion() || !settings.animations;
  const [hud, setHud] = useState<H>(config.initialHud);
  const [report, setReport] = useState<RunReport | null>(null);
  // An error inside the animation loop is re-thrown during render, so the route's error boundary shows a recovery screen.
  const [crash, setCrash] = useState<unknown>(null);
  if (crash) throw crash;

  const simRef = useRef<S | null>(null);
  const fxRef = useRef<Fx>(createFx());
  const endedRef = useRef(true);
  const hudAt = useRef(0);
  const cfg = useRef(config);
  useEffect(() => {
    cfg.current = config;
  });

  const { attachCanvas, viewRef } = useCanvas((view) => {
    // Runs when the canvas appears or changes size: keep the picture current even while paused.
    const sim = simRef.current;
    if (!sim) return;
    cfg.current.resize?.(sim, view);
    cfg.current.draw(view, sim, fxRef.current, performance.now());
  });

  const end = useCallback(() => {
    const sim = simRef.current;
    if (!sim || endedRef.current) return;
    endedRef.current = true;
    setHud(cfg.current.snapshot(sim));
    setReport(cfg.current.save(sim, recorder));
    session.finish();
  }, [recorder, session]);

  const playing = session.phase === "playing";
  useGameLoop(session.phase === "countdown" || playing, (dtMs, timeMs) => {
    const sim = simRef.current, fx = fxRef.current;
    if (!sim || crash) return;
    try {
      fx.reduced = reduced;
      if (playing && !endedRef.current) {
        cfg.current.step(sim, dtMs);
        cfg.current.drain(sim, fx, viewRef.current);
      }
      stepFx(fx, dtMs);
      if (viewRef.current) cfg.current.draw(viewRef.current, sim, fx, timeMs);
      if (timeMs - hudAt.current >= 100) {
        hudAt.current = timeMs;
        setHud(cfg.current.snapshot(sim));
      }
      if (playing && cfg.current.isOver(sim)) end();
    } catch (error) {
      setCrash(error);
    }
  });

  /** Starts a fresh run with the given simulation. */
  const begin = useCallback((sim: S) => {
    recorder.flush();
    markSeen(cfg.current.game);
    simRef.current = sim;
    fxRef.current = createFx();
    endedRef.current = false;
    if (viewRef.current) cfg.current.resize?.(sim, viewRef.current);
    setReport(null);
    setHud(cfg.current.snapshot(sim));
    session.start();
  }, [recorder, session, viewRef]);

  /** Applies player input to the simulation right away (only while playing). */
  const act = useCallback((input: (sim: S) => void) => {
    const sim = simRef.current;
    if (!sim || !playing || endedRef.current) return;
    input(sim);
    cfg.current.drain(sim, fxRef.current, viewRef.current);
    setHud(cfg.current.snapshot(sim));
    if (cfg.current.isOver(sim)) end();
  }, [playing, end, viewRef]);

  return { settings, store, scores, recorder, session, reduced, hud, report, attachCanvas, begin, act, quit: end };
}
