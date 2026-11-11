"use client";

import { useEffect, useRef } from "react";
import ArcadeShell from "@/components/games/arcade/ArcadeShell";
import { ActionButton, Chip, formatTime, Meter, OptionPicker, TypeLine } from "@/components/games/arcade/ArcadeParts";
import { burst, setTimer, showBanner } from "@/components/games/arcade/canvas-utils";
import { Segmented } from "@/components/games/shared/Selectors";
import { useLocale } from "@/components/shared/LocaleProvider";
import { useArcadeGame } from "@/hooks/use-arcade-game";
import { useKeyInput } from "@/hooks/use-key-input";
import { useScores, useSettings } from "@/hooks/use-stored-value";
import { playArcadeSound } from "@/lib/arcade/audio";
import { isArcadeDifficulty, type ArcadeDifficulty } from "@/lib/arcade/difficulty";
import { isUnlocked, loadoutChoice, updateArcade } from "@/lib/arcade/progress";
import { CARS, createRace, livePosition, nitroReady, PAINTS, RACE_LENGTHS, raceChar, raceFinished, raceNitro, raceOutcome, stepRace, TRACKS, TRACK_METRES, type CarId, type RaceLength, type RaceSim, type TrackId } from "@/lib/arcade/racing";
import { saveRun } from "@/lib/arcade/save";
import { bufferView, expectedChar } from "@/lib/arcade/typing-core";
import { calcAccuracy, calcWpm, type CharView } from "@/lib/typing-engine";
import type { Language } from "@/types";
import { drawCar, drawRace } from "./race-render";

const GAME = "car-racing";
const STEP_ICONS = ["🚦", "⌨️", "🔥", "🚀", "🏁"];
const PAINT_IDS = Object.keys(PAINTS);
const TRACK_ICONS: Record<TrackId, string> = { coast: "🏝️", desert: "🏜️", city: "🌃" };

type Hud = { language: Language; views: CharView[]; next: string; expected: string | null; kmh: number; position: number; timeMs: number; wpm: number; accuracy: number; combo: number; nitro: number; boosting: boolean; ready: boolean; progress: number; rivals: { color: string; progress: number }[] };
const HUD: Hud = { language: "english", views: [], next: "", expected: null, kmh: 0, position: 1, timeMs: 0, wpm: 0, accuracy: 100, combo: 0, nitro: 0, boosting: false, ready: false, progress: 0, rivals: [] };

const snapshot = (sim: RaceSim): Hud => ({
  language: sim.cfg.language,
  views: bufferView(sim.buf),
  next: sim.lines[sim.lineIdx + 1] ?? "",
  expected: expectedChar(sim.buf),
  kmh: Math.round(sim.speed * 5.8),
  position: livePosition(sim),
  timeMs: sim.elapsedMs,
  wpm: calcWpm(sim.stats.netChars, sim.elapsedMs),
  accuracy: calcAccuracy(sim.stats.correctKeys, sim.stats.totalKeys),
  combo: sim.combo,
  nitro: sim.nitro,
  boosting: sim.nitroMs > 0,
  ready: nitroReady(sim),
  progress: sim.dist / sim.trackLen,
  rivals: sim.rivals.map((r) => ({ color: r.color, progress: r.dist / sim.trackLen })),
});

/** Small picture of a car for the garage. */
function CarPreview({ car, color }: { car: CarId; color: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current, ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    ctx.clearRect(0, 0, 96, 44);
    drawCar(ctx, car, color, 8, 38, 80, 0.6);
  }, [car, color]);
  return <canvas ref={ref} width={192} height={88} className="h-11 w-24" aria-hidden="true" />;
}

