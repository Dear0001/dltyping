"use client";

import ArcadeShell from "@/components/games/arcade/ArcadeShell";
import { ActionButton, Chip, formatTime, Meter, OptionPicker, TypeLine } from "@/components/games/arcade/ArcadeParts";
import { burst, floatText, ring, setTimer, showBanner } from "@/components/games/arcade/canvas-utils";
import { useLocale } from "@/components/shared/LocaleProvider";
import { useArcadeGame } from "@/hooks/use-arcade-game";
import { useKeyInput } from "@/hooks/use-key-input";
import { useScores, useSettings } from "@/hooks/use-stored-value";
import { playArcadeSound } from "@/lib/arcade/audio";
import { isArcadeDifficulty, type ArcadeDifficulty } from "@/lib/arcade/difficulty";
import { isUnlocked, loadoutChoice, updateArcade } from "@/lib/arcade/progress";
import { saveRun } from "@/lib/arcade/save";
import { bufferView, expectedChar } from "@/lib/arcade/typing-core";
import { createZombieGame, findTarget, setZombieBounds, shockwaveReady, stepZombies, ZOMBIE_STAGES, zombieChar, zombieOutcome, zombieRelease, zombieShockwave, type ZombieSim, type ZombieStage } from "@/lib/arcade/zombie";
import { comboMultiplier } from "@/lib/game-engine";
import { calcAccuracy, calcWpm, type CharView } from "@/lib/typing-engine";
import type { Language } from "@/types";
import { drawZombies } from "./zombie-render";

const GAME = "zombie-survival";
const STEP_ICONS = ["🧟", "🎯", "⌨️", "🎁", "💥"];
const STAGE_ICONS: Record<ZombieStage, string> = { graveyard: "🪦", street: "🏚️", lab: "🧪" };
/** World units from top to bottom of the field. Smaller = bigger characters. */
const FIELD_HEIGHT = 470;

type Hud = { language: Language; target: CharView[] | null; expected: string | null; health: number; wave: number; resting: boolean; kills: number; points: number; combo: number; wpm: number; accuracy: number; charge: number; ready: boolean; frozen: boolean; timeMs: number };
const HUD: Hud = { language: "english", target: null, expected: null, health: 100, wave: 0, resting: true, kills: 0, points: 0, combo: 0, wpm: 0, accuracy: 100, charge: 0, ready: false, frozen: false, timeMs: 0 };

function snapshot(sim: ZombieSim): Hud {
  const target = findTarget(sim);
  return {
    language: sim.cfg.language, target: target ? bufferView(target.buf) : null, expected: target ? expectedChar(target.buf) : null, health: sim.health, wave: sim.wave, resting: sim.breakMs > 0,
    kills: sim.kills, points: sim.points, combo: sim.combo, wpm: calcWpm(sim.stats.netChars, sim.elapsedMs), accuracy: calcAccuracy(sim.stats.correctKeys, sim.stats.totalKeys),
    charge: sim.charge, ready: shockwaveReady(sim), frozen: sim.freezeMs > 0, timeMs: sim.elapsedMs,
  };
}

