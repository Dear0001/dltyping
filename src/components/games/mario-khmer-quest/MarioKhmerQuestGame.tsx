"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import GameKeyboard from "@/components/keyboard/GameKeyboard";
import GameControls from "@/components/games/shared/GameControls";
import { GameOverDialog, GamePauseDialog, GameStartDialog, primaryBtn } from "@/components/games/shared/GameDialog";
import GameInstructions from "@/components/games/shared/GameInstructions";
import GameLayout from "@/components/games/shared/GameLayout";
import GameResults from "@/components/games/shared/GameResults";
import GameScene from "@/components/games/shared/GameScene";
import { ComboBadge, GameScore, GameTimer, Hearts, HudStat } from "@/components/games/shared/GameHUD";
import { DifficultySelector } from "@/components/games/shared/Selectors";
import { marioLevels } from "@/data/game-content";
import { useLevelBook, useScores, useSeen, useSettings } from "@/hooks/use-stored-value";
import { useKeyInput } from "@/hooks/use-key-input";
import { useAutoPause, useTicker } from "@/hooks/use-ticker";
import { DIFFICULTY_RULES, LIVES, applyMistake, comboMultiplier, starsFor, unitScore, type Difficulty, type GameStatus } from "@/lib/game-engine";
import { codepoints } from "@/lib/khmer-unicode";
import { markSeen, recordLevel, recordScore } from "@/lib/local-progress";
import { playSound } from "@/lib/sound";
import { calcAccuracy } from "@/lib/typing-engine";

const SECONDS_PER_KEY: Record<Difficulty, number> = { easy: 3.2, medium: 2.4, hard: 1.8 };
const STEPS = [
  { icon: "🧭", title: "Meet your explorer", text: "Guide the explorer across ancient stone platforms to the temple gate at the end of each level." },
  { icon: "🎯", title: "Type the target", text: "The platform you stand on shows a Khmer letter, syllable or word. Type it with your keyboard (any Khmer layout works — or Latin keys mapped to NiDA)." },
  { icon: "🦘", title: "Jump on success", text: "Each correct unit makes the explorer leap to the next platform, collect a coin and grow your combo." },
  { icon: "⚠️", title: "Mind the spikes", text: "Wrong keys make the explorer stumble and break your combo. Enough stumbles cost a heart. Lose all hearts or run out of time and the level ends." },
  { icon: "⌨️", title: "Use the NiDA keyboard", text: "The on-screen keyboard highlights the key for each next character, so you learn the layout as you play. Press Esc to pause." },
];

type Outcome = "win" | "timeout" | "lives" | "quit";
type State = {
  status: GameStatus; level: number; difficulty: Difficulty; units: string[]; index: number; cp: number; score: number; combo: number; bestCombo: number;
  lives: number; mistakeCounter: number; mistakes: number; correctKeys: number; totalKeys: number; elapsedMs: number; limitMs: number;
  jumpKey: number; errorKey: number; outcome: Outcome | null; bestAtStart: number; timeBonus: number;
};
type Action =
  | { type: "start"; level: number; difficulty: Difficulty; bestAtStart: number }
  | { type: "key"; char: string } | { type: "tick"; delta: number }
  | { type: "pause" } | { type: "resume" } | { type: "quit" } | { type: "menu" };

const initial: State = { status: "idle", level: 1, difficulty: "easy", units: marioLevels[0].units, index: 0, cp: 0, score: 0, combo: 0, bestCombo: 0, lives: LIVES, mistakeCounter: 0, mistakes: 0, correctKeys: 0, totalKeys: 0, elapsedMs: 0, limitMs: 0, jumpKey: 0, errorKey: 0, outcome: null, bestAtStart: 0, timeBonus: 0 };

