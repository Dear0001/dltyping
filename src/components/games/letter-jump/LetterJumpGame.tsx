"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import GameKeyboard from "@/components/keyboard/GameKeyboard";
import GameControls from "@/components/games/shared/GameControls";
import { GameOverDialog, GamePauseDialog, GameStartDialog } from "@/components/games/shared/GameDialog";
import GameInstructions from "@/components/games/shared/GameInstructions";
import GameLayout from "@/components/games/shared/GameLayout";
import GameResults from "@/components/games/shared/GameResults";
import GameScene from "@/components/games/shared/GameScene";
import { ComboBadge, GameProgress, GameScore, GameTimer, Hearts, HudStat } from "@/components/games/shared/GameHUD";
import { DifficultySelector, LanguageSelector, Segmented } from "@/components/games/shared/Selectors";
import TargetCard from "@/components/games/shared/TargetCard";
import { letterPools } from "@/data/game-content";
import { useScores, useSeen, useSettings } from "@/hooks/use-stored-value";
import { useKeyInput } from "@/hooks/use-key-input";
import { useAutoPause, useTicker } from "@/hooks/use-ticker";
import { DIFFICULTY_RULES, LIVES, applyMistake, comboMultiplier, pick, unitScore, type Difficulty, type GameStatus } from "@/lib/game-engine";
import { codepoints } from "@/lib/khmer-unicode";
import { markSeen, recordScore } from "@/lib/local-progress";
import { playSound } from "@/lib/sound";
import { calcAccuracy, calcWpm } from "@/lib/typing-engine";
import type { Language } from "@/types";

type Mode = "timed" | "endless";
const TIMED_MS = 60_000;
const DEMO = ["A", "S", "D", "F", "J", "K", "L"].map((c) => c.toLowerCase());
const STEPS = [
  { icon: "🎯", title: "Read the target", text: "The glowing platform shows the letter to type next. Khmer targets may be a whole syllable, so type every part." },
  { icon: "⌨️", title: "Type to jump", text: "Press the matching key on your keyboard (or tap the on-screen one). A correct key makes the hero hop to the next platform." },
  { icon: "🔥", title: "Build a streak", text: "Correct hops grow your combo and score multiplier. A wrong key resets it, and enough mistakes cost a heart." },
  { icon: "⏱️", title: "Beat the clock", text: "Each target has its own timer that gets tighter as you advance. Press Esc any time to pause." },
];

type State = {
  status: GameStatus; language: Language; difficulty: Difficulty; mode: Mode; seed: number;
  queue: string[]; index: number; cp: number; score: number; combo: number; bestCombo: number;
  lives: number; mistakeCounter: number; mistakes: number; correctKeys: number; totalKeys: number;
  completed: number; skipped: number; elapsedMs: number; unitMs: number; jumpKey: number; errorKey: number;
  reason: "time" | "lives" | "quit" | null; bestAtStart: number;
};
type Action =
  | { type: "start"; language: Language; difficulty: Difficulty; mode: Mode; seed: number; bestAtStart: number }
  | { type: "key"; char: string } | { type: "tick"; delta: number }
  | { type: "pause" } | { type: "resume" } | { type: "finish" } | { type: "menu" };

const initial: State = { status: "idle", language: "english", difficulty: "easy", mode: "timed", seed: 1, queue: [], index: 0, cp: 0, score: 0, combo: 0, bestCombo: 0, lives: LIVES, mistakeCounter: 0, mistakes: 0, correctKeys: 0, totalKeys: 0, completed: 0, skipped: 0, elapsedMs: 0, unitMs: 0, jumpKey: 0, errorKey: 0, reason: null, bestAtStart: 0 };

function fill(s: State, upto: number): State {
  let { seed } = s;
  const queue = [...s.queue];
  while (queue.length < upto) {
    const r = pick(letterPools[s.language][s.difficulty], seed, queue[queue.length - 1]);
    queue.push(r.value);
    seed = r.seed;
  }
  return { ...s, queue, seed };
}

export function targetLimitMs(difficulty: Difficulty, completed: number) {
  return DIFFICULTY_RULES[difficulty].targetMs * Math.max(0.55, Math.pow(0.95, Math.floor(completed / 10)));
}

