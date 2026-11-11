// Zombie Survival simulation. The player stands in the middle of the field;
// zombies walk in from every side, each carrying a word. Typing a zombie's word
// defeats it. Pure logic: rendering and input live in the React component.
import { createRng, pickWord, rand, randRange, shiftClass, type Rng, type WordClass } from "@/lib/arcade/content";
import { byDifficulty, DIFFICULTY_INDEX, type ArcadeDifficulty } from "@/lib/arcade/difficulty";
import { scoreBreakdown, type ScoreBreakdown } from "@/lib/arcade/scoring";
import { countStray, createBuffer, createStats, firstChar, resetBuffer, summarize, typeChar, type TypeBuffer, type TypingStats, type TypingSummary } from "@/lib/arcade/typing-core";
import { comboMultiplier } from "@/lib/game-engine";
import type { Language } from "@/types";

export const ZOMBIE_STAGES = ["graveyard", "street", "lab"] as const;
export type ZombieStage = (typeof ZOMBIE_STAGES)[number];
/** Later stages are faster and pay more. */
const STAGE_RULES: Record<ZombieStage, { speed: number; points: number }> = { graveyard: { speed: 1, points: 1 }, street: { speed: 1.12, points: 1.25 }, lab: { speed: 1.25, points: 1.5 } };

export type ZombieType = "normal" | "fast" | "armored" | "boss";
type TypeRule = { speed: number; damage: number; points: number; radius: number; /** Word size of each typing stage. */ words: WordClass[] };
export const ZOMBIE_RULES: Record<ZombieType, TypeRule> = {
  normal: { speed: 30, damage: 12, points: 50, radius: 20, words: ["short"] },
  fast: { speed: 58, damage: 8, points: 70, radius: 16, words: ["short"] },
  armored: { speed: 21, damage: 20, points: 130, radius: 25, words: ["long"] },
  boss: { speed: 13, damage: 35, points: 600, radius: 40, words: ["medium", "long", "phrase"] },
};

export type PowerKind = "freeze" | "heal" | "blast";
export const POWER_KINDS: readonly PowerKind[] = ["freeze", "heal", "blast"];

export type Zombie = {
  id: number; type: ZombieType; x: number; y: number; speed: number; look: number;
  /** Remaining typing stages; the first is the active one. */
  words: string[]; stages: number; buf: TypeBuffer; stunMs: number; ageMs: number;
};
export type PowerUp = { id: number; kind: PowerKind; x: number; y: number; buf: TypeBuffer; ttlMs: number };

export type ZombieEvent =
  | { type: "key" | "wrong" | "lock" | "waveClear" | "shockwave" | "freeze" | "heal" | "over" }
  | { type: "wave"; wave: number; boss: boolean }
  | { type: "kill" | "stage"; x: number; y: number; zombie: ZombieType; points: number }
  | { type: "blast"; x: number; y: number }
  | { type: "hurt"; damage: number; x: number; y: number }
  | { type: "power"; kind: PowerKind; x: number; y: number };

export type ZombieConfig = { language: Language; difficulty: ArcadeDifficulty; stage: ZombieStage; seed: number };

export type ZombieSim = {
  cfg: ZombieConfig;
  rng: Rng;
  /** Field size in world units; the player stands in the centre. Set from the canvas shape. */
  w: number; h: number;
  zombies: Zombie[];
  powerups: PowerUp[];
  /** Id of the zombie or power-up being typed. */
  targetId: number | null;
  nextId: number;
  stats: TypingStats;
  health: number; maxHealth: number;
  wave: number;
  queue: ZombieType[];
  spawnMs: number;
  /** Countdown between waves. */
  breakMs: number;
  waveDamaged: boolean;
  /** Zombies in the current wave, and how many of them the player stopped. */
  waveSize: number; waveKills: number;
  flawlessWaves: number;
  kills: number; bossKills: number;
  points: number;
  /** Kills in a row without a typing mistake. */
  combo: number; bestCombo: number;
  /** 0-100, charges the shockwave. */
  charge: number;
  freezeMs: number;
  elapsedMs: number;
  over: boolean;
  events: ZombieEvent[];
};

