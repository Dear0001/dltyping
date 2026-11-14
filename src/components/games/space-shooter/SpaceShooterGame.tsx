"use client";

import { useRef, useState } from "react";
import ArcadeShell from "@/components/games/arcade/ArcadeShell";
import { Chip, formatTime, TypeLine } from "@/components/games/arcade/ArcadeParts";
import { burst, floatText, ring, setTimer, shoot, showBanner } from "@/components/games/arcade/canvas-utils";
import { Segmented } from "@/components/games/shared/Selectors";
import { useLocale } from "@/components/shared/LocaleProvider";
import { SPACE_TOPICS, type SpaceTopic } from "@/data/space-content";
import { useArcadeGame } from "@/hooks/use-arcade-game";
import { useKeyInput } from "@/hooks/use-key-input";
import { useScores, useSettings } from "@/hooks/use-stored-value";
import { playArcadeSound, type ArcadeSound } from "@/lib/arcade/audio";
import { isArcadeDifficulty, type ArcadeDifficulty } from "@/lib/arcade/difficulty";
import { loadoutChoice, updateArcade } from "@/lib/arcade/progress";
import { saveRun } from "@/lib/arcade/save";
import {
  createSpace, DEFENSE_Y, ENEMY_KINDS, findBoss, findTarget, MAX_POWERS, PLAYER, POWER_KINDS, POWER_MS, SPACE_MODES, spaceBackspace, spaceChar, spaceOutcome, spacePower, stepSpace, TIME_LIMITS, WAVE_TARGETS,
  elapsedMs, finalWave, type EnemyKind, type PowerKind, type SpaceConfig, type SpaceMode, type SpaceOutcome, type SpaceSim,
} from "@/lib/arcade/space";
import { bufferProgress, bufferView, expectedChar } from "@/lib/arcade/typing-core";
import { calcAccuracy, calcWpm, type CharView } from "@/lib/typing-engine";
import type { Language } from "@/types";
import { drawSpace } from "./space-render";

const GAME = "space-shooter";
const STEP_ICONS = ["🛸", "🎯", "🔫", "🛡️", "⚡"];
const MODE_ICONS: Record<SpaceMode, string> = { survival: "♾️", time: "⏱️", waves: "🌊", accuracy: "🎯" };
const TOPIC_ICONS: Record<SpaceTopic, string> = { space: "🪐", science: "🔬", general: "📚", mixed: "🎲" };
export const POWER_ICONS: Record<PowerKind, string> = { shield: "🛡️", rapid: "🔥", laser: "🔆", emp: "💥", slow: "🐢", repair: "🔧", multi: "🎆" };
const POWER_SOUNDS: Record<PowerKind, ArcadeSound> = { shield: "shield", rapid: "powerup", laser: "zap", emp: "explode", slow: "ice", repair: "powerup", multi: "laser" };
const ENEMY_ICONS: Record<EnemyKind, string> = { scout: "🛸", speed: "✈️", armored: "🛡️", bomber: "💣", elite: "👾", stealth: "👻", boss: "🚀" };
/** 1-3 use a power-up. The Khmer digits are what the same keys type on the NiDA layout. Words never contain digits. */
const POWER_KEYS: Record<string, number> = { "1": 0, "2": 1, "3": 2, "១": 0, "២": 1, "៣": 2 };

type Verify = { status: "guest" | "unavailable" | "pending" | "verified" | "rejected"; score?: number };
type Run = { runId: string | null; status: Verify["status"] };

type Hud = {
  language: Language; target: CharView[] | null; progress: number; expected: string | null; hp: number; maxHp: number; wave: number; resting: boolean; kills: number; points: number;
  combo: number; timeMs: number; timeLeft: number | null; accuracy: number; wpm: number; powers: PowerKind[]; shieldMs: number; rapidMs: number; slowMs: number; boss: boolean;
};
const HUD: Hud = { language: "english", target: null, progress: 0, expected: null, hp: 100, maxHp: 100, wave: 0, resting: true, kills: 0, points: 0, combo: 0, timeMs: 0, timeLeft: null, accuracy: 100, wpm: 0, powers: [], shieldMs: 0, rapidMs: 0, slowMs: 0, boss: false };