function miss(s: State): State {
  const m = applyMistake(s.lives, s.mistakeCounter, DIFFICULTY_RULES[s.difficulty].mistakesPerLife);
  const next: State = { ...s, lives: m.lives, mistakeCounter: m.counter, combo: 0, mistakes: s.mistakes + 1, errorKey: s.errorKey + 1 };
  return m.lives <= 0 ? { ...next, status: "finished", reason: "lives" } : next;
}

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "start":
      return fill({ ...initial, status: "playing", language: a.language, difficulty: a.difficulty, mode: a.mode, seed: a.seed, bestAtStart: a.bestAtStart }, 10);
    case "pause": return s.status === "playing" ? { ...s, status: "paused" } : s;
    case "resume": return s.status === "paused" ? { ...s, status: "playing" } : s;
    case "finish": return s.status === "playing" || s.status === "paused" ? { ...s, status: "finished", reason: "quit" } : s;
    case "menu": return { ...initial };
    case "tick": {
      if (s.status !== "playing") return s;
      const elapsedMs = s.elapsedMs + a.delta;
      const unitMs = s.unitMs + a.delta;
      if (s.mode === "timed" && elapsedMs >= TIMED_MS) return { ...s, elapsedMs: TIMED_MS, status: "finished", reason: "time" };
      if (unitMs >= targetLimitMs(s.difficulty, s.completed)) {
        // Too slow: the hero slips to the next platform without scoring.
        const m = miss({ ...s, elapsedMs });
        if (m.status === "finished") return m;
        return fill({ ...m, index: m.index + 1, cp: 0, unitMs: 0, skipped: m.skipped + 1 }, m.index + 11);
      }
      return { ...s, elapsedMs, unitMs };
    }
    case "key": {
      if (s.status !== "playing") return s;
      const cps = codepoints(s.queue[s.index]);
      const totalKeys = s.totalKeys + 1;
      if (a.char !== cps[s.cp]) return { ...miss(s), totalKeys };
      const correctKeys = s.correctKeys + 1;
      if (s.cp + 1 < cps.length) return { ...s, cp: s.cp + 1, correctKeys, totalKeys };
      const combo = s.combo + 1;
      return fill({ ...s, cp: 0, index: s.index + 1, correctKeys, totalKeys, combo, bestCombo: Math.max(s.bestCombo, combo), score: s.score + unitScore(10 * cps.length, combo), completed: s.completed + 1, jumpKey: s.jumpKey + 1, unitMs: 0 }, s.index + 11);
    }
  }
}