export const PLAYER_RADIUS = 26;
const BREAK_MS = 3200;
const FREEZE_MS = 5500;
const REFERENCE_DISTANCE = 520;

export function createZombieGame(cfg: ZombieConfig): ZombieSim {
  const sim: ZombieSim = {
    cfg, rng: createRng(cfg.seed), w: 1000, h: 600, zombies: [], powerups: [], targetId: null, nextId: 1, stats: createStats(), health: 100, maxHealth: 100,
    wave: 0, queue: [], spawnMs: 0, breakMs: 1200, waveDamaged: false, waveSize: 0, waveKills: 0, flawlessWaves: 0, kills: 0, bossKills: 0, points: 0, combo: 0, bestCombo: 0, charge: 0, freezeMs: 0, elapsedMs: 0, over: false, events: [],
  };
  return sim;
}

export function setZombieBounds(sim: ZombieSim, w: number, h: number) {
  // Keep everyone inside the visible field when the window changes shape.
  const sx = w / sim.w, sy = h / sim.h;
  for (const item of [...sim.zombies, ...sim.powerups]) {
    item.x *= sx;
    item.y *= sy;
  }
  sim.w = w;
  sim.h = h;
}

/** The zombies of a wave, in spawn order. Bosses arrive every fifth wave. */
export function waveRoster(wave: number, difficulty: ArcadeDifficulty, rng: Rng): ZombieType[] {
  const level = DIFFICULTY_INDEX[difficulty];
  const boss = wave % 5 === 0;
  const count = Math.min(24, 3 + wave * 2 + level) - (boss ? 3 : 0);
  const fastShare = wave >= 2 ? Math.min(0.4, 0.12 + wave * 0.03) : 0;
  const armoredShare = wave >= 3 ? Math.min(0.3, 0.06 + wave * 0.025 + level * 0.02) : 0;
  const roster: ZombieType[] = [];
  for (let i = 0; i < count; i++) {
    const roll = rand(rng);
    roster.push(roll < armoredShare ? "armored" : roll < armoredShare + fastShare ? "fast" : "normal");
  }
  if (boss) roster.splice(Math.floor(roster.length / 2), 0, "boss");
  return roster;
}

/** Speed and spawn pacing ramp up gently and level off, so late waves stay fair. */
const waveSpeed = (wave: number) => 1 + Math.min(0.8, (wave - 1) * 0.045);
const spawnInterval = (sim: ZombieSim) => Math.max(520, 2300 - sim.wave * 110) * byDifficulty(sim.cfg.difficulty, [1.25, 1, 0.85, 0.72]);

function wordFor(sim: ZombieSim, cls: WordClass, avoidFirst: Set<string>) {
  const level = DIFFICULTY_INDEX[sim.cfg.difficulty];
  // Easy keeps words small; Hard and Expert stretch them.
  const shifted = level === 0 && cls !== "short" ? shiftClass(cls, -1) : level >= 2 && cls === "short" && sim.wave >= 3 ? "medium" : level === 3 && cls === "long" ? "phrase" : cls;
  return pickWord(sim.rng, sim.cfg.language, shifted, avoidFirst, new Set(sim.zombies.map((z) => z.buf.text)));
}

const usedFirst = (sim: ZombieSim) => new Set([...sim.zombies, ...sim.powerups].map((t) => firstChar(t.buf)));

