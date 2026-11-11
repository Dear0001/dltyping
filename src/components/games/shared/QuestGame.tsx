"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import VirtualKeyboard from "@/components/keyboard/VirtualKeyboard";
import GameControls from "@/components/games/shared/GameControls";
import { GameOverDialog, GamePauseDialog, GameStartDialog, primaryBtn } from "@/components/games/shared/GameDialog";
import GameInstructions from "@/components/games/shared/GameInstructions";
import GameLayout from "@/components/games/shared/GameLayout";
import GameResults from "@/components/games/shared/GameResults";
import GameScene from "@/components/games/shared/GameScene";
import { ComboBadge, GameScore, GameTimer, Hearts, HudStat } from "@/components/games/shared/GameHUD";
import { DifficultySelector } from "@/components/games/shared/Selectors";
import type { MarioLevel } from "@/data/game-content";
import type { HeroVariant } from "@/components/games/shared/Hero";
import type { SceneTheme } from "@/components/games/shared/GameScene";
import type { Language } from "@/types";
import { useLevelBook, useScores, useSeen, useSettings } from "@/hooks/use-stored-value";
import { useKeyInput } from "@/hooks/use-key-input";
import { useActivityRecorder } from "@/hooks/useActivityRecorder";
import { useAutoPause, useTicker } from "@/hooks/use-ticker";
import { DIFFICULTY_RULES, LIVES, applyMistake, comboMultiplier, starsFor, unitScore, type Difficulty, type GameStatus } from "@/lib/game-engine";
import { codepoints } from "@/lib/khmer-unicode";
import { markSeen, recordLevel, recordScore } from "@/lib/local-progress";
import { playSound } from "@/lib/sound";
import { useLocale } from "@/components/shared/LocaleProvider";
import { calcAccuracy } from "@/lib/typing-engine";

export type QuestConfig = {
  gameId: string; language: Language; /** Prefix of the dictionary keys: <prefix>.s1t / .s1 … and <prefix>.finish. */ keyPrefix: string; icons: string[]; icon: string; theme: SceneTheme; hero: HeroVariant;
  levels: MarioLevel[]; unitClass?: string;
};

const SECONDS_PER_KEY: Record<Difficulty, number> = { easy: 3.2, medium: 2.4, hard: 1.8 };

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

const initial: State = { status: "idle", level: 1, difficulty: "easy", units: [], index: 0, cp: 0, score: 0, combo: 0, bestCombo: 0, lives: LIVES, mistakeCounter: 0, mistakes: 0, correctKeys: 0, totalKeys: 0, elapsedMs: 0, limitMs: 0, jumpKey: 0, errorKey: 0, outcome: null, bestAtStart: 0, timeBonus: 0 };

function levelLimit(levels: MarioLevel[], level: number, difficulty: Difficulty) {
  const keys = levels[level - 1].units.reduce((sum, unit) => sum + codepoints(unit).length, 0);
  return Math.round((keys * SECONDS_PER_KEY[difficulty] + 8) * 1000);
}

function makeReducer(levels: MarioLevel[]) { return function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "start": {
      const level = levels[a.level - 1];
      return { ...initial, status: "playing", level: a.level, difficulty: a.difficulty, units: level.units, limitMs: levelLimit(levels, a.level, a.difficulty), bestAtStart: a.bestAtStart };
    }
    case "pause": return s.status === "playing" ? { ...s, status: "paused" } : s;
    case "resume": return s.status === "paused" ? { ...s, status: "playing" } : s;
    case "quit": return s.status === "playing" || s.status === "paused" ? { ...s, status: "finished", outcome: "quit" } : s;
    case "menu": return { ...initial, level: s.level, difficulty: s.difficulty, units: levels[s.level - 1].units };
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
}; }