function snapshot(sim: SpaceSim): Hud {
  const target = findTarget(sim);
  const ms = elapsedMs(sim);
  return {
    language: sim.cfg.language, target: target ? bufferView(target.buf) : null, progress: target ? bufferProgress(target.buf) : 0, expected: target ? expectedChar(target.buf) : null,
    hp: sim.hp, maxHp: sim.maxHp, wave: sim.wave, resting: sim.breakMs > 0, kills: sim.kills, points: sim.points, combo: sim.combo, timeMs: ms,
    timeLeft: sim.cfg.mode === "time" ? Math.max(0, sim.cfg.timeLimit * 1000 - ms) : null, accuracy: calcAccuracy(sim.stats.correctKeys, sim.stats.totalKeys),
    wpm: calcWpm(sim.stats.netChars, ms), powers: [...sim.powers], shieldMs: sim.shieldMs, rapidMs: sim.rapidMs, slowMs: sim.slowMs, boss: findBoss(sim) !== null,
  };
}

async function startRun(setup: Omit<SpaceConfig, "seed">): Promise<{ run: Run; seed: number }> {
  const local = { seed: (Date.now() ^ 0x2f6b9c1d) >>> 0 };
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 2500);
  try {
    const response = await fetch("/api/arcade/runs", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ game: GAME, setup }), signal: controller.signal });
    if (response.status === 401) return { run: { runId: null, status: "guest" }, ...local };
    if (!response.ok) return { run: { runId: null, status: "unavailable" }, ...local };
    const data = (await response.json()) as { runId: string; seed: number };
    return { run: { runId: data.runId, status: "pending" }, seed: data.seed };
  } catch {
    return { run: { runId: null, status: "unavailable" }, ...local };
  } finally {
    window.clearTimeout(timeout);
  }
}

/** Bar for the performance summary. */
function PerfBar({ label, value, text, color }: { label: string; value: number; text: string; color: string }) {
  return <div>
    <div className="mb-1 flex justify-between text-xs font-semibold"><span className="text-mute">{label}</span><span className="tabular-nums text-navy">{text}</span></div>
    <div className="h-2.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full" style={{ width: `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`, background: color }} /></div>
  </div>;
}