function spawnZombie(sim: ZombieSim, type: ZombieType) {
  const rule = ZOMBIE_RULES[type];
  // Spawn just outside the edge of the field, from any direction.
  const angle = rand(sim.rng) * Math.PI * 2;
  const cos = Math.cos(angle), sin = Math.sin(angle);
  const edge = Math.min((sim.w / 2 + rule.radius + 6) / Math.max(Math.abs(cos), 1e-6), (sim.h / 2 + rule.radius + 6) / Math.max(Math.abs(sin), 1e-6));
  const x = sim.w / 2 + cos * edge, y = sim.h / 2 + sin * edge;
  // Walking time to the player is the same on every screen shape.
  const distance = Math.hypot(x - sim.w / 2, y - sim.h / 2);
  const speed = rule.speed * waveSpeed(sim.wave) * byDifficulty(sim.cfg.difficulty, [0.8, 1, 1.15, 1.3]) * STAGE_RULES[sim.cfg.stage].speed * (distance / REFERENCE_DISTANCE) * randRange(sim.rng, 0.92, 1.08);
  const avoid = usedFirst(sim);
  const words = rule.words.map((cls) => wordFor(sim, cls, avoid));
  sim.zombies.push({ id: sim.nextId++, type, x, y, speed, look: Math.floor(rand(sim.rng) * 3), words, stages: words.length, buf: createBuffer(words[0], sim.cfg.language, "strict"), stunMs: 0, ageMs: 0 });
}

function startWave(sim: ZombieSim) {
  sim.wave++;
  sim.queue = waveRoster(sim.wave, sim.cfg.difficulty, sim.rng);
  sim.spawnMs = 400;
  sim.waveDamaged = false;
  sim.waveSize = sim.queue.length;
  sim.waveKills = 0;
  sim.events.push({ type: "wave", wave: sim.wave, boss: sim.queue.includes("boss") });
}

function award(sim: ZombieSim, base: number) {
  const points = Math.round(base * comboMultiplier(sim.combo) * STAGE_RULES[sim.cfg.stage].points);
  sim.points += points;
  return points;
}

function killZombie(sim: ZombieSim, zombie: Zombie, byTyping: boolean) {
  sim.zombies = sim.zombies.filter((z) => z !== zombie);
  if (sim.targetId === zombie.id) sim.targetId = null;
  sim.kills++;
  sim.waveKills++;
  if (zombie.type === "boss") sim.bossKills++;
  if (byTyping) {
    sim.combo++;
    sim.bestCombo = Math.max(sim.bestCombo, sim.combo);
    sim.charge = Math.min(100, sim.charge + 10);
  }
  const points = award(sim, ZOMBIE_RULES[zombie.type].points * (byTyping ? 1 : 0.5));
  sim.events.push({ type: "kill", x: zombie.x, y: zombie.y, zombie: zombie.type, points });
  // Some zombies drop a power-up: a floating crate with its own short word.
  if (byTyping && sim.powerups.length === 0 && rand(sim.rng) < (zombie.type === "boss" ? 1 : 0.12)) {
    const kind = sim.health < 45 && rand(sim.rng) < 0.6 ? "heal" : POWER_KINDS[Math.floor(rand(sim.rng) * POWER_KINDS.length)];
    const margin = 70;
    const x = Math.max(margin, Math.min(sim.w - margin, zombie.x)), y = Math.max(margin, Math.min(sim.h - margin, zombie.y));
    sim.powerups.push({ id: sim.nextId++, kind, x, y, buf: createBuffer(pickWord(sim.rng, sim.cfg.language, "short", usedFirst(sim)), sim.cfg.language, "strict"), ttlMs: 9000 });
  }
}

function applyPower(sim: ZombieSim, power: PowerUp) {
  sim.powerups = sim.powerups.filter((p) => p !== power);
  sim.targetId = null;
  sim.events.push({ type: "power", kind: power.kind, x: power.x, y: power.y });
  if (power.kind === "freeze") {
    sim.freezeMs = FREEZE_MS;
    sim.events.push({ type: "freeze" });
  } else if (power.kind === "heal") {
    sim.health = Math.min(sim.maxHealth, sim.health + 25);
    sim.events.push({ type: "heal" });
  } else {
    // The blast clears every ordinary zombie; a boss loses its current typing stage instead.
    sim.events.push({ type: "blast", x: sim.w / 2, y: sim.h / 2 });
    for (const zombie of [...sim.zombies]) {
      if (zombie.type === "boss") advanceStage(sim, zombie, false);
      else killZombie(sim, zombie, false);
    }
  }
}