export default function ZombieSurvivalGame() {
  const { t } = useLocale();
  const [{ sound }] = useSettings();
  const scores = useScores();
  const game = useArcadeGame<ZombieSim, Hud>({
    game: GAME,
    initialHud: HUD,
    snapshot,
    step: stepZombies,
    isOver: (sim) => sim.over,
    draw: drawZombies,
    resize: (sim, view) => setZombieBounds(sim, Math.max(420, (view.w / view.h) * FIELD_HEIGHT), FIELD_HEIGHT),
    drain(sim, fx) {
      const cx = sim.w / 2, cy = sim.h / 2;
      for (const event of sim.events) {
        switch (event.type) {
          case "key": playArcadeSound("key", sound); setTimer(fx, "shot", 90); break;
          case "wrong": playArcadeSound("wrong", sound); break;
          case "lock": playArcadeSound("hit", sound); break;
          case "wave": playArcadeSound(event.boss ? "boss" : "wave", sound); showBanner(fx, t("zs.wave", { n: event.wave }), event.boss ? t("zs.bossWave") : undefined); break;
          case "waveClear": playArcadeSound("powerup", sound); floatText(fx, cx, cy - 70, t("zs.waveClear"), "#fde68a", 22); break;
          case "kill":
            playArcadeSound(event.zombie === "boss" ? "explode" : "kill", sound);
            burst(fx, event.x, event.y, event.zombie === "boss" ? "#c084fc" : "#84cc16", event.zombie === "boss" ? 40 : 14, event.zombie === "boss" ? 320 : 190);
            floatText(fx, event.x, event.y - 20, `+${event.points}`, "#fde68a");
            if (event.zombie === "boss") setTimer(fx, "shake", 300);
            break;
          case "stage": playArcadeSound("hit", sound); burst(fx, event.x, event.y, "#c084fc", 16, 220); floatText(fx, event.x, event.y - 30, `+${event.points}`, "#e9d5ff"); break;
          case "blast": playArcadeSound("explode", sound); ring(fx, event.x, event.y, 620, "#fb923c", 600); setTimer(fx, "shake", 300); break;
          case "hurt": playArcadeSound("hurt", sound); setTimer(fx, "hurt", 350); setTimer(fx, "shake", 220); floatText(fx, cx, cy - 46, `-${event.damage}`, "#fca5a5", 22); break;
          case "power": playArcadeSound("powerup", sound); ring(fx, event.x, event.y, 90, "#fef08a", 400); break;
          case "freeze": floatText(fx, cx, cy - 70, `❄️ ${t("zs.freeze")}`, "#bae6fd", 22); break;
          case "heal": floatText(fx, cx, cy - 70, "+25 ♥", "#86efac", 22); break;
          case "shockwave": playArcadeSound("explode", sound); ring(fx, cx, cy, 440, "#a5b4fc", 550); setTimer(fx, "shake", 250); break;
          case "over": break;
        }
      }
      sim.events.length = 0;
    },
    save(sim, recorder) {
      const out = zombieOutcome(sim);
      const survived = out.wavesCleared >= 5;
      playArcadeSound(survived ? "win" : "lose", sound);
      if (sim.stats.totalKeys === 0) return null;
      const key = `${GAME}:${sim.cfg.language}:${sim.cfg.difficulty}:${sim.cfg.stage}`;
      return saveRun({
        game: GAME, language: sim.cfg.language, difficulty: sim.cfg.difficulty, score: out.score.total, wpm: out.wpm, cpm: out.cpm, accuracy: out.accuracy, mistakes: out.mistakes,
        correctChars: out.correctChars, bestStreak: out.bestStreak, durationMs: out.timeMs, won: survived, detail: t("zs.detail", { n: out.wave, k: out.kills }),
        sum: { kills: out.kills, bosses: out.bossKills, waves: out.wavesCleared, overrun: sim.over ? 1 : 0 },
        max: { wave: out.wave, flawlessWaves: out.flawlessWaves, combo: out.bestCombo },
      }, out.score, key, scores[key]?.best ?? 0, recorder);
    },
  });
  const { settings, store, session, hud, report, attachCanvas } = game;
  const language = settings.language;

  const saved = store.loadout["zombie.difficulty"];
  const difficulty: ArcadeDifficulty = isArcadeDifficulty(saved) ? saved : "easy";
  const stage = loadoutChoice<ZombieStage>(store, "zombie.stage", ZOMBIE_STAGES, "graveyard", "stage");
  const pick = (key: string) => (value: string) => updateArcade({ loadout: { [key]: value } });

  function start() {
    game.begin(createZombieGame({ language, difficulty, stage, seed: (Date.now() ^ 0x7f4a7c15) >>> 0 }));
  }
  function onChar(char: string) {
    game.act((sim) => {
      const before = findTarget(sim);
      const expected = before ? expectedChar(before.buf) : null;
      zombieChar(sim, char);
      // With no target yet, the key counts only if it locked onto one (then it was that word's first letter).
      if (expected !== null) game.recorder.keystroke(sim.cfg.language, expected, char === expected);
      else if (findTarget(sim) || sim.events.some((e) => e.type === "kill" || e.type === "power")) game.recorder.keystroke(sim.cfg.language, char, true);
    });
  }
  const release = () => game.act(zombieRelease);
  const shockwave = () => game.act((sim) => void zombieShockwave(sim));

  useKeyInput(session.phase === "playing", hud.language, { onChar, onBackspace: release, onEscape: session.pause, onEnter: shockwave });

  const result = report?.result;
  const khmer = hud.language === "khmer";
  const multiplier = comboMultiplier(hud.combo);

  return <ArcadeShell
    game={GAME} icon="🧟" music="zombie" session={session} difficulty={difficulty} onDifficulty={pick("zombie.difficulty")} runLanguage={hud.language}
    variant={`${GAME}:${language}:${difficulty}:${stage}`}
    howTo={STEP_ICONS.map((icon, i) => ({ icon, title: t(`zs.s${i + 1}t`), text: t(`zs.s${i + 1}`) }))}
    controls={[{ keys: t("arc.keyLetters"), text: t("zs.c1") }, { keys: "Backspace", text: t("zs.c2") }, { keys: "Enter", text: t("zs.c3") }, { keys: "Esc", text: t("arc.keyPause") }]}
    options={<>
      <OptionPicker label={t("zs.stage")} value={stage} onChange={pick("zombie.stage")} options={ZOMBIE_STAGES.map((id) => ({ id, label: t(`unl.stage-${id}`), locked: !isUnlocked(store, `stage:${id}`), how: t(`unl.stage-${id}.how`), preview: <span className="text-2xl" aria-hidden="true">{STAGE_ICONS[id]}</span> }))} />
      <ul className="grid grid-cols-2 gap-1.5 text-xs text-slate-600">
        {(["normal", "fast", "armored", "boss"] as const).map((type) => <li key={type} className="rounded-xl bg-slate-50 px-2.5 py-2"><strong className="block text-navy">{t(`zs.type.${type}`)}</strong>{t(`zs.type.${type}.d`)}</li>)}
      </ul>
    </>}
    hud={<>
      <Chip label={t("zs.waveLabel")} value={hud.wave || "—"} tone="gold" />
      <Chip label={t("gm.score")} value={hud.points.toLocaleString("en-US")} />
      <Chip label={t("zs.kills")} value={hud.kills} />
      <Chip label="WPM" value={hud.wpm} />
      <Chip label={t("gm.accuracy")} value={`${hud.accuracy}%`} tone={hud.accuracy >= 95 ? "good" : hud.accuracy < 85 ? "bad" : "default"} />
      <Chip label={t("gm.combo")} value={<>{hud.combo}{multiplier > 1 && <span className="ml-1 text-xs text-emerald-300">×{multiplier}</span>}</>} tone={hud.combo >= 5 ? "good" : "default"} />
    </>}
    canvas={<canvas ref={attachCanvas} className="block h-full w-full" role="img" aria-label={t("zs.canvas")} />}
    panel={<div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Meter label={`♥ ${t("zs.health")}`} value={hud.health / 100} text={`${hud.health}`} color={hud.health > 50 ? "#22c55e" : hud.health > 25 ? "#f59e0b" : "#ef4444"} pulse={hud.health <= 25} />
        <Meter label={t("zs.shockwave")} value={hud.charge / 100} text={hud.ready ? t("race.ready") : undefined} color="linear-gradient(90deg,#818cf8,#c084fc)" pulse={hud.ready} />
        <ActionButton label={`💥 ${t("zs.shockwave")}`} hint="Enter" ready={hud.ready} onClick={shockwave} color="#6366f1" />
      </div>
      <div className="flex min-h-16 items-center justify-center gap-3 rounded-2xl bg-black/30 px-4 py-3 text-center">
        {hud.target
          ? <><TypeLine views={hud.target} khmer={khmer} className="text-2xl sm:text-4xl" /><button type="button" onClick={release} className="flex-none rounded-lg bg-white/10 px-2 py-1 text-xs font-bold text-slate-200 hover:bg-white/20">⌫ {t("zs.switch")}</button></>
          : <p className="text-sm text-slate-300">{hud.resting ? t("zs.getReady") : t("zs.pickTarget")}{hud.frozen && <span className="ml-2 text-sky-300">❄️ {t("zs.freeze")}</span>}</p>}
      </div>
    </div>}
    report={report}
    resultIcon={result?.won ? "🏅" : "🧟"}
    resultTitle={result?.won ? t("zs.survived") : result?.sum?.overrun ? t("zs.over") : t("arc.ended")}
    resultSubtitle={result?.detail ?? t("zs.overSub")}
    resultRows={result ? [
      { label: t("zs.waveReached"), value: result.max?.wave ?? 0, tone: "brand" },
      { label: t("zs.kills"), value: result.sum?.kills ?? 0, tone: "good" },
      { label: t("zs.survivalTime"), value: formatTime(result.durationMs) },
      { label: "WPM", value: result.wpm, tone: "brand" },
      { label: t("gm.accuracy"), value: `${result.accuracy}%`, tone: result.accuracy >= 95 ? "good" : "default" },
      { label: t("gm.mistakes"), value: result.mistakes, tone: result.mistakes ? "bad" : "default" },
      { label: t("arc.longestStreak"), value: result.bestStreak },
      { label: t("gm.bestCombo"), value: result.max?.combo ?? 0 },
      { label: t("zs.bosses"), value: result.sum?.bosses ?? 0 },
    ] : []}
    onStart={start} onQuit={() => game.quit()}
    keyboard={{ expected: hud.expected, onChar, onBackspace: release }}
  />;
}
