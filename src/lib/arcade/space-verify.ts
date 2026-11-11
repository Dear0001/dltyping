// Server-side check of a Typing Space Shooter run. Pure (no database), so it is
// unit-tested directly and used by /api/arcade/runs/[id].
//
// The browser sends only what the player did (the input log and the number of
// ticks played). The server rebuilds the game from the seed it issued and
// replays the log; the result it stores is the one it computed, never a score
// the browser claims.
import { SPACE_TOPICS } from "@/data/space-content";
import { isArcadeDifficulty } from "@/lib/arcade/difficulty";
import { createSpace, MAX_POWERS, SPACE_MODES, spaceBackspace, spaceChar, spaceOutcome, spacePower, tickSpace, TIME_LIMITS, TICK_MS, WAVE_TARGETS, type LogEntry, type SpaceConfig, type SpaceOutcome, type SpaceSim } from "@/lib/arcade/space";

/** The longest run accepted (35 minutes of game time). */
export const MAX_TICKS = Math.ceil((35 * 60 * 1000) / TICK_MS);
export const MAX_LOG = 40_000;
/** Inputs allowed in any one-second window. Fast human bursts reach about 15. */
export const MAX_KEYS_PER_SECOND = 25;
const TICKS_PER_SECOND = Math.round(1000 / TICK_MS);

export type SpaceSetup = Omit<SpaceConfig, "seed">;

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** Validates the setup a run was started with. */
export function parseSpaceSetup(raw: unknown): SpaceSetup | null {
  if (!isRecord(raw)) return null;
  const { language, difficulty, mode, topic, timeLimit, waveTarget } = raw;
  if (language !== "english" && language !== "khmer") return null;
  if (!isArcadeDifficulty(difficulty) || !SPACE_MODES.includes(mode as never) || !SPACE_TOPICS.includes(topic as never)) return null;
  if (!TIME_LIMITS.includes(timeLimit as never) || !WAVE_TARGETS.includes(waveTarget as never)) return null;
  return { language, difficulty, mode: mode as SpaceSetup["mode"], topic: topic as SpaceSetup["topic"], timeLimit: timeLimit as number, waveTarget: waveTarget as number };
}

/** Validates the shape of an input log. Returns null for anything malformed. */
export function parseLog(raw: unknown, ticks: number): LogEntry[] | null {
  if (!Array.isArray(raw) || raw.length > MAX_LOG) return null;
  const out: LogEntry[] = [];
  let last = 0;
  for (const item of raw) {
    if (!Array.isArray(item) || item.length < 2 || item.length > 3) return null;
    const [tick, kind, value] = item;
    if (!Number.isInteger(tick) || tick < last || tick > ticks) return null;
    last = tick;
    if (kind === 0 && typeof value === "string" && Array.from(value).length === 1) out.push([tick, 0, value]);
    else if (kind === 1 && value === undefined) out.push([tick, 1]);
    else if (kind === 2 && typeof value === "string" && /^[0-9]$/.test(value) && Number(value) < MAX_POWERS) out.push([tick, 2, value]);
    else return null;
  }
  return out;
}

/** True when no one-second window holds more inputs than a person can type. */
export function plausibleRate(log: LogEntry[]) {
  let start = 0;
  for (let i = 0; i < log.length; i++) {
    while (log[i][0] - log[start][0] >= TICKS_PER_SECOND) start++;
    if (i - start + 1 > MAX_KEYS_PER_SECOND) return false;
  }
  return true;
}

function apply(sim: SpaceSim, entry: LogEntry) {
  if (entry[1] === 0) spaceChar(sim, entry[2]!);
  else if (entry[1] === 1) spaceBackspace(sim);
  else spacePower(sim, Number(entry[2]));
}

/** Plays a run again from its seed and inputs, exactly as the browser did. */
export function replaySpace(config: SpaceConfig, ticks: number, log: LogEntry[]): SpaceSim {
  const sim = createSpace(config);
  let i = 0;
  for (let t = 0; t <= ticks; t++) {
    while (i < log.length && log[i][0] === t) apply(sim, log[i++]);
    if (t === ticks || sim.over) break;
    tickSpace(sim);
  }
  return sim;
}

export type Verification = { ok: true; outcome: SpaceOutcome; sim: SpaceSim } | { ok: false; reason: "setup" | "log" | "rate" | "ticks" | "time" };

/**
 * Checks a run. `wallMs` is the real time between the server starting the run and
 * receiving the result: game time can never be longer than that.
 */
export function verifySpaceRun(input: { setup: unknown; seed: number; ticks: unknown; log: unknown; wallMs: number }): Verification {
  const setup = parseSpaceSetup(input.setup);
  if (!setup) return { ok: false, reason: "setup" };
  const ticks = input.ticks;
  if (!Number.isInteger(ticks) || (ticks as number) < 0 || (ticks as number) > MAX_TICKS) return { ok: false, reason: "ticks" };
  if ((ticks as number) * TICK_MS > input.wallMs + 5000) return { ok: false, reason: "time" };
  const log = parseLog(input.log, ticks as number);
  if (!log) return { ok: false, reason: "log" };
  if (!plausibleRate(log)) return { ok: false, reason: "rate" };
  const sim = replaySpace({ ...setup, seed: input.seed >>> 0 }, ticks as number, log);
  // The browser stops counting ticks when the game ends; a longer claim means the log does not match the game.
  if (sim.over && sim.tick < (ticks as number)) return { ok: false, reason: "ticks" };
  return { ok: true, outcome: spaceOutcome(sim), sim };
}
