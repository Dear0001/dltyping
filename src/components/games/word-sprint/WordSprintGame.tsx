"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import GameKeyboard from "@/components/keyboard/GameKeyboard";
import GameControls from "@/components/games/shared/GameControls";
import { GameOverDialog, GamePauseDialog, GameStartDialog } from "@/components/games/shared/GameDialog";
import GameInstructions from "@/components/games/shared/GameInstructions";
import GameLayout from "@/components/games/shared/GameLayout";
import GameResults from "@/components/games/shared/GameResults";
import { ComboBadge, GameProgress, GameScore, GameTimer, HudStat } from "@/components/games/shared/GameHUD";
import { DifficultySelector, LanguageSelector, Segmented } from "@/components/games/shared/Selectors";
import { wordBanks } from "@/data/game-content";
import { useScores, useSeen, useSettings } from "@/hooks/use-stored-value";
import { useKeyInput } from "@/hooks/use-key-input";
import { useAutoPause, useTicker } from "@/hooks/use-ticker";
import { comboMultiplier, shuffled, unitScore, type Difficulty, type GameStatus } from "@/lib/game-engine";
import { codepoints, normalizeKhmer } from "@/lib/khmer-unicode";
import { markSeen, recordScore } from "@/lib/local-progress";
import { playSound } from "@/lib/sound";
import { calcAccuracy, calcWpm, getCharStates } from "@/lib/typing-engine";
import type { Language } from "@/types";

type Duration = 30 | 60 | 120;
const STEPS = [
  { icon: "👀", title: "Read the word", text: "The current word is shown large in the middle. The next few words queue up beneath it." },
  { icon: "⌨️", title: "Type it exactly", text: "Correct letters turn green, mistakes turn red. Press Backspace to fix an error — the word advances automatically when it's right." },
  { icon: "🔥", title: "Keep the combo", text: "Words typed with zero mistakes build a combo and a score multiplier. Any mistake breaks it." },
  { icon: "⏱️", title: "Beat the timer", text: "Pick 30, 60 or 120 seconds. Press Esc to pause. Your best score is saved on this device." },
];

type State = {
  status: GameStatus; language: Language; difficulty: Difficulty; durationMs: number; words: string[]; wordIdx: number; typed: string[];
  score: number; combo: number; bestCombo: number; errors: number; correctKeys: number; totalKeys: number; completedWords: number;
  correctChars: number; wordHadError: boolean; elapsedMs: number; errorKey: number; reason: "time" | "quit" | null; bestAtStart: number;
};
type Action =
  | { type: "start"; language: Language; difficulty: Difficulty; duration: Duration; seed: number; bestAtStart: number }
  | { type: "key"; char: string } | { type: "backspace" } | { type: "tick"; delta: number }
  | { type: "pause" } | { type: "resume" } | { type: "finish" } | { type: "menu" };

const initial: State = { status: "idle", language: "english", difficulty: "easy", durationMs: 60000, words: [], wordIdx: 0, typed: [], score: 0, combo: 0, bestCombo: 0, errors: 0, correctKeys: 0, totalKeys: 0, completedWords: 0, correctChars: 0, wordHadError: false, elapsedMs: 0, errorKey: 0, reason: null, bestAtStart: 0 };
const DEMO_WORDS = ["planet", "window", "garden", "rhythm", "bridge", "simple"];