function advanceStage(sim: ZombieSim, zombie: Zombie, byTyping: boolean) {
  zombie.words.shift();
  if (!zombie.words.length) return killZombie(sim, zombie, byTyping);
  if (sim.targetId === zombie.id) sim.targetId = null;
  // A wounded boss staggers back before its next word appears.
  zombie.stunMs = 900;
  zombie.buf = createBuffer(zombie.words[0], sim.cfg.language, "strict");
  sim.events.push({ type: "stage", x: zombie.x, y: zombie.y, zombie: zombie.type, points: award(sim, 80) });
}

const distanceToPlayer = (sim: ZombieSim, item: { x: number; y: number }) => Math.hypot(item.x - sim.w / 2, item.y - sim.h / 2);
export const findTarget = (sim: ZombieSim): Zombie | PowerUp | null => (sim.targetId === null ? null : sim.zombies.find((z) => z.id === sim.targetId) ?? sim.powerups.find((p) => p.id === sim.targetId) ?? null);
const isOnField = (sim: ZombieSim, item: { x: number; y: number }) => item.x >= 0 && item.x <= sim.w && item.y >= 0 && item.y <= sim.h;

function miss(sim: ZombieSim) {
  sim.combo = 0;
  sim.charge = Math.max(0, sim.charge - 10);
  sim.events.push({ type: "wrong" });
}

export function zombieChar(sim: ZombieSim, char: string) {
  if (sim.over) return;
  let target = findTarget(sim);
  if (!target) {
    // The first letter picks the closest visible target that starts with it.
    const candidates = [...sim.zombies, ...sim.powerups].filter((t) => firstChar(t.buf) === char && isOnField(sim, t));
    if (!candidates.length) {
      countStray(sim.stats);
      return miss(sim);
    }
    target = candidates.reduce((best, t) => (distanceToPlayer(sim, t) < distanceToPlayer(sim, best) ? t : best));
    sim.targetId = target.id;
    sim.events.push({ type: "lock" });
  }
  const result = typeChar(target.buf, char, sim.stats, sim.elapsedMs);
  if (result === "wrong") return miss(sim);
  if (result === "blocked") return;
  sim.charge = Math.min(100, sim.charge + 3);
  sim.events.push({ type: "key" });
  if (result !== "complete") return;
  if ("kind" in target) applyPower(sim, target);
  else advanceStage(sim, target, true);
}

/** Backspace lets go of the current target so another one can be picked. */
export function zombieRelease(sim: ZombieSim) {
  const target = findTarget(sim);
  if (!target) return;
  resetBuffer(target.buf, sim.stats);
  sim.targetId = null;
}

export const shockwaveReady = (sim: ZombieSim) => sim.charge >= 100;
/** Special ability charged by typing: throws every zombie back and stuns it. */
export function zombieShockwave(sim: ZombieSim) {
  if (sim.over || !shockwaveReady(sim)) return false;
  sim.charge = 0;
  for (const zombie of sim.zombies) {
    const dx = zombie.x - sim.w / 2, dy = zombie.y - sim.h / 2;
    const d = Math.hypot(dx, dy) || 1;
    const push = zombie.type === "boss" ? 90 : 190;
    zombie.x += (dx / d) * push;
    zombie.y += (dy / d) * push;
    zombie.stunMs = 1600;
  }
  sim.events.push({ type: "shockwave" });
  return true;
}

