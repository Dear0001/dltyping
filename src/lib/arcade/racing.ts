// Typing Car Racing simulation. Pure game logic: the React component feeds it
// keystrokes and time, and a canvas renderer draws the state.
import { buildLines, createRng, rand, type Rng } from "@/lib/arcade/content";
import { byDifficulty, languagePace, type ArcadeDifficulty } from "@/lib/arcade/difficulty";
import { scoreBreakdown, type ScoreBreakdown } from "@/lib/arcade/scoring";
import { createBuffer, createStats, summarize, typeChar, type TypeBuffer, type TypingStats, type TypingSummary } from "@/lib/arcade/typing-core";
import type { Language } from "@/types";

export type RaceLength = "short" | "medium" | "long";
export const RACE_LENGTHS: readonly RaceLength[] = ["short", "medium", "long"];
/** Track length in metres. Every correct character is worth about METRES_PER_CHAR. */
export const TRACK_METRES: Record<RaceLength, number> = { short: 500, medium: 1000, long: 1800 };

export const TRACKS = ["coast", "desert", "city"] as const;
export type TrackId = (typeof TRACKS)[number];
export const CARS = ["comet", "falcon", "viper", "titan"] as const;
export type CarId = (typeof CARS)[number];
/** Paint id → body colour. */
export const PAINTS: Record<string, string> = { red: "#ef4444", blue: "#3b82f6", green: "#22c55e", gold: "#f59e0b", midnight: "#312e81", neon: "#d946ef" };

// Physics: each correct key is a push (KICK), drag bleeds speed away, so the car
// keeps moving only while the player keeps typing. Distance per key = KICK / DRAG.
const KICK = 3;
const DRAG = 0.6;
export const METRES_PER_CHAR = KICK / DRAG;
const MAX_SPEED = 62;
const NITRO_MS = 3500;
const NITRO_KICK = 1.9;
const NITRO_BURST = 12;
const NITRO_MAX_SPEED = 90;
const ERROR_SLOWDOWN = 0.75;

export type Rival = { id: number; car: CarId; color: string; cps: number; phase: number; dist: number; speed: number; finishedAt: number | null };
export type RaceEvent = "key" | "wrong" | "nitro" | "nitroReady" | "line" | "finish";

export type RaceConfig = { language: Language; difficulty: ArcadeDifficulty; length: RaceLength; track: TrackId; car: CarId; paint: string; seed: number };

export type RaceSim = {
  cfg: RaceConfig;
  rng: Rng;
  trackLen: number;
  lines: string[];
  lineIdx: number;
  buf: TypeBuffer;
  stats: TypingStats;
  elapsedMs: number;
  dist: number;
  speed: number;
  /** 0-100 */
  nitro: number;
  nitroMs: number;
  nitroUsed: number;
  combo: number;
  rivals: Rival[];
  finishedAt: number | null;
  /** 1 = first. Set when the player crosses the line. */
  position: number | null;
  events: RaceEvent[];
};

const RIVAL_LOOKS: { car: CarId; color: string }[] = [{ car: "falcon", color: "#f97316" }, { car: "viper", color: "#14b8a6" }, { car: "comet", color: "#a855f7" }];
/** Typing speed (WPM) each computer car drives at, slowest first. */
const RIVAL_WPM: readonly [number[], number[], number[], number[]] = [[10, 15, 21], [22, 29, 37], [36, 45, 55], [55, 68, 82]];

export function createRace(cfg: RaceConfig): RaceSim {
  const rng = createRng(cfg.seed);
  const trackLen = TRACK_METRES[cfg.length];
  // Enough text to reach the line even with slowdowns; more is generated if it runs out.
  const lines = buildLines(rng, cfg.language, cfg.difficulty, Math.ceil((trackLen / METRES_PER_CHAR) * 1.3));
  const pace = languagePace(cfg.language);
  const rivals = byDifficulty(cfg.difficulty, RIVAL_WPM).map((wpm, i) => ({
    id: i, ...RIVAL_LOOKS[i], cps: ((wpm * 5) / 60) * pace * (0.94 + rand(rng) * 0.12), phase: rand(rng) * Math.PI * 2, dist: 0, speed: 0, finishedAt: null,
  }));
  return { cfg, rng, trackLen, lines, lineIdx: 0, buf: createBuffer(lines[0], cfg.language, "strict"), stats: createStats(), elapsedMs: 0, dist: 0, speed: 0, nitro: 0, nitroMs: 0, nitroUsed: 0, combo: 0, rivals, finishedAt: null, position: null, events: [] };
}