export default function LetterJumpGame() {
  const [settings, updateSettings] = useSettings();
  const scores = useScores();
  const seen = useSeen();
  const [state, dispatch] = useReducer(reducer, initial);
  const [mode, setMode] = useState<Mode>("timed");
  const { language, difficulty } = settings;
  const playing = state.status === "playing";
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  });

  useTicker(playing, (delta) => dispatch({ type: "tick", delta }));
  useAutoPause(playing, () => dispatch({ type: "pause" }));

  const variant = `letter-jump:${state.language}:${state.difficulty}:${state.mode}`;
  const accuracy = calcAccuracy(state.correctKeys, state.totalKeys);
  const wpm = calcWpm(state.correctKeys, state.elapsedMs);

  useEffect(() => {
    if (state.status === "finished") {
      recordScore(variant, { score: state.score, wpm, accuracy });
      playSound(state.reason === "lives" ? "lose" : "win", stateRef.current.status === "finished" && settings.sound);
    }
    // Only when a run ends.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  function start() {
    markSeen("letter-jump");
    const best = scores[`letter-jump:${language}:${difficulty}:${mode}`]?.best ?? 0;
    dispatch({ type: "start", language, difficulty, mode, seed: (Date.now() ^ 0x9e3779b9) >>> 0, bestAtStart: best });
  }

  function handleChar(char: string) {
    const s = stateRef.current;
    if (s.status !== "playing") return;
    const cps = codepoints(s.queue[s.index]);
    const ok = char === cps[s.cp];
    playSound(!ok ? "wrong" : s.cp + 1 === cps.length ? "jump" : "key", settings.sound);
    dispatch({ type: "key", char });
  }

  useKeyInput(playing, state.language, { onChar: handleChar, onEscape: () => dispatch({ type: "pause" }) });

  const active = state.status !== "idle";
  const units = state.queue.length ? state.queue : DEMO;
  const unit = units[state.index] ?? "";
  const expected = playing || state.status === "paused" ? codepoints(unit)[state.cp] : null;
  const limit = targetLimitMs(state.difficulty, state.completed);
  const stage = Math.floor(state.completed / 10) + 1;
  const timeLeft = TIMED_MS - state.elapsedMs;
  const bestNow = Math.max(state.bestAtStart, state.score);
  const newBest = state.score > 0 && state.score > state.bestAtStart;

  return <GameLayout title="Letter Jump" tagline="Type the target, hop to the next platform. How far can you go?">
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <GameScore score={state.score} />
        <ComboBadge combo={state.combo} multiplier={comboMultiplier(state.combo)} />
        <Hearts lives={state.lives} max={LIVES} />
        {state.mode === "timed" ? <GameTimer ms={active ? timeLeft : TIMED_MS} /> : <HudStat label="Stage" value={stage} />}
        <HudStat label="Accuracy" value={`${accuracy}%`} tone={accuracy >= 90 ? "good" : "default"} />
      </div>
      <GameProgress label={state.mode === "timed" ? "Time elapsed" : `Stage ${stage} progress`} value={state.mode === "timed" ? (state.elapsedMs / TIMED_MS) * 100 : (state.completed % 10) * 10} />
      {active && unit && <TargetCard unit={unit} typed={state.cp} language={state.language} label={playing || state.status === "paused" ? "Type this" : "Run over"} />}
      {active && <div className="h-1.5 overflow-hidden rounded-full bg-slate-200" aria-hidden="true"><div className={`h-full rounded-full ${state.unitMs / limit > 0.7 ? "bg-bad" : "bg-accent"}`} style={{ width: `${Math.max(0, 100 - (state.unitMs / limit) * 100)}%` }} /></div>}
      <GameScene theme="sky" hero="blob" units={units} index={state.index} typed={state.cp} jumpKey={state.jumpKey} errorKey={state.errorKey} language={state.language} />
      <GameControls status={state.status} onPause={() => dispatch({ type: "pause" })} onResume={() => dispatch({ type: "resume" })} onRestart={start} onMenu={() => dispatch({ type: "menu" })} />
      <GameKeyboard language={state.status === "idle" ? language : state.language} expected={expected} disabled={!playing} onChar={handleChar} />
    </div>

    {state.status === "idle" && <GameStartDialog title="Letter Jump" subtitle="Type each target to leap across the sky." icon="🦘" onStart={start}>
      <div className="grid gap-3 sm:grid-cols-2">
        <LanguageSelector value={language} onChange={(v) => updateSettings({ language: v })} />
        <DifficultySelector value={difficulty} onChange={(v) => updateSettings({ difficulty: v })} />
      </div>
      <Segmented label="Mode" value={mode} onChange={setMode} options={[{ value: "timed", label: "Timed · 60s" }, { value: "endless", label: "Endless" }]} />
      <p className="text-xs text-mute">Best on this setup: <strong className="text-navy">{(scores[`letter-jump:${language}:${difficulty}:${mode}`]?.best ?? 0).toLocaleString("en-US")}</strong></p>
      <GameInstructions steps={STEPS} firstTime={!seen["letter-jump"]} />
    </GameStartDialog>}
    {state.status === "paused" && <GamePauseDialog onResume={() => dispatch({ type: "resume" })} onRestart={start} />}
    {state.status === "finished" && <GameOverDialog title={state.reason === "time" ? "Time's up!" : state.reason === "lives" ? "Out of lives" : "Run finished"} subtitle={`${state.completed} hops · stage ${stage}`} icon={state.reason === "lives" ? "💔" : "🏁"} onRetry={start}>
      <GameResults newBest={newBest} best={bestNow} rows={[
        { label: "Score", value: state.score.toLocaleString("en-US"), tone: "brand" },
        { label: "Accuracy", value: `${accuracy}%`, tone: accuracy >= 90 ? "good" : "default" },
        { label: "Correct chars", value: state.correctKeys, tone: "good" },
        { label: "Mistakes", value: state.mistakes, tone: state.mistakes ? "bad" : "default" },
        { label: "Best combo", value: state.bestCombo },
        { label: "Speed", value: `${wpm} WPM` },
      ]} />
    </GameOverDialog>}
  </GameLayout>;
}