export function stepZombies(sim: ZombieSim, dtMs: number) {
  if (sim.over) return;
  const dt = dtMs / 1000;
  sim.elapsedMs += dtMs;
  if (sim.freezeMs > 0) sim.freezeMs = Math.max(0, sim.freezeMs - dtMs);

  // Waves: spawn the roster one by one, then a short breather once the field is clear.
  if (sim.breakMs > 0) {
    sim.breakMs -= dtMs;
    if (sim.breakMs <= 0) startWave(sim);
  } else if (sim.queue.length) {
    sim.spawnMs -= dtMs;
    if (sim.spawnMs <= 0) {
      spawnZombie(sim, sim.queue.shift()!);
      sim.spawnMs = spawnInterval(sim);
    }
  } else if (!sim.zombies.length) {
    // The wave bonus is earned by stopping zombies, not by letting them through.
    sim.points += Math.round(100 * sim.wave * (sim.waveKills / Math.max(1, sim.waveSize)));
    if (!sim.waveDamaged) sim.flawlessWaves++;
    sim.health = Math.min(sim.maxHealth, sim.health + 6);
    sim.breakMs = BREAK_MS;
    sim.events.push({ type: "waveClear" });
  }

  const cx = sim.w / 2, cy = sim.h / 2;
  const slow = sim.freezeMs > 0 ? 0.3 : 1;
  for (const zombie of [...sim.zombies]) {
    zombie.ageMs += dtMs;
    if (zombie.stunMs > 0) {
      zombie.stunMs -= dtMs;
      continue;
    }
    const dx = cx - zombie.x, dy = cy - zombie.y;
    const d = Math.hypot(dx, dy) || 1;
    const reach = PLAYER_RADIUS + ZOMBIE_RULES[zombie.type].radius;
    if (d <= reach) {
      const damage = Math.round(ZOMBIE_RULES[zombie.type].damage * byDifficulty(sim.cfg.difficulty, [0.8, 1, 1.15, 1.3]));
      sim.health = Math.max(0, sim.health - damage);
      sim.waveDamaged = true;
      sim.combo = 0;
      sim.events.push({ type: "hurt", damage, x: zombie.x, y: zombie.y });
      if (zombie.type === "boss") {
        // A boss strikes, then is thrown back to try again.
        zombie.x -= (dx / d) * 230;
        zombie.y -= (dy / d) * 230;
        zombie.stunMs = 700;
      } else {
        if (sim.targetId === zombie.id) {
          resetBuffer(zombie.buf, sim.stats);
          sim.targetId = null;
        }
        sim.zombies = sim.zombies.filter((z) => z !== zombie);
      }
      continue;
    }
    const move = Math.min(zombie.speed * slow * dt, d - reach + 0.5);
    zombie.x += (dx / d) * move;
    zombie.y += (dy / d) * move;
  }

  for (const power of [...sim.powerups]) {
    power.ttlMs -= dtMs;
    if (power.ttlMs > 0) continue;
    if (sim.targetId === power.id) {
      resetBuffer(power.buf, sim.stats);
      sim.targetId = null;
    }
    sim.powerups = sim.powerups.filter((p) => p !== power);
  }

  if (sim.health <= 0) {
    sim.over = true;
    sim.events.push({ type: "over" });
  }
}

export type ZombieOutcome = TypingSummary & { timeMs: number; wave: number; wavesCleared: number; kills: number; bossKills: number; bestCombo: number; flawlessWaves: number; score: ScoreBreakdown };

export function zombieOutcome(sim: ZombieSim): ZombieOutcome {
  const summary = summarize(sim.stats, sim.elapsedMs);
  const score = scoreBreakdown({ base: sim.points, accuracy: summary.accuracy, wpm: summary.wpm, bestStreak: summary.bestStreak, difficulty: sim.cfg.difficulty });
  // The wave being fought when the run ends was not cleared.
  const wavesCleared = Math.max(0, sim.wave - (sim.breakMs > 0 ? 0 : 1));
  return { ...summary, timeMs: sim.elapsedMs, wave: sim.wave, wavesCleared, kills: sim.kills, bossKills: sim.bossKills, bestCombo: sim.bestCombo, flawlessWaves: sim.flawlessWaves, score };
}