const target = (s: State) => normalizeKhmer(s.words[s.wordIdx] ?? "");

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "start": {
      const bank = wordBanks[a.language][a.difficulty];
      let seed = a.seed;
      const words: string[] = [];
      while (words.length < 160) {
        const r = shuffled(bank, seed);
        seed = r.seed;
        // Avoid the same word twice in a row across shuffle boundaries.
        if (words.length && r.value[0] === words[words.length - 1]) r.value.push(r.value.shift()!);
        words.push(...r.value);
      }
      return { ...initial, status: "playing", language: a.language, difficulty: a.difficulty, durationMs: a.duration * 1000, words, bestAtStart: a.bestAtStart };
    }
    case "pause": return s.status === "playing" ? { ...s, status: "paused" } : s;
    case "resume": return s.status === "paused" ? { ...s, status: "playing" } : s;
    case "finish": return s.status === "playing" || s.status === "paused" ? { ...s, status: "finished", reason: "quit" } : s;
    case "menu": return { ...initial };
    case "tick": {
      if (s.status !== "playing") return s;
      const elapsedMs = s.elapsedMs + a.delta;
      return elapsedMs >= s.durationMs ? { ...s, elapsedMs: s.durationMs, status: "finished", reason: "time" } : { ...s, elapsedMs };
    }
    case "backspace": return s.status === "playing" && s.typed.length ? { ...s, typed: s.typed.slice(0, -1) } : s;
    case "key": {
      if (s.status !== "playing") return s;
      const goal = codepoints(target(s));
      if (s.typed.length >= goal.length) return s; // word is full but wrong: Backspace first
      const ok = a.char === goal[s.typed.length];
      const typed = [...s.typed, a.char];
      const totalKeys = s.totalKeys + 1;
      if (!ok) return { ...s, typed, totalKeys, errors: s.errors + 1, combo: 0, wordHadError: true, errorKey: s.errorKey + 1 };
      const correctKeys = s.correctKeys + 1;
      if (typed.length < goal.length) return { ...s, typed, correctKeys, totalKeys };
      if (typed.some((cp, i) => cp !== goal[i])) return { ...s, typed, correctKeys, totalKeys };
      const clean = !s.wordHadError;
      const combo = clean ? s.combo + 1 : 0;
      return {
        ...s, typed: [], wordIdx: s.wordIdx + 1, correctKeys, totalKeys, wordHadError: false, combo, bestCombo: Math.max(s.bestCombo, combo),
        score: s.score + (clean ? unitScore(10 * goal.length, combo) : 5 * goal.length), completedWords: s.completedWords + 1, correctChars: s.correctChars + goal.length + 1,
      };
    }
  }
}