export default function SpaceShooterGame() {
  const { t } = useLocale();
  const [{ sound }] = useSettings();
  const scores = useScores();
  const [starting, setStarting] = useState(false);
  const [verify, setVerify] = useState<Verify>({ status: "guest" });
  const [outcome, setOutcome] = useState<SpaceOutcome | null>(null);
  const runRef = useRef<Run>({ runId: null, status: "guest" });

  async function submit(sim: SpaceSim, run: Run) {
    if (!run.runId) return setVerify({ status: run.status });
    setVerify({ status: "pending" });
    try {
      const response = await fetch(`/api/arcade/runs/${run.runId}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ticks: sim.tick, log: sim.log }) });
      const data = (await response.json().catch(() => ({}))) as { status?: string; result?: { score: number } };
      if (response.ok && data.status === "verified" && data.result) setVerify({ status: "verified", score: data.result.score });
      else setVerify({ status: response.status === 422 ? "rejected" : "unavailable" });
    } catch {
      setVerify({ status: "unavailable" });
    }
  }

  const game = useArcadeGame<SpaceSim, Hud>({
    game: GAME,
    initialHud: HUD,
    snapshot,
    step: stepSpace,
    isOver: (sim) => sim.over,
    draw: drawSpace,
    drain(sim, fx) {
      for (const event of sim.events) {
        switch (event.type) {
          case "key": playArcadeSound("key", sound); break;
          case "wrong": playArcadeSound("wrong", sound); setTimer(fx, "wrong", 260); break;
          case "lock": playArcadeSound("hit", sound); break;
          case "fire": playArcadeSound("laser", sound); setTimer(fx, "muzzle", 90); break;
          case "wave":
            playArcadeSound(event.boss ? "warning" : "wave", sound);
            showBanner(fx, t("ss.waveBanner", { n: event.wave }), event.boss ? t("ss.bossWarning") : undefined, event.boss ? 2400 : 1600);
            break;
          case "bossIntro": playArcadeSound("boss", sound); setTimer(fx, "shake", 300); break;
          case "hit": playArcadeSound("hit", sound); burst(fx, event.x, event.y, event.shield ? "#7dd3fc" : "#fde68a", 10, 160); break;
          case "kill": {
            const boss = event.kind === "boss";
            playArcadeSound(boss ? "explode" : "kill", sound);
            burst(fx, event.x, event.y, boss ? "#e879f9" : "#fdba74", boss ? 60 : 18, boss ? 380 : 220);
            if (boss) burst(fx, event.x, event.y, "#fef08a", 40, 260);
            floatText(fx, event.x, event.y - 24, `+${event.points}`, "#fde68a", boss ? 30 : 20);
            if (boss) setTimer(fx, "shake", 400);
            break;
          }
          case "breach": setTimer(fx, "breach", 600); burst(fx, event.x, DEFENSE_Y, "#f87171", 14, 200); break;
          case "hurt": playArcadeSound("hurt", sound); setTimer(fx, "hurt", 400); setTimer(fx, "shake", 220); floatText(fx, PLAYER.x, PLAYER.y - 60, `-${event.damage}`, "#fca5a5", 24); break;
          case "blocked": playArcadeSound("block", sound); ring(fx, PLAYER.x, PLAYER.y, 70, "#a5f3fc", 400); floatText(fx, PLAYER.x, PLAYER.y - 64, t("ss.blocked"), "#a5f3fc", 18); break;
          case "bomb": playArcadeSound("spell", sound); break;
          case "combo": playArcadeSound("powerup", sound); showBanner(fx, t("ss.comboBanner", { n: event.combo }), undefined, 1100); break;
          case "power":
            playArcadeSound(POWER_SOUNDS[event.kind], sound);
            if (event.kind === "laser" && event.x !== undefined) shoot(fx, "laser", PLAYER.x, PLAYER.y - 30, event.x, event.y!, "#f0abfc", 450);
            if (event.kind === "emp" && event.x !== undefined) ring(fx, event.x, event.y!, 230, "#a5b4fc", 650);
            floatText(fx, PLAYER.x, PLAYER.y - 70, `${POWER_ICONS[event.kind]} ${t(`ss.power.${event.kind}`)}`, "#e0f2fe", 18);
            break;
          case "gain": playArcadeSound("unlock", sound); floatText(fx, PLAYER.x, PLAYER.y - 90, `${POWER_ICONS[event.kind]} ${t("ss.newPower")}`, "#bbf7d0", 18); break;
          case "noPower": playArcadeSound("wrong", sound); break;
          case "waveClear": playArcadeSound("wave", sound); showBanner(fx, t("ss.waveClear", { n: sim.wave }), undefined, 1600); break;
          case "bossDown": showBanner(fx, t("ss.bossDown"), undefined, 1800); break;
          case "destroyed":
            playArcadeSound("explode", sound);
            burst(fx, PLAYER.x, PLAYER.y, "#fb923c", 70, 340);
            burst(fx, PLAYER.x, PLAYER.y, "#e2e8f0", 30, 200);
            setTimer(fx, "shake", 500);
            break;
          case "victory": showBanner(fx, sim.cfg.mode === "time" ? t("ss.timeWin") : t("ss.victory"), undefined, 1300); break;
          case "release": break;
        }
      }
      sim.events.length = 0;
    },
    save(sim, recorder) {
      const out = spaceOutcome(sim);
      setOutcome(out);
      playArcadeSound(out.won ? "win" : "lose", sound);
      const run = runRef.current;
      if (sim.stats.totalKeys === 0) {
        setVerify({ status: run.status === "pending" ? "unavailable" : run.status });
        return null;
      }
      void submit(sim, run);
      const key = `${GAME}:${sim.cfg.language}:${sim.cfg.difficulty}:${sim.cfg.mode}`;
      return saveRun({
        game: GAME, language: sim.cfg.language, difficulty: sim.cfg.difficulty, score: out.score.total, wpm: out.wpm, cpm: out.cpm, accuracy: out.accuracy, mistakes: out.mistakes,
        correctChars: out.correctChars, bestStreak: out.bestStreak, durationMs: out.timeMs, won: out.won, detail: t("ss.detail", { n: out.wave, k: out.kills }),
        sum: { kills: out.kills, bosses: out.bosses, powers: out.powersUsed },
        max: { wave: out.wave, combo: out.bestCombo, survivalMs: Math.round(out.timeMs) },
      }, out.score, key, scores[key]?.best ?? 0, recorder);
    },
  });
  const { settings, store, session, hud, report, attachCanvas } = game;
  const language = settings.language;

  const saved = store.loadout["space.difficulty"];
  const difficulty: ArcadeDifficulty = isArcadeDifficulty(saved) ? saved : "easy";
  const mode = loadoutChoice<SpaceMode>(store, "space.mode", SPACE_MODES, "survival");
  const topic = loadoutChoice<SpaceTopic>(store, "space.topic", SPACE_TOPICS, "space");
  const timeLimit = Number(loadoutChoice(store, "space.time", TIME_LIMITS.map(String), "120"));
  const waveTarget = Number(loadoutChoice(store, "space.waves", WAVE_TARGETS.map(String), "10"));
  const pick = (key: string) => (value: string | number) => updateArcade({ loadout: { [key]: String(value) } });

  async function start() {
    if (starting) return;
    setStarting(true);
    const setup = { language, difficulty, mode, topic, timeLimit, waveTarget };
    const { run, seed } = await startRun(setup);
    runRef.current = run;
    setOutcome(null);
    setVerify({ status: run.status });
    setStarting(false);
    game.begin(createSpace({ ...setup, seed }));
  }

  function onChar(char: string) {
    if (char in POWER_KEYS) return firePower(POWER_KEYS[char]);
    game.act((sim) => {
      const target = findTarget(sim);
      const expected = target ? expectedChar(target.buf) : null;
      spaceChar(sim, char);
      if (expected !== null) game.recorder.keystroke(sim.cfg.language, expected, char === expected);
      else if (findTarget(sim) || sim.events.some((e) => e.type === "fire")) game.recorder.keystroke(sim.cfg.language, char, true);
    });
  }
  function firePower(slot: number) {
    game.act((sim) => void spacePower(sim, slot));
  }
  const onBackspace = () => game.act(spaceBackspace);

  useKeyInput(session.phase === "playing", hud.language, { onChar, onBackspace, onEscape: session.pause, onEnter: () => firePower(0) });

  const khmer = hud.language === "khmer";
  const result = report?.result;
  const last = finalWave({ mode, waveTarget });
  const effects = ([["shield", hud.shieldMs], ["rapid", hud.rapidMs], ["slow", hud.slowMs]] as const).filter(([, ms]) => ms > 0);
  const verifyText = verify.status === "verified" ? t("ss.verified", { score: (verify.score ?? 0).toLocaleString("en-US") }) : t(`ss.${verify.status === "pending" ? "verifying" : verify.status}`);

  return <ArcadeShell
    game={GAME} icon="🚀" music="space" session={session} difficulty={difficulty} onDifficulty={pick("space.difficulty")} runLanguage={hud.language} starting={starting}
    variant={`${GAME}:${language}:${difficulty}:${mode}`}
    howTo={STEP_ICONS.map((icon, i) => ({ icon, title: t(`ss.s${i + 1}t`), text: t(`ss.s${i + 1}`) }))}
    controls={[{ keys: t("arc.keyLetters"), text: t("ss.c1") }, { keys: "Backspace", text: t("ss.c2") }, { keys: "1 · 2 · 3", text: t("ss.c3") }, { keys: "Enter", text: t("ss.cEnter") }, { keys: "Esc", text: t("arc.keyPause") }]}
    options={<>
      <div>
        <div className="mb-1.5 text-xs font-bold uppercase tracking-wider text-mute" id="ss-mode">{t("ss.mode")}</div>
        <div role="radiogroup" aria-labelledby="ss-mode" className="grid grid-cols-2 gap-1.5">
          {SPACE_MODES.map((m) => <button key={m} type="button" role="radio" aria-checked={m === mode} onClick={() => pick("space.mode")(m)}
            className={`flex min-w-0 items-center gap-2 rounded-xl border-2 px-3 py-2 text-left text-sm font-bold leading-tight transition focus-visible:outline-2 focus-visible:outline-brand ${m === mode ? "border-brand bg-blue-50 text-brand" : "border-slate-200 bg-white text-navy hover:border-brand"}`}>
            <span aria-hidden="true">{MODE_ICONS[m]}</span><span>{t(`ss.mode.${m}`)}</span>
          </button>)}
        </div>
        <p className="mt-1.5 text-xs text-mute">{t(`ss.mode.${mode}.d`)}</p>
      </div>
      {mode === "time" && <Segmented label={t("ss.timeLimit")} value={timeLimit} onChange={pick("space.time")} options={TIME_LIMITS.map((s) => ({ value: s as number, label: t("ss.nMin", { n: s / 60 }) }))} />}
      {mode === "waves" && <Segmented label={t("ss.waveTarget")} value={waveTarget} onChange={pick("space.waves")} options={WAVE_TARGETS.map((n) => ({ value: n as number, label: t("ss.nWaves", { n }) }))} />}
      <div>
        <div className="mb-1.5 text-xs font-bold uppercase tracking-wider text-mute" id="ss-topic">{t("ss.topic")}</div>
        <div role="radiogroup" aria-labelledby="ss-topic" className="grid grid-cols-2 gap-1.5">
          {SPACE_TOPICS.map((id) => <button key={id} type="button" role="radio" aria-checked={id === topic} onClick={() => pick("space.topic")(id)}
            className={`flex min-w-0 items-center gap-2 rounded-xl border-2 px-3 py-2 text-left text-sm font-bold leading-tight transition focus-visible:outline-2 focus-visible:outline-brand ${id === topic ? "border-brand bg-blue-50 text-brand" : "border-slate-200 bg-white text-navy hover:border-brand"}`}>
            <span className="text-lg" aria-hidden="true">{TOPIC_ICONS[id]}</span><span>{t(`ss.topic.${id}`)}</span>
          </button>)}
        </div>
      </div>
    </>}
    guide={<>
      <details className="group rounded-2xl border border-slate-200 p-3 text-xs text-slate-600">
        <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold text-navy">
          <span><span aria-hidden="true">👾 </span>{t("ss.enemyGuide", { n: Object.keys(ENEMY_KINDS).length })}</span><span className="text-mute transition group-open:rotate-180" aria-hidden="true">⌄</span>
        </summary>
        <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {(Object.keys(ENEMY_KINDS) as EnemyKind[]).map((k) => <li key={k} className="flex gap-2 rounded-xl bg-slate-50 px-2.5 py-2"><span className="text-lg" aria-hidden="true">{ENEMY_ICONS[k]}</span><span><strong className="block text-navy">{t(`ss.enemy.${k}`)}</strong>{t(`ss.enemy.${k}.d`)}</span></li>)}
        </ul>
      </details>
      <details className="group rounded-2xl border border-slate-200 p-3 text-xs text-slate-600">
        <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold text-navy">
          <span><span aria-hidden="true">⚡ </span>{t("ss.powerGuide", { n: POWER_KINDS.length })}</span><span className="text-mute transition group-open:rotate-180" aria-hidden="true">⌄</span>
        </summary>
        <p className="mt-2">{t("ss.noPowers")}</p>
        <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {POWER_KINDS.map((k) => <li key={k} className="flex gap-2 rounded-xl bg-blue-50 px-2.5 py-2"><span className="text-lg" aria-hidden="true">{POWER_ICONS[k]}</span><span><strong className="block text-navy">{t(`ss.power.${k}`)}</strong>{t(`ss.power.${k}.d`)}</span></li>)}
        </ul>
      </details>
    </>}
    hud={<>
      <Chip label={t("gm.score")} value={hud.points.toLocaleString("en-US")} />
      <Chip label={hud.boss ? `🚀 ${t("ss.bossWave")}` : t("ss.wave")} value={hud.wave ? (last ? `${hud.wave}/${last}` : hud.wave) : "—"} tone={hud.boss ? "gold" : "default"} />
      <div className={`min-w-0 rounded-xl px-2.5 py-1.5 sm:px-3 ${hud.hp <= hud.maxHp * 0.25 ? "arc-pulse bg-red-500/25" : "bg-white/10"}`}>
        <div className="flex justify-between gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-300"><span className="truncate">♥ {t("ss.health")}</span>{hud.shieldMs > 0 && <span aria-label={t("ss.power.shield")}>🛡️</span>}</div>
        <div className="flex items-baseline gap-1"><span className={`text-base font-extrabold tabular-nums sm:text-lg ${hud.hp <= hud.maxHp * 0.3 ? "text-red-300" : "text-emerald-300"}`}>{hud.hp}</span><span className="text-[10px] text-slate-400">/{hud.maxHp}</span></div>
        <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-white/15" role="progressbar" aria-label={t("ss.health")} aria-valuenow={hud.hp} aria-valuemin={0} aria-valuemax={hud.maxHp}>
          <div className="h-full rounded-full transition-[width] duration-150" style={{ width: `${Math.max(0, Math.min(100, (hud.hp / hud.maxHp) * 100))}%`, background: hud.hp > hud.maxHp * 0.5 ? "#22c55e" : hud.hp > hud.maxHp * 0.25 ? "#f59e0b" : "#ef4444" }} />
        </div>
      </div>
      <Chip label={hud.timeLeft !== null ? t("ss.timeLeft") : t("gm.time")} value={formatTime(hud.timeLeft ?? hud.timeMs)} tone={hud.timeLeft !== null && hud.timeLeft < 10000 ? "bad" : "default"} />
      <Chip label={t("gm.combo")} value={hud.combo >= 5 ? `🔥 ×${hud.combo}` : `×${hud.combo}`} tone={hud.combo >= 10 ? "gold" : hud.combo >= 5 ? "good" : "default"} />
      <Chip label={t("ss.destroyed")} value={hud.kills} />
    </>}
    canvas={<canvas ref={attachCanvas} className="block h-full w-full" role="img" aria-label={t("ss.canvas")} />}
    stageClass="arc-stage-space"
    panel={<div className="space-y-2.5">
      <div className="grid gap-2.5 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div className="flex min-h-14 items-center gap-3 rounded-2xl bg-black/30 px-4 py-2">
          {hud.target
            ? <>
                <span className="hidden flex-none text-[10px] font-bold uppercase tracking-wider text-amber-300 sm:inline">🎯 {t("ss.lockedOn")}</span>
                <div className="min-w-0 flex-1 text-center">
                  <TypeLine views={hud.target} khmer={khmer} className="text-2xl sm:text-3xl" />
                  <div className="mx-auto mt-1.5 h-1.5 max-w-xs overflow-hidden rounded-full bg-white/15" role="progressbar" aria-label={t("gm.progress")} aria-valuenow={Math.round(hud.progress * 100)} aria-valuemin={0} aria-valuemax={100}><div className="h-full bg-amber-300" style={{ width: `${hud.progress * 100}%` }} /></div>
                </div>
                <button type="button" onClick={onBackspace} className="flex-none rounded-lg bg-white/10 px-2 py-1 text-xs font-bold text-slate-200 hover:bg-white/20">⌫ {t("ss.letGo")}</button>
              </>
            : <p className="w-full text-center text-sm text-slate-300">{hud.resting ? t("ss.getReady") : t("ss.pickTarget")}</p>}
        </div>
        <div className="grid grid-cols-3 gap-1.5" role="group" aria-label={t("ss.powers")}>
          {Array.from({ length: MAX_POWERS }, (_, slot) => {
            const kind = hud.powers[slot];
            return <button key={slot} type="button" disabled={!kind || session.phase !== "playing"} onClick={() => firePower(slot)} title={kind ? t(`ss.power.${kind}.d`) : t("ss.noPowers")} aria-label={kind ? `${slot + 1}: ${t(`ss.power.${kind}`)}` : `${slot + 1}: ${t("ss.noPowers")}`}
              className={`flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl border px-1.5 py-1.5 text-[11px] font-bold leading-tight transition ${kind ? "border-sky-400/70 bg-sky-500/20 text-white shadow-[0_0_12px_rgba(56,189,248,.35)] hover:bg-sky-500/35" : "border-dashed border-white/15 bg-white/5 text-slate-500"}`}>
              <span className="flex items-center gap-1"><kbd className="rounded bg-black/40 px-1.5 text-[10px]">{slot + 1}</kbd><span aria-hidden="true">{kind ? POWER_ICONS[kind] : "·"}</span></span>
              <span className="max-w-full truncate">{kind ? t(`ss.power.${kind}`) : "—"}</span>
            </button>;
          })}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        {effects.map(([kind, ms]) => <span key={kind} className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-bold text-sky-200">{POWER_ICONS[kind]} {t(`ss.power.${kind}`)} {(ms / 1000).toFixed(1)}s
          <span className="mt-1 block h-1 overflow-hidden rounded-full bg-white/15"><span className="block h-full bg-sky-300" style={{ width: `${(ms / POWER_MS[kind]) * 100}%` }} /></span></span>)}
        <span className="ml-auto rounded-full bg-white/10 px-2.5 py-1 text-xs font-bold tabular-nums text-slate-200">{hud.wpm} WPM · {hud.accuracy}%</span>
        {hud.powers.length === 0 && <span className="w-full text-[11px] text-slate-400">{t("ss.noPowers")}</span>}
      </div>
    </div>}
    pauseStats={[
      { label: t("gm.score"), value: hud.points.toLocaleString("en-US") },
      { label: t("ss.wave"), value: hud.wave ? (last ? `${hud.wave}/${last}` : hud.wave) : "—" },
      { label: "WPM", value: hud.wpm },
      { label: t("gm.accuracy"), value: `${hud.accuracy}%` },
      { label: t("ss.shipsDestroyed"), value: hud.kills },
      { label: t("ss.health"), value: `${hud.hp}/${hud.maxHp}` },
    ]}
    resultHighlights={outcome ? [
      { label: t("arc.finalScore"), value: outcome.score.total.toLocaleString("en-US"), icon: "🏆", tone: "brand" },
      { label: t("ss.shipsDestroyed"), value: outcome.kills, icon: "💥", tone: "good" },
      { label: "WPM", value: outcome.wpm, icon: "⚡", tone: "brand" },
      { label: t("gm.accuracy"), value: `${outcome.accuracy}%`, icon: "🎯", tone: outcome.accuracy >= 95 ? "good" : outcome.accuracy < 80 ? "bad" : "default" },
      { label: t("ss.waveReached"), value: outcome.wave, icon: "🌊" },
    ] : undefined}
    report={report}
    resultIcon={result?.won ? "🏆" : outcome && outcome.hpLeft <= 0 ? "💥" : "🛰️"}
    resultTitle={result?.won ? (mode === "time" ? t("ss.timeWin") : t("ss.victory")) : outcome && outcome.hpLeft <= 0 ? t("ss.lost") : t("ss.ended")}
    resultSubtitle={result?.detail ?? (outcome ? t("ss.detail", { n: outcome.wave, k: outcome.kills }) : t("ss.ended"))}
    resultRows={outcome ? [
      { label: t("arc.finalScore"), value: outcome.score.total.toLocaleString("en-US"), tone: "brand" },
      { label: t("ss.waveReached"), value: outcome.wave, tone: "brand" },
      { label: t("ss.shipsDestroyed"), value: outcome.kills, tone: "good" },
      { label: t("ss.bosses"), value: outcome.bosses },
      { label: "WPM", value: outcome.wpm, tone: "brand" },
      { label: "CPM", value: outcome.cpm },
      { label: t("gm.accuracy"), value: `${outcome.accuracy}%`, tone: outcome.accuracy >= 95 ? "good" : "default" },
      { label: t("ss.keysTyped"), value: outcome.totalKeys },
      { label: t("ss.correctKeys"), value: outcome.totalKeys - outcome.mistakes, tone: "good" },
      { label: t("ss.wrongKeys"), value: outcome.mistakes, tone: outcome.mistakes ? "bad" : "default" },
      { label: t("ss.reaction"), value: outcome.avgReactionMs ? `${(outcome.avgReactionMs / 1000).toFixed(2)}s` : "—" },
      { label: t("gm.bestCombo"), value: outcome.bestCombo },
      { label: t("ss.survival"), value: formatTime(outcome.timeMs) },
      { label: t("ss.powersUsed"), value: outcome.powersUsed },
      { label: t("arc.longestStreak"), value: outcome.bestStreak },
    ] : []}
    resultExtra={outcome && <>
      <div className="space-y-2.5 rounded-2xl bg-slate-50 p-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-mute">{t("ss.summary")}</h2>
        <PerfBar label={t("gm.accuracy")} value={outcome.accuracy / 100} text={`${outcome.accuracy}%`} color="#22c55e" />
        <PerfBar label="WPM" value={outcome.wpm / 80} text={`${outcome.wpm}`} color="#2563eb" />
        <PerfBar label={t("ss.reaction")} value={outcome.avgReactionMs ? 1 - outcome.avgReactionMs / 4000 : 0} text={outcome.avgReactionMs ? `${(outcome.avgReactionMs / 1000).toFixed(2)}s` : "—"} color="#a855f7" />
        <PerfBar label={t("ss.health")} value={outcome.hpLeft / Math.max(1, hud.maxHp)} text={`${outcome.hpLeft}`} color="#f59e0b" />
      </div>
      <p role="status" className={`rounded-xl px-4 py-2.5 text-center text-sm font-semibold ${verify.status === "verified" ? "bg-emerald-50 text-good" : verify.status === "rejected" ? "bg-red-50 text-bad" : "bg-slate-100 text-mute"}`}>{verifyText}</p>
    </>}
    onStart={() => void start()} onQuit={() => game.quit()}
    keyboard={{ expected: hud.expected, onChar, onBackspace }}
  />;
}