export const raceFinished = (sim: RaceSim) => sim.finishedAt !== null;
export const nitroReady = (sim: RaceSim) => sim.nitro >= 100 && sim.nitroMs <= 0;
/** Current place among all cars, 1 = leading. */
export function livePosition(sim: RaceSim) {
  if (sim.position !== null) return sim.position;
  return 1 + sim.rivals.filter((r) => r.finishedAt !== null || r.dist > sim.dist).length;
}

export function raceChar(sim: RaceSim, char: string) {
  if (raceFinished(sim)) return;
  const result = typeChar(sim.buf, char, sim.stats, sim.elapsedMs);
  if (result === "blocked") return;
  if (result === "wrong") {
    sim.speed *= ERROR_SLOWDOWN;
    sim.combo = 0;
    sim.nitro = Math.max(0, sim.nitro - 8);
    sim.events.push("wrong");
    return;
  }
  const boosting = sim.nitroMs > 0;
  sim.speed = Math.min(boosting ? NITRO_MAX_SPEED : MAX_SPEED, sim.speed + KICK * (boosting ? NITRO_KICK : 1));
  sim.combo++;
  if (!boosting && sim.nitro < 100) {
    // A longer combo charges the boost faster.
    sim.nitro = Math.min(100, sim.nitro + 1.1 * (1 + Math.min(sim.combo, 40) / 40));
    if (sim.nitro >= 100) sim.events.push("nitroReady");
  }
  sim.events.push("key");
  if (result === "complete") {
    sim.lineIdx++;
    if (sim.lineIdx >= sim.lines.length) sim.lines.push(...buildLines(sim.rng, sim.cfg.language, sim.cfg.difficulty, 120));
    sim.buf = createBuffer(sim.lines[sim.lineIdx], sim.cfg.language, "strict");
    sim.events.push("line");
  }
}

/** Fires the nitro boost if it is fully charged. Returns whether it fired. */
export function raceNitro(sim: RaceSim) {
  if (raceFinished(sim) || !nitroReady(sim)) return false;
  sim.nitro = 0;
  sim.nitroMs = NITRO_MS;
  sim.nitroUsed++;
  sim.speed = Math.min(NITRO_MAX_SPEED, sim.speed + NITRO_BURST);
  sim.events.push("nitro");
  return true;
}

export function stepRace(sim: RaceSim, dtMs: number) {
  if (raceFinished(sim)) return;
  const dt = dtMs / 1000;
  sim.elapsedMs += dtMs;
  if (sim.nitroMs > 0) sim.nitroMs = Math.max(0, sim.nitroMs - dtMs);
  sim.speed *= Math.exp(-DRAG * dt);
  if (sim.speed < 0.05) sim.speed = 0;
  sim.dist += sim.speed * dt;

  const t = sim.elapsedMs / 1000;
  for (const rival of sim.rivals) {
    if (rival.finishedAt !== null) continue;
    // Computer cars hold a steady typing pace with a little natural variation, easing in off the start line.
    const target = rival.cps * METRES_PER_CHAR * (1 + 0.12 * Math.sin(t * 0.7 + rival.phase)) * Math.min(1, t / 2);
    rival.speed += (target - rival.speed) * Math.min(1, dt * 2);
    rival.dist += rival.speed * dt;
    if (rival.dist >= sim.trackLen) {
      rival.dist = sim.trackLen;
      rival.finishedAt = sim.elapsedMs;
    }
  }

  if (sim.dist >= sim.trackLen) {
    sim.dist = sim.trackLen;
    sim.finishedAt = sim.elapsedMs;
    sim.position = 1 + sim.rivals.filter((r) => r.finishedAt !== null).length;
    sim.events.push("finish");
  }
}

const POSITION_BONUS = [600, 350, 150, 0];

export type RaceOutcome = TypingSummary & { timeMs: number; position: number; won: boolean; nitroUsed: number; score: ScoreBreakdown };

export function raceOutcome(sim: RaceSim): RaceOutcome {
  const summary = summarize(sim.stats, sim.elapsedMs);
  const position = sim.position ?? livePosition(sim);
  const finished = raceFinished(sim);
  // An abandoned race scores only the distance covered.
  const base = finished ? sim.trackLen + (POSITION_BONUS[position - 1] ?? 0) : Math.round(sim.dist * 0.5);
  const score = scoreBreakdown({ base, accuracy: summary.accuracy, wpm: summary.wpm, bestStreak: summary.bestStreak, difficulty: sim.cfg.difficulty });
  return { ...summary, timeMs: sim.elapsedMs, position, won: finished && position === 1, nitroUsed: sim.nitroUsed, score };
}