export default function WordSprintGame() {
  const [settings, updateSettings] = useSettings();
  const scores = useScores();
  const seen = useSeen();
  const [duration, setDuration] = useState<Duration>(60);
  const [state, dispatch] = useReducer(reducer, initial);
  const { language, difficulty } = settings;
  const playing = state.status === "playing";
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  });

  useTicker(playing, (delta) => dispatch({ type: "tick", delta }));
  useAutoPause(playing, () => dispatch({ type: "pause" }));

  const word = state.status === "idle" ? DEMO_WORDS[0] : state.words[state.wordIdx] ?? "";
  const goal = codepoints(target(state));
  const liveChars = state.correctChars + state.typed.filter((cp, i) => cp === goal[i]).length;
  const wpm = calcWpm(liveChars, state.elapsedMs);
  const accuracy = calcAccuracy(state.correctKeys, state.totalKeys);
  const variant = `word-sprint:${state.language}:${state.difficulty}:${state.durationMs / 1000}`;
  const timeLeft = state.durationMs - state.elapsedMs;

  useEffect(() => {
    if (state.status === "finished") {
      recordScore(variant, { score: state.score, wpm, accuracy });
      playSound("win", settings.sound);
    }
    // Only when a run ends.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  function start() {
    markSeen("word-sprint");
    const best = scores[`word-sprint:${language}:${difficulty}:${duration}`]?.best ?? 0;
    dispatch({ type: "start", language, difficulty, duration, seed: (Date.now() ^ 0x85ebca6b) >>> 0, bestAtStart: best });
  }

  function handleChar(char: string) {
    const s = stateRef.current;
    if (s.status !== "playing") return;
    const expected = codepoints(target(s))[s.typed.length];
    if (expected === undefined) return;
    playSound(char === expected ? "key" : "wrong", settings.sound);
    dispatch({ type: "key", char });
  }

  useKeyInput(playing, state.language, { onChar: handleChar, onBackspace: () => dispatch({ type: "backspace" }), onEscape: () => dispatch({ type: "pause" }) });

  const khmer = (state.status === "idle" ? language : state.language) === "khmer";
  const view = getCharStates(word, state.status === "idle" ? [] : state.typed, khmer ? "khmer" : "english");
  const upcoming = state.words.slice(state.wordIdx + 1, state.wordIdx + 6);
  const nextCp = state.status === "playing" || state.status === "paused" ? goal[state.typed.length] ?? null : null;
  const newBest = state.score > 0 && state.score > state.bestAtStart;

  return <GameLayout title="Word Sprint" tagline="Type as many words as you can before the timer hits zero.">
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 lg:grid-cols-6">
        <GameTimer ms={state.status === "idle" ? duration * 1000 : timeLeft} />
        <GameScore score={state.score} />
        <HudStat label="WPM" value={wpm} tone="brand" />
        <HudStat label="Accuracy" value={`${accuracy}%`} tone={accuracy >= 90 ? "good" : "default"} />
        <HudStat label="Errors" value={state.errors} tone={state.errors ? "bad" : "default"} />
        <ComboBadge combo={state.combo} multiplier={comboMultiplier(state.combo)} />
      </div>
      <GameProgress label="Time elapsed" value={(state.elapsedMs / (state.status === "idle" ? duration * 1000 : state.durationMs)) * 100} />

      <section className="rounded-3xl bg-gradient-to-br from-navy via-slate-900 to-blue-900 p-6 text-white shadow-lg sm:p-10" aria-label="Typing area">
        <div className="mb-4 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-sky-300">
          <span>Current word</span><span>{state.completedWords} words</span>
        </div>
        <div key={state.errorKey} className={`flex min-h-24 flex-wrap items-center justify-center text-center ${state.errorKey ? "gm-shake" : ""}`} aria-live="polite" lang={khmer ? "km" : "en"}>
          <span className={`${khmer ? "font-khmer text-6xl sm:text-8xl" : "text-6xl font-extrabold tracking-wide sm:text-8xl"}`}>
            {view.map((c, i) => <span key={i} className={c.state === "correct" ? "text-emerald-400" : c.state === "wrong" ? "rounded bg-red-500/30 text-red-300" : c.state === "partial" ? "text-sky-300 underline decoration-4 underline-offset-8" : c.state === "current" ? "text-white underline decoration-accent decoration-4 underline-offset-8" : "text-slate-500"}>{c.text}</span>)}
          </span>
        </div>
        <p className="mt-4 h-5 text-center text-sm text-sky-200">
          {state.status === "idle" ? "Press Start to begin" : state.typed.length >= goal.length && state.wordHadError ? "Press Backspace to fix the mistake" : " "}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2" aria-label="Upcoming words">
          <span className="mr-1 text-xs font-bold uppercase tracking-widest text-slate-400">Next</span>
          {(state.status === "idle" ? DEMO_WORDS.slice(1) : upcoming).map((w, i) => <span key={`${w}-${i}`} className={`rounded-full bg-white/10 px-4 py-1.5 text-lg ${khmer ? "font-khmer" : "font-semibold"}`} style={{ opacity: 1 - i * 0.14 }}>{w}</span>)}
        </div>
      </section>

      <GameControls status={state.status} onPause={() => dispatch({ type: "pause" })} onResume={() => dispatch({ type: "resume" })} onRestart={start} onFinish={() => dispatch({ type: "finish" })} onMenu={() => dispatch({ type: "menu" })} />
      <GameKeyboard language={state.status === "idle" ? language : state.language} expected={nextCp} disabled={!playing} onChar={handleChar} onBackspace={() => dispatch({ type: "backspace" })} />
    </div>

    {state.status === "idle" && <GameStartDialog title="Word Sprint" subtitle="Type fast, type clean, keep the combo alive." icon="⚡" onStart={start}>
      <div className="grid gap-3 sm:grid-cols-2">
        <LanguageSelector value={language} onChange={(v) => updateSettings({ language: v })} />
        <DifficultySelector value={difficulty} onChange={(v) => updateSettings({ difficulty: v })} />
      </div>
      <Segmented label="Duration" value={duration} onChange={setDuration} options={[{ value: 30, label: "30 sec" }, { value: 60, label: "60 sec" }, { value: 120, label: "120 sec" }]} />
      <p className="text-xs text-mute">Best on this setup: <strong className="text-navy">{(scores[`word-sprint:${language}:${difficulty}:${duration}`]?.best ?? 0).toLocaleString("en-US")}</strong></p>
      <GameInstructions steps={STEPS} firstTime={!seen["word-sprint"]} />
    </GameStartDialog>}
    {state.status === "paused" && <GamePauseDialog onResume={() => dispatch({ type: "resume" })} onRestart={start} />}
    {state.status === "finished" && <GameOverDialog title={state.reason === "time" ? "Time's up!" : "Sprint finished"} subtitle={`${state.completedWords} words in ${Math.round(state.elapsedMs / 1000)}s`} icon="🏁" onRetry={start}>
      <GameResults newBest={newBest} best={Math.max(state.bestAtStart, state.score)} rows={[
        { label: "Score", value: state.score.toLocaleString("en-US"), tone: "brand" },
        { label: "WPM", value: wpm, tone: "brand" },
        { label: "Accuracy", value: `${accuracy}%`, tone: accuracy >= 90 ? "good" : "default" },
        { label: "Words", value: state.completedWords, tone: "good" },
        { label: "Errors", value: state.errors, tone: state.errors ? "bad" : "default" },
        { label: "Best combo", value: state.bestCombo },
      ]} />
    </GameOverDialog>}
  </GameLayout>;
}