export default function QuestGame({ config }: { config: QuestConfig }) {
  const { t, locale } = useLocale();
  const steps = config.icons.map((icon, i) => ({ icon, title: t(`${config.keyPrefix}.s${i + 1}t`), text: t(`${config.keyPrefix}.s${i + 1}`) }));
  const levelName = (lv: { name: string; nameKm: string }) => (locale === "km" ? lv.nameKm : lv.name);
  const blurb = (b: string) => { const key = `lvl.${b.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "")}`; return t(key) === key ? b : t(key); };
  const { gameId, language, levels: marioLevels } = config;
  const reducer = useMemo(() => makeReducer(marioLevels), [marioLevels]);
  const [settings, updateSettings] = useSettings();
  const recorder = useActivityRecorder();
  const scores = useScores();
  const levelBook = useLevelBook(gameId);
  const seen = useSeen();
  const [state, dispatch] = useReducer(reducer, { ...initial, units: marioLevels[0].units });
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
    recordScore(`${gameId}:${s.level}:${s.difficulty}`, { score: s.score, accuracy: calcAccuracy(s.correctKeys, s.totalKeys) });
    recorder.finish({ activity: gameId === "english-quest" ? "english-quest" : "mario-khmer-quest", language, durationSec: s.elapsedMs / 1000, correct: s.correctKeys, incorrect: s.totalKeys - s.correctKeys, score: s.score, difficulty: s.difficulty, detail: `Level ${s.level}${s.outcome === "win" ? " cleared" : ""}`, stars: s.outcome === "win" ? starsFor(calcAccuracy(s.correctKeys, s.totalKeys), s.lives) : undefined });
    if (s.outcome === "win") recordLevel(s.level, { stars: starsFor(calcAccuracy(s.correctKeys, s.totalKeys), s.lives), score: s.score }, gameId);
    playSound(s.outcome === "win" ? "win" : "lose", settings.sound);
    // Only when a run ends.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  function startLevel(level: number) {
    recorder.flush();
    markSeen(gameId);
    setSelected(level);
    dispatch({ type: "start", level, difficulty, bestAtStart: scores[`${gameId}:${level}:${difficulty}`]?.best ?? 0 });
  }

  function handleChar(char: string) {
    const s = stateRef.current;
    if (s.status !== "playing") return;
    const cps = codepoints(s.units[s.index]);
    const ok = char === cps[s.cp];
    if (cps[s.cp]) recorder.keystroke(language, cps[s.cp], ok, false);
    playSound(!ok ? "wrong" : s.cp + 1 === cps.length ? "jump" : "key", settings.sound);
    dispatch({ type: "key", char });
  }

  useKeyInput(playing, language, { onChar: handleChar, onEscape: () => dispatch({ type: "pause" }) });

  const total = state.units.length;
  const unit = state.units[Math.min(state.index, total - 1)];
  const expected = playing || state.status === "paused" ? codepoints(unit)[state.cp] : null;
  const info = marioLevels[state.level - 1];
  const hasNext = state.level < marioLevels.length;
  const coins = state.index;
  const bestNow = Math.max(state.bestAtStart, state.score);
  const newBest = state.score > 0 && state.score > state.bestAtStart;
  const title = won ? t("qg.complete") : state.outcome === "timeout" ? t("qg.outOfTime") : state.outcome === "lives" ? t("qg.tumbled") : t("qg.ended");

  return <GameLayout>
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <GameScore score={state.score} />
        <ComboBadge combo={state.combo} multiplier={comboMultiplier(state.combo)} />
        <Hearts lives={state.lives} max={LIVES} />
        <GameTimer ms={state.status === "idle" ? levelLimit(marioLevels, state.level, difficulty) : state.limitMs - state.elapsedMs} />
        <HudStat label={t("qg.coins")} value={`🪙 ${coins}`} />
      </div>
      <GameScene theme={config.theme} hero={config.hero} units={state.units} index={state.index} typed={state.cp} total={total} jumpKey={state.jumpKey} errorKey={state.errorKey} language={language} />
      <VirtualKeyboard language={language} expected={expected} disabled={!playing} onChar={handleChar} controls={<GameControls status={state.status} onPause={() => dispatch({ type: "pause" })} onResume={() => dispatch({ type: "resume" })} onRestart={() => startLevel(state.level)} onMenu={() => dispatch({ type: "menu" })} />} />
    </div>

    {state.status === "idle" && <GameStartDialog title={t(`game.${gameId}.title`)} subtitle={t("qg.subtitle")} icon={config.icon} onStart={() => startLevel(selected)} startLabel={t("qg.startLevel", { n: selected })}>
      <DifficultySelector value={difficulty} onChange={(v) => updateSettings({ difficulty: v })} />
      <div>
        <div className="mb-1.5 text-xs font-bold uppercase tracking-wider text-mute">{t("qg.level")}</div>
        <div role="radiogroup" aria-label={t("qg.level")} className="grid gap-2 sm:grid-cols-2">
          {marioLevels.map((lv) => {
            const done = levelBook[lv.number];
            return <button key={lv.number} type="button" role="radio" aria-checked={selected === lv.number} onClick={() => { setSelected(lv.number); dispatch({ type: "menu" }); }} className={`rounded-xl border-2 p-3 text-left transition focus-visible:outline-2 focus-visible:outline-brand ${selected === lv.number ? "border-brand bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
              <div className="flex items-center justify-between text-sm font-bold text-navy"><span>{lv.number}. {levelName(lv)}</span><span className="text-amber-400" aria-label={done ? t("qg.stars", { n: done.stars }) : t("qg.notDone")}>{done ? "★".repeat(done.stars) : <span className="text-slate-300">☆☆☆</span>}</span></div>
              <div className="text-xs text-mute">{blurb(lv.blurb)} · <span className={config.unitClass}>{lv.units.slice(0, 3).join(" ")}</span></div>
            </button>;
          })}
        </div>
      </div>
      <GameInstructions steps={steps} firstTime={!seen[gameId]} />
    </GameStartDialog>}
    {state.status === "paused" && <GamePauseDialog onResume={() => dispatch({ type: "resume" })} onRestart={() => startLevel(state.level)} />}
    {state.status === "finished" && <GameOverDialog
      title={title} subtitle={t("qg.levelSub", { n: state.level, name: levelName(info) })} icon={won ? "🏆" : state.outcome === "lives" ? "💔" : "⏳"} onRetry={() => startLevel(state.level)}
      extra={won && hasNext ? <button data-autofocus type="button" className={`${primaryBtn} flex-1`} onClick={() => startLevel(state.level + 1)}>{t("qg.nextLevel")}</button> : undefined}
    >
      <GameResults stars={won ? stars : undefined} newBest={newBest} best={bestNow} rows={[
        { label: t("gm.score"), value: state.score.toLocaleString("en-US"), tone: "brand" },
        { label: t("gm.accuracy"), value: `${accuracy}%`, tone: accuracy >= 90 ? "good" : "default" },
        { label: t("qg.coins"), value: `🪙 ${coins}` },
        { label: t("gm.mistakes"), value: state.mistakes, tone: state.mistakes ? "bad" : "default" },
        { label: t("gm.bestCombo"), value: state.bestCombo },
        { label: won ? t("qg.timeBonus") : t("qg.progressRow"), value: won ? `+${state.timeBonus}` : `${state.index}/${total}` },
      ]} />
      {won && !hasNext && <p className="rounded-xl bg-blue-50 px-4 py-2.5 text-center text-sm font-semibold text-brand">{t(`${config.keyPrefix}.finish`)}</p>}
    </GameOverDialog>}
  </GameLayout>;
}