function levelLimit(level: number, difficulty: Difficulty) {
  const keys = marioLevels[level - 1].units.reduce((sum, unit) => sum + codepoints(unit).length, 0);
  return Math.round((keys * SECONDS_PER_KEY[difficulty] + 8) * 1000);
}

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "start": {
      const level = marioLevels[a.level - 1];
      return { ...initial, status: "playing", level: a.level, difficulty: a.difficulty, units: level.units, limitMs: levelLimit(a.level, a.difficulty), bestAtStart: a.bestAtStart };
    }
    case "pause": return s.status === "playing" ? { ...s, status: "paused" } : s;
    case "resume": return s.status === "paused" ? { ...s, status: "playing" } : s;
    case "quit": return s.status === "playing" || s.status === "paused" ? { ...s, status: "finished", outcome: "quit" } : s;
    case "menu": return { ...initial, level: s.level, difficulty: s.difficulty, units: marioLevels[s.level - 1].units };
    case "tick": {
      if (s.status !== "playing") return s;
      const elapsedMs = s.elapsedMs + a.delta;
      return elapsedMs >= s.limitMs ? { ...s, elapsedMs: s.limitMs, status: "finished", outcome: "timeout" } : { ...s, elapsedMs };
    }
    case "key": {
      if (s.status !== "playing") return s;
      const cps = codepoints(s.units[s.index]);
      const totalKeys = s.totalKeys + 1;
      if (a.char !== cps[s.cp]) {
        const m = applyMistake(s.lives, s.mistakeCounter, DIFFICULTY_RULES[s.difficulty].mistakesPerLife);
        const next: State = { ...s, totalKeys, lives: m.lives, mistakeCounter: m.counter, combo: 0, mistakes: s.mistakes + 1, errorKey: s.errorKey + 1 };
        return m.lives <= 0 ? { ...next, status: "finished", outcome: "lives" } : next;
      }
      const correctKeys = s.correctKeys + 1;
      if (s.cp + 1 < cps.length) return { ...s, cp: s.cp + 1, correctKeys, totalKeys };
      const combo = s.combo + 1;
      const index = s.index + 1;
      const base: State = { ...s, cp: 0, index, correctKeys, totalKeys, combo, bestCombo: Math.max(s.bestCombo, combo), score: s.score + unitScore(10 * cps.length, combo), jumpKey: s.jumpKey + 1 };
      if (index < s.units.length) return base;
      const timeBonus = Math.round(((s.limitMs - s.elapsedMs) / 1000) * 5);
      return { ...base, status: "finished", outcome: "win", timeBonus, score: base.score + timeBonus };
    }
  }
}