export default function CarRacingGame() {
  const { t } = useLocale();
  const [{ sound }] = useSettings();
  const scores = useScores();
  const game = useArcadeGame<RaceSim, Hud>({
    game: GAME,
    initialHud: HUD,
    snapshot,
    step: stepRace,
    isOver: raceFinished,
    draw: drawRace,
    drain(sim, fx, view) {
      for (const event of sim.events) {
        if (event === "key") playArcadeSound("key", sound);
        else if (event === "wrong") {
          playArcadeSound("wrong", sound);
          setTimer(fx, "error", 220);
          setTimer(fx, "bump", 180);
        } else if (event === "nitro") {
          playArcadeSound("nitro", sound);
          showBanner(fx, t("race.nitroBanner"), undefined, 900);
        } else if (event === "nitroReady") playArcadeSound("powerup", sound);
        else if (event === "finish" && view) for (let i = 0; i < 5; i++) burst(fx, view.w * (0.2 + i * 0.15), view.h * 0.35, ["#facc15", "#38bdf8", "#f472b6", "#34d399", "#fb923c"][i], 14, 220, 260);
      }
      sim.events.length = 0;
    },
    save(sim, recorder) {
      const out = raceOutcome(sim);
      const finished = raceFinished(sim);
      playArcadeSound(out.won ? "win" : finished ? "unlock" : "lose", sound);
      if (sim.stats.totalKeys === 0) return null;
      const key = `${GAME}:${sim.cfg.language}:${sim.cfg.difficulty}:${sim.cfg.length}`;
      return saveRun({
        game: GAME, language: sim.cfg.language, difficulty: sim.cfg.difficulty, score: out.score.total, wpm: out.wpm, cpm: out.cpm, accuracy: out.accuracy, mistakes: out.mistakes,
        correctChars: out.correctChars, bestStreak: out.bestStreak, durationMs: out.timeMs, won: out.won,
        detail: finished ? `${t(`race.place${out.position}`)} · ${formatTime(out.timeMs)}` : t("race.dnf"),
        sum: { nitro: out.nitroUsed, finished: finished ? 1 : 0, winsMediumUp: out.won && sim.cfg.difficulty !== "easy" ? 1 : 0 },
      }, out.score, key, scores[key]?.best ?? 0, recorder);
    },
  });
  const { settings, store, session, hud, report, attachCanvas } = game;
  const language = settings.language;

  const saved = store.loadout["race.difficulty"];
  const difficulty: ArcadeDifficulty = isArcadeDifficulty(saved) ? saved : "easy";
  const length = loadoutChoice<RaceLength>(store, "race.length", RACE_LENGTHS, "medium");
  const track = loadoutChoice<TrackId>(store, "race.track", TRACKS, "coast", "track");
  const car = loadoutChoice<CarId>(store, "race.car", CARS, "comet", "car");
  const paint = loadoutChoice(store, "race.paint", PAINT_IDS, "red", "paint");
  const pick = (key: string) => (value: string) => updateArcade({ loadout: { [key]: value } });

  function start() {
    game.begin(createRace({ language, difficulty, length, track, car, paint, seed: (Date.now() ^ 0x9e3779b9) >>> 0 }));
  }
  function onChar(char: string) {
    game.act((sim) => {
      const expected = expectedChar(sim.buf);
      if (expected !== null) game.recorder.keystroke(sim.cfg.language, expected, char === expected);
      raceChar(sim, char);
    });
  }
  const nitro = () => game.act((sim) => void raceNitro(sim));

  useKeyInput(session.phase === "playing", hud.language, { onChar, onEscape: session.pause, onEnter: nitro });

  const result = report?.result;
  const finished = (result?.sum?.finished ?? 0) > 0;
  const khmer = hud.language === "khmer";

  return <ArcadeShell
    game={GAME} icon="🏎️" music="race" session={session} difficulty={difficulty} onDifficulty={pick("race.difficulty")} runLanguage={hud.language}
    variant={`${GAME}:${language}:${difficulty}:${length}`}
    howTo={STEP_ICONS.map((icon, i) => ({ icon, title: t(`race.s${i + 1}t`), text: t(`race.s${i + 1}`) }))}
    controls={[{ keys: t("arc.keyLetters"), text: t("race.c1") }, { keys: "Enter", text: t("race.c2") }, { keys: "Esc", text: t("arc.keyPause") }]}
    options={<>
      <Segmented label={t("race.length")} value={length} onChange={pick("race.length")} options={RACE_LENGTHS.map((l) => ({ value: l, label: `${t(`race.len.${l}`)} · ${TRACK_METRES[l]}m` }))} />
      <OptionPicker label={t("race.track")} value={track} onChange={pick("race.track")} options={TRACKS.map((id) => ({ id, label: t(`unl.track-${id}`), locked: !isUnlocked(store, `track:${id}`), how: t(`unl.track-${id}.how`), preview: <span className="text-2xl" aria-hidden="true">{TRACK_ICONS[id]}</span> }))} />
      <OptionPicker label={t("race.car")} value={car} onChange={pick("race.car")} columns={4} options={CARS.map((id) => ({ id, label: t(`unl.car-${id}`), locked: !isUnlocked(store, `car:${id}`), how: t(`unl.car-${id}.how`), preview: <CarPreview car={id} color={PAINTS[paint]} /> }))} />
      <OptionPicker label={t("race.paint")} value={paint} onChange={pick("race.paint")} columns={6} options={PAINT_IDS.map((id) => ({ id, label: t(`unl.paint-${id}`), locked: !isUnlocked(store, `paint:${id}`), how: t(`unl.paint-${id}.how`), preview: <span className="h-6 w-6 rounded-full border-2 border-white shadow" style={{ background: PAINTS[id] }} aria-hidden="true" /> }))} />
      <p className="text-xs text-mute">{t("race.fairNote")}</p>
    </>}
    hud={<>
      <Chip label={t("race.position")} value={`${hud.position} / ${hud.rivals.length + 1}`} tone={hud.position === 1 ? "gold" : "default"} />
      <Chip label={t("gm.time")} value={formatTime(hud.timeMs)} />
      <Chip label={t("gm.speed")} value={<>{hud.kmh}<span className="ml-1 text-[10px] font-semibold text-slate-300">km/h</span></>} tone={hud.boosting ? "gold" : "default"} />
      <Chip label="WPM" value={hud.wpm} />
      <Chip label={t("gm.accuracy")} value={`${hud.accuracy}%`} tone={hud.accuracy >= 95 ? "good" : hud.accuracy < 85 ? "bad" : "default"} />
      <Chip label={t("gm.combo")} value={hud.combo} tone={hud.combo >= 20 ? "good" : "default"} />
    </>}
    canvas={<canvas ref={attachCanvas} className="block h-full w-full" role="img" aria-label={t("race.canvas")} />}
    panel={<div className="space-y-3">
      <div className="relative h-5 rounded-full bg-white/10" role="progressbar" aria-label={t("race.progress")} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(hud.progress * 100)}>
        <span className="absolute right-1 top-0 text-sm leading-5" aria-hidden="true">🏁</span>
        {hud.rivals.map((r, i) => <span key={i} className="absolute top-1 h-3 w-3 -translate-x-1/2 rounded-full border border-white/70" style={{ left: `${3 + r.progress * 92}%`, background: r.color }} />)}
        <span className="absolute top-0.5 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-white shadow" style={{ left: `${3 + hud.progress * 92}%`, background: "#facc15" }} />
      </div>
      <div className="flex items-center gap-3">
        <Meter label={t("race.nitro")} value={hud.boosting ? 1 : hud.nitro / 100} text={hud.boosting ? t("race.boosting") : hud.ready ? t("race.ready") : undefined} color={hud.boosting ? "#f97316" : "linear-gradient(90deg,#38bdf8,#a855f7)"} pulse={hud.ready} />
        <ActionButton label={`🚀 ${t("race.nitro")}`} hint="Enter" ready={hud.ready} onClick={nitro} color="#7c3aed" />
      </div>
      <div className="min-h-20 rounded-2xl bg-black/30 px-4 py-3 text-center" aria-live="off">
        <TypeLine views={hud.views} khmer={khmer} className={khmer ? "text-2xl sm:text-3xl" : "text-xl sm:text-3xl"} />
        <p lang={khmer ? "km" : "en"} className={`mt-1 truncate text-sm text-slate-500 ${khmer ? "font-khmer" : ""}`}>{hud.next}</p>
      </div>
    </div>}
    report={report}
    resultIcon={result?.won ? "🏆" : finished ? "🏁" : "🚧"}
    resultTitle={result?.won ? t("race.won") : finished ? t("race.finished") : t("race.dnf")}
    resultSubtitle={result?.detail ?? t("race.dnfSub")}
    resultRows={result ? [
      { label: t("race.finishTime"), value: formatTime(result.durationMs), tone: "brand" },
      { label: "WPM", value: result.wpm, tone: "brand" },
      { label: "CPM", value: result.cpm },
      { label: t("gm.accuracy"), value: `${result.accuracy}%`, tone: result.accuracy >= 95 ? "good" : "default" },
      { label: t("gm.mistakes"), value: result.mistakes, tone: result.mistakes ? "bad" : "default" },
      { label: t("gm.correctChars"), value: result.correctChars },
      { label: t("arc.longestStreak"), value: result.bestStreak },
      { label: t("race.nitroUsed"), value: result.sum?.nitro ?? 0 },
      { label: t("arc.finalScore"), value: result.score.toLocaleString("en-US"), tone: "brand" },
    ] : []}
    onStart={start} onQuit={() => game.quit()}
    keyboard={{ expected: hud.expected, onChar, onBackspace: () => undefined }}
  />;
}