export default function MarioKhmerQuestGame() {
  const [settings, updateSettings] = useSettings();
  const scores = useScores();
  const levelBook = useLevelBook();
  const seen = useSeen();
  const [state, dispatch] = useReducer(reducer, initial);
  const [selected, setSelected] = useState(1);
  const { difficulty } = settings;
  const playing = state.status === "playing";
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  });

  useTicker(playing, (delta) => dispatch({ type: "tick", delta }));
  useAutoPause(playing, () => dispatch({ type: "pause" }));

  const accuracy = calcAccuracy(state.correctKeys, state.totalKeys);
  const won = state.outcome === "win";
  const stars = won ? starsFor(accuracy, state.lives) : 0;

  useEffect(() => {
    if (state.status !== "finished") return;
    const s = stateRef.current;
    recordScore(`mario-khmer-quest:${s.level}:${s.difficulty}`, { score: s.score, accuracy: calcAccuracy(s.correctKeys, s.totalKeys) });
    if (s.outcome === "win") recordLevel(s.level, { stars: starsFor(calcAccuracy(s.correctKeys, s.totalKeys), s.lives), score: s.score });
    playSound(s.outcome === "win" ? "win" : "lose", settings.sound);
    // Only when a run ends.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  function startLevel(level: number) {
    markSeen("mario-khmer-quest");
    setSelected(level);
    dispatch({ type: "start", level, difficulty, bestAtStart: scores[`mario-khmer-quest:${level}:${difficulty}`]?.best ?? 0 });
  }

  function handleChar(char: string) {
    const s = stateRef.current;
    if (s.status !== "playing") return;
    const cps = codepoints(s.units[s.index]);
    const ok = char === cps[s.cp];
    playSound(!ok ? "wrong" : s.cp + 1 === cps.length ? "jump" : "key", settings.sound);
    dispatch({ type: "key", char });
  }

  useKeyInput(playing, "khmer", { onChar: handleChar, onEscape: () => dispatch({ type: "pause" }) });

  const total = state.units.length;
  const unit = state.units[Math.min(state.index, total - 1)];
  const expected = playing || state.status === "paused" ? codepoints(unit)[state.cp] : null;
  const info = marioLevels[state.level - 1];
  const hasNext = state.level < marioLevels.length;
  const coins = state.index;
  const bestNow = Math.max(state.bestAtStart, state.score);
  const newBest = state.score > 0 && state.score > state.bestAtStart;
  const title = won ? "Level complete!" : state.outcome === "timeout" ? "Out of time" : state.outcome === "lives" ? "The explorer tumbled" : "Level ended";

  return <GameLayout>
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <GameScore score={state.score} />
        <ComboBadge combo={state.combo} multiplier={comboMultiplier(state.combo)} />
        <Hearts lives={state.lives} max={LIVES} />
        <GameTimer ms={state.status === "idle" ? levelLimit(state.level, difficulty) : state.limitMs - state.elapsedMs} />
        <HudStat label="Coins" value={`🪙 ${coins}`} />
      </div>
      <GameScene theme="temple" hero="explorer" units={state.units} index={state.index} typed={state.cp} total={total} jumpKey={state.jumpKey} errorKey={state.errorKey} language="khmer" />
      <GameControls status={state.status} onPause={() => dispatch({ type: "pause" })} onResume={() => dispatch({ type: "resume" })} onRestart={() => startLevel(state.level)} onMenu={() => dispatch({ type: "menu" })} />
      <GameKeyboard language="khmer" expected={expected} disabled={!playing} onChar={handleChar} />
    </div>

    {state.status === "idle" && <GameStartDialog title="Mario Khmer Quest" subtitle="Choose a level and difficulty, then start your adventure." icon="🧭" onStart={() => startLevel(selected)} startLabel={`Start Level ${selected}`}>
      <DifficultySelector value={difficulty} onChange={(v) => updateSettings({ difficulty: v })} />
      <div>
        <div className="mb-1.5 text-xs font-bold uppercase tracking-wider text-mute">Level</div>
        <div role="radiogroup" aria-label="Level" className="grid gap-2 sm:grid-cols-2">
          {marioLevels.map((lv) => {
            const done = levelBook[lv.number];
            return <button key={lv.number} type="button" role="radio" aria-checked={selected === lv.number} onClick={() => { setSelected(lv.number); dispatch({ type: "menu" }); }} className={`rounded-xl border-2 p-3 text-left transition focus-visible:outline-2 focus-visible:outline-brand ${selected === lv.number ? "border-brand bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
              <div className="flex items-center justify-between text-sm font-bold text-navy"><span>{lv.number}. {lv.name}</span><span className="text-amber-400" aria-label={done ? `${done.stars} stars` : "not completed"}>{done ? "★".repeat(done.stars) : <span className="text-slate-300">☆☆☆</span>}</span></div>
              <div className="text-xs text-mute">{lv.blurb} · <span className="font-khmer">{lv.units.slice(0, 3).join(" ")}</span></div>
            </button>;
          })}
        </div>
      </div>
      <GameInstructions steps={STEPS} firstTime={!seen["mario-khmer-quest"]} />
    </GameStartDialog>}
    {state.status === "paused" && <GamePauseDialog onResume={() => dispatch({ type: "resume" })} onRestart={() => startLevel(state.level)} />}
    {state.status === "finished" && <GameOverDialog
      title={title} subtitle={`Level ${state.level} · ${info.name}`} icon={won ? "🏆" : state.outcome === "lives" ? "💔" : "⏳"} onRetry={() => startLevel(state.level)}
      extra={won && hasNext ? <button data-autofocus type="button" className={`${primaryBtn} flex-1`} onClick={() => startLevel(state.level + 1)}>Next Level →</button> : undefined}
    >
      <GameResults stars={won ? stars : undefined} newBest={newBest} best={bestNow} rows={[
        { label: "Score", value: state.score.toLocaleString("en-US"), tone: "brand" },
        { label: "Accuracy", value: `${accuracy}%`, tone: accuracy >= 90 ? "good" : "default" },
        { label: "Coins", value: `🪙 ${coins}` },
        { label: "Mistakes", value: state.mistakes, tone: state.mistakes ? "bad" : "default" },
        { label: "Best combo", value: state.bestCombo },
        { label: won ? "Time bonus" : "Progress", value: won ? `+${state.timeBonus}` : `${state.index}/${total}` },
      ]} />
      {won && !hasNext && <p className="rounded-xl bg-blue-50 px-4 py-2.5 text-center text-sm font-semibold text-brand">🎉 You finished every level of the quest!</p>}
    </GameOverDialog>}
  </GameLayout>;
}
