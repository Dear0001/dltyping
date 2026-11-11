// Typing Space Shooter simulation.
//
// Deterministic by design: it advances in fixed 60 Hz ticks, uses only the
// seeded generator (never Math.random or the clock) and avoids trigonometry, so
// the same seed and the same input log give the same game on any machine. Every
// input is logged with its tick; the server replays the log (space-verify.ts)
// to compute the result itself instead of trusting the browser.
import { createRng, rand, randRange, type Rng, type WordClass } from "@/lib/arcade/content";
import { byDifficulty, DIFFICULTY_INDEX, languagePace, type ArcadeDifficulty } from "@/lib/arcade/difficulty";
import { accuracyRate, scoreBreakdown, type ScoreBreakdown } from "@/lib/arcade/scoring";
import { spaceWord } from "@/lib/arcade/space-content";
import { backspace, countStray, createBuffer, createStats, firstChar, resetBuffer, summarize, typeChar, type TypeBuffer, type TypingStats, type TypingSummary } from "@/lib/arcade/typing-core";
import { comboMultiplier } from "@/lib/game-engine";
import { codepoints } from "@/lib/khmer-unicode";
import type { SpaceTopic } from "@/data/space-content";
import type { Language } from "@/types";

// ---- Configuration ------------------------------------------------------------
export const TICK_MS = 1000 / 60;
/** The playfield. The renderer scales it to fit the screen, so its shape never changes the game. */
export const WORLD = { w: 1040, h: 600 } as const;
export const PLAYER = { x: 520, y: 552 } as const;
/** Enemies that cross this line hit the defences. */
export const DEFENSE_Y = 505;
/** Where bombers stop to launch their bombs. */
const BOMB_LINE = 235;

export const SPACE_MODES = ["survival", "time", "waves", "accuracy"] as const;
export type SpaceMode = (typeof SPACE_MODES)[number];
/** Time Challenge lengths in seconds. */
export const TIME_LIMITS = [60, 120, 180, 300] as const;
/** Wave Challenge lengths. */
export const WAVE_TARGETS = [5, 10, 15] as const;
export const ACCURACY_WAVES = 5;
/** A boss arrives every BOSS_EVERY waves (5, 10, 15…). */
export const BOSS_EVERY = 5;

export type EnemyKind = "scout" | "speed" | "armored" | "bomber" | "elite" | "stealth" | "boss";
export type KindRule = {
  /** Word size of each typing stage (one stage = one hit). */
  words: WordClass[];
  /** Multiplies the time an enemy takes to arrive (lower = faster). */
  travel: number;
  /** Damage when it reaches the defence line, or per bomb / boss shot. */
  damage: number;
  points: number;
  radius: number;
  /** Side-to-side weave in world units. */
  weave: number;
};
export const ENEMY_KINDS: Record<EnemyKind, KindRule> = {
  scout: { words: ["short"], travel: 1, damage: 8, points: 10, radius: 20, weave: 0 },
  speed: { words: ["short"], travel: 0.62, damage: 8, points: 15, radius: 17, weave: 34 },
  armored: { words: ["medium", "long"], travel: 1.15, damage: 18, points: 25, radius: 27, weave: 0 },
  bomber: { words: ["medium"], travel: 0.75, damage: 16, points: 30, radius: 25, weave: 0 },
  elite: { words: ["long", "long"], travel: 1.1, damage: 25, points: 50, radius: 28, weave: 60 },
  stealth: { words: ["medium"], travel: 0.95, damage: 12, points: 20, radius: 21, weave: 0 },
  boss: { words: [], travel: 1, damage: 12, points: 200, radius: 70, weave: 220 },
};
/** Stealth ships are see-through for part of every cycle; their word always stays on screen. */
const CLOAK_CYCLE_MS = 4000, CLOAK_MS = 1400;
const BOSS_INTRO_MS = 2600, BOSS_Y = 112, BOSS_SHOT_MS = 1700, BOMB_MS = 1500;

type DifficultyRule = { hp: number; msPerChar: number; reactionMs: number; maxActive: number; maxActiveCap: number; spawn: number; special: number; fuseMs: number; bossAttackMs: number; damage: number };
/**
 * Arrival time is built from the words: reaction time plus a per-keystroke
 * budget, so longer words get more time instead of every enemy just getting faster.
 */
const DIFFICULTY: readonly [DifficultyRule, DifficultyRule, DifficultyRule, DifficultyRule] = [
  { hp: 150, msPerChar: 650, reactionMs: 4200, maxActive: 3, maxActiveCap: 5, spawn: 1.3, special: 0.6, fuseMs: 7500, bossAttackMs: 7000, damage: 0.8 },
  { hp: 100, msPerChar: 460, reactionMs: 3200, maxActive: 4, maxActiveCap: 6, spawn: 1, special: 1, fuseMs: 6200, bossAttackMs: 5800, damage: 1 },
  { hp: 100, msPerChar: 340, reactionMs: 2500, maxActive: 5, maxActiveCap: 8, spawn: 0.85, special: 1.3, fuseMs: 5200, bossAttackMs: 4800, damage: 1.15 },
  { hp: 80, msPerChar: 260, reactionMs: 2000, maxActive: 6, maxActiveCap: 9, spawn: 0.72, special: 1.6, fuseMs: 4400, bossAttackMs: 4000, damage: 1.3 },
];

export const POWER_KINDS = ["shield", "rapid", "laser", "emp", "slow", "repair", "multi"] as const;
export type PowerKind = (typeof POWER_KINDS)[number];
export const MAX_POWERS = 3;
export const POWER_MS = { shield: 8000, rapid: 10000, slow: 7000 } as const;
const SLOW_FACTOR = 0.4, REPAIR_HP = 30, EMP_RADIUS = 230, MULTI_TARGETS = 4;

/** Bonus points. Change these to rebalance the score. */
export const SPACE_POINTS = { waveBonus: 50, bossBonus: 150, healthBonus: 2, timeBonus: 300, accuracyPenalty: 5 } as const;

// ---- State ----------------------------------------------------------------
export type SpaceConfig = { language: Language; difficulty: ArcadeDifficulty; mode: SpaceMode; topic: SpaceTopic; timeLimit: number; waveTarget: number; seed: number };

export type Enemy = {
  id: number; kind: EnemyKind; x: number; y: number; baseX: number; vx: number; vy: number; weavePhase: number;
  /** Height where it stops: the defence line, a bomber's hover point or the boss position. */
  goalY: number;
  /** Words still to type; the first is the active one. Empty = every word typed, shots on the way. */
  words: string[]; buf: TypeBuffer;
  /** Hits left. Drops when a shot lands, so it can trail `words` while shots are in flight. */
  hp: number; maxHp: number;
  ageMs: number; seenAtMs: number | null; locked: boolean; hovering: boolean;
  fuseMs: number; fuseMax: number; flashMs: number; cloakOffset: number;
  /** Boss only. */
  introMs: number; attackMs: number;
};
export type Shot = { id: number; targetId: number; x: number; y: number; speed: number; kind: "laser" | "missile" };
export type Hazard = { id: number; x: number; y: number; vx: number; vy: number; damage: number; boss: boolean };
/** [tick, 0 = character, value] · [tick, 1 = backspace] · [tick, 2 = power-up, slot]. */
export type LogEntry = [number, 0 | 1 | 2, string?];

export type SpaceEvent =
  | { type: "key" | "wrong" | "lock" | "release" | "waveClear" | "bossDown" | "destroyed" | "victory" | "blocked" | "noPower" }
  | { type: "fire"; x: number; y: number }
  | { type: "wave"; wave: number; boss: boolean }
  | { type: "bossIntro" }
  | { type: "hit"; x: number; y: number; kind: EnemyKind; shield: boolean }
  | { type: "kill"; x: number; y: number; kind: EnemyKind; points: number }
  | { type: "breach"; x: number; damage: number }
  | { type: "hurt"; damage: number }
  | { type: "bomb"; x: number; y: number; boss: boolean }
  | { type: "combo"; combo: number }
  | { type: "power"; kind: PowerKind; x?: number; y?: number }
  | { type: "gain"; kind: PowerKind };

export type SpaceSim = {
  cfg: SpaceConfig; rules: DifficultyRule; rng: Rng;
  tick: number; acc: number;
  /** Tick at which the run was decided (game time stops there for the statistics). */
  endTick: number | null;
  enemies: Enemy[]; shots: Shot[]; hazards: Hazard[];
  targetId: number | null; nextId: number;
  stats: TypingStats;
  hp: number; maxHp: number;
  wave: number; queue: EnemyKind[]; spawnMs: number; breakMs: number; waveDamaged: boolean; wavesCleared: number;
  /** Ships in the current wave, and how many the player destroyed (the wave bonus is earned, not given). */
  waveSize: number; waveKills: number;
  bossId: number | null;
  kills: number; bosses: number; points: number;
  combo: number; bestCombo: number;
  powers: PowerKind[]; powersUsed: number;
  shieldMs: number; rapidMs: number; slowMs: number;
  reactionTotal: number; reactionCount: number;
  /** Finish animation still to play before the game ends. */
  endingMs: number;
  result: "won" | "lost" | null;
  over: boolean;
  log: LogEntry[];
  events: SpaceEvent[];
};

const tri = (t: number) => 4 * Math.abs(t - Math.floor(t + 0.5)) - 1;
const dist = (ax: number, ay: number, bx: number, by: number) => Math.sqrt((ax - bx) * (ax - bx) + (ay - by) * (ay - by));
export const elapsedMs = (sim: SpaceSim) => (sim.endTick ?? sim.tick) * TICK_MS;
export const isCloaked = (enemy: Enemy) => enemy.kind === "stealth" && enemy.words.length > 0 && (enemy.ageMs + enemy.cloakOffset) % CLOAK_CYCLE_MS >= CLOAK_CYCLE_MS - CLOAK_MS;
/** Every word typed; the enemy is waiting for the shots already on their way. */
export const isDoomed = (enemy: Enemy) => enemy.words.length === 0;
const isVisible = (enemy: Enemy) => enemy.y >= 0 && enemy.x >= 0 && enemy.x <= WORLD.w;
/** Can be picked as a target right now. */
const isTargetable = (enemy: Enemy) => !isDoomed(enemy) && enemy.introMs <= 0 && isVisible(enemy);
export const findTarget = (sim: SpaceSim) => (sim.targetId === null ? null : sim.enemies.find((e) => e.id === sim.targetId) ?? null);
export const findBoss = (sim: SpaceSim) => (sim.bossId === null ? null : sim.enemies.find((e) => e.id === sim.bossId) ?? null);
const playing = (sim: SpaceSim) => !sim.over && sim.result === null;

export function createSpace(cfg: SpaceConfig): SpaceSim {
  const rules = byDifficulty(cfg.difficulty, DIFFICULTY);
  return {
    cfg, rules, rng: createRng(cfg.seed), tick: 0, acc: 0, endTick: null, enemies: [], shots: [], hazards: [], targetId: null, nextId: 1, stats: createStats(),
    hp: rules.hp, maxHp: rules.hp, wave: 0, queue: [], spawnMs: 0, breakMs: 1500, waveDamaged: false, wavesCleared: 0, waveSize: 0, waveKills: 0, bossId: null,
    kills: 0, bosses: 0, points: 0, combo: 0, bestCombo: 0, powers: [], powersUsed: 0, shieldMs: 0, rapidMs: 0, slowMs: 0,
    reactionTotal: 0, reactionCount: 0, endingMs: 0, result: null, over: false, log: [], events: [],
  };
}

/** Last wave of a run that has one, or null for endless modes. */
export function finalWave(cfg: Pick<SpaceConfig, "mode" | "waveTarget">) {
  return cfg.mode === "waves" ? cfg.waveTarget : cfg.mode === "accuracy" ? ACCURACY_WAVES : null;
}

// ---- Waves ----------------------------------------------------------------
/** The enemies of a wave in spawn order. Specials join gradually; every fifth wave is a boss fight. */
export function waveRoster(wave: number, cfg: Pick<SpaceConfig, "difficulty" | "mode">, rng: Rng): EnemyKind[] {
  const level = DIFFICULTY_INDEX[cfg.difficulty];
  const special = byDifficulty(cfg.difficulty, DIFFICULTY).special * (cfg.mode === "accuracy" ? 0.7 : 1);
  if (wave % BOSS_EVERY === 0) return ["boss", ...Array.from({ length: 2 + wave / BOSS_EVERY }, (): EnemyKind => "scout")];
  const count = Math.min(28, 4 + wave * 2 + level);
  const shares: [EnemyKind, number][] = [
    ["elite", wave >= 7 - level ? Math.min(0.12, 0.03 + wave * 0.008) * special : 0],
    ["stealth", wave >= 6 - Math.min(level, 2) ? Math.min(0.14, 0.04 + wave * 0.01) * special : 0],
    ["bomber", wave >= 4 - Math.min(level, 1) ? Math.min(0.14, 0.04 + wave * 0.01) * special : 0],
    ["armored", wave >= 3 ? Math.min(0.2, 0.05 + wave * 0.015) * special : 0],
    ["speed", wave >= 2 ? Math.min(0.3, 0.1 + wave * 0.02) * special : 0],
  ];
  const roster: EnemyKind[] = [];
  for (let i = 0; i < count; i++) {
    let roll = rand(rng);
    let kind: EnemyKind = "scout";
    for (const [k, share] of shares) {
      if (roll < share) {
        kind = k;
        break;
      }
      roll -= share;
    }
    roster.push(kind);
  }
  return roster;
}

/** Word size for a stage, shifted by difficulty and wave so words grow as the game goes on. */
function wordClass(sim: SpaceSim, cls: WordClass, kind: EnemyKind): WordClass {
  const level = DIFFICULTY_INDEX[sim.cfg.difficulty];
  if (level === 0) return cls === "phrase" ? "long" : cls === "long" ? "medium" : cls === "medium" && kind !== "boss" ? "short" : cls;
  if (cls === "short" && (level === 3 || (level === 2 && sim.wave >= 4)) && kind !== "speed") return "medium";
  if (cls === "medium" && level === 3 && sim.wave >= 3 && kind !== "speed") return "long";
  if (cls === "long" && level === 3 && kind === "elite") return "phrase";
  return cls;
}

function bossWords(sim: SpaceSim): WordClass[] {
  const index = sim.wave / BOSS_EVERY - 1;
  const count = Math.min(10, 4 + index * 2);
  // Three phases: medium words, then long, then phrases.
  return Array.from({ length: count }, (_, i): WordClass => (i < count / 3 ? "medium" : i < (count * 2) / 3 ? "long" : "phrase"));
}

const firstChars = (sim: SpaceSim) => new Set(sim.enemies.filter((e) => !isDoomed(e)).map((e) => firstChar(e.buf)));

function spawn(sim: SpaceSim, kind: EnemyKind) {
  const rule = ENEMY_KINDS[kind], rules = sim.rules, rng = sim.rng;
  const classes = kind === "boss" ? bossWords(sim) : rule.words;
  const avoidFirst = firstChars(sim);
  const avoid = new Set(sim.enemies.flatMap((e) => e.words));
  const words = classes.map((cls) => {
    const word = spaceWord(rng, sim.cfg.language, sim.cfg.topic, wordClass(sim, cls, kind), avoidFirst, avoid);
    avoid.add(word);
    return word;
  });
  const id = sim.nextId++;
  let x: number, y: number, goalX: number, goalY: number;
  if (kind === "boss") {
    x = WORLD.w / 2;
    y = -110;
    goalX = x;
    goalY = BOSS_Y;
  } else if (kind !== "bomber" && rand(rng) < 0.3) {
    // From a side, angling down into the field.
    const left = rand(rng) < 0.5;
    x = left ? -30 : WORLD.w + 30;
    y = randRange(rng, 30, 180);
    goalX = left ? randRange(rng, WORLD.w * 0.3, WORLD.w - 90) : randRange(rng, 90, WORLD.w * 0.7);
    goalY = DEFENSE_Y;
  } else {
    x = randRange(rng, 70, WORLD.w - 70);
    y = -40;
    goalX = randRange(rng, 90, WORLD.w - 90);
    goalY = kind === "bomber" ? BOMB_LINE + randRange(rng, -50, 30) : DEFENSE_Y;
  }
  const keystrokes = words.reduce((n, word) => n + codepoints(word).length, 0);
  const waveSpeed = Math.max(0.62, 1 - (sim.wave - 1) * 0.035);
  const pace = languagePace(sim.cfg.language);
  const travelMs = kind === "boss" ? BOSS_INTRO_MS : (rules.reactionMs + (keystrokes * rules.msPerChar) / pace) * rule.travel * waveSpeed;
  const d = dist(x, y, goalX, goalY) || 1;
  const speed = d / travelMs; // world units per ms
  const fuseMax = kind === "bomber" ? rules.fuseMs / (0.5 + pace / 2) : kind === "boss" ? rules.bossAttackMs : 0;
  sim.enemies.push({
    id, kind, x, y, baseX: x, goalY, vx: ((goalX - x) / d) * speed, vy: ((goalY - y) / d) * speed, weavePhase: rand(rng),
    words, buf: createBuffer(words[0], sim.cfg.language, "strict"), hp: words.length, maxHp: words.length,
    ageMs: 0, seenAtMs: null, locked: false, hovering: false, fuseMs: fuseMax, fuseMax, flashMs: 0, cloakOffset: Math.floor(rand(rng) * CLOAK_CYCLE_MS),
    introMs: kind === "boss" ? BOSS_INTRO_MS : 0, attackMs: fuseMax,
  });
  if (kind === "boss") {
    sim.bossId = id;
    sim.events.push({ type: "bossIntro" });
  }
}

function startWave(sim: SpaceSim) {
  sim.wave++;
  sim.queue = waveRoster(sim.wave, sim.cfg, sim.rng);
  sim.spawnMs = 300;
  sim.waveDamaged = false;
  sim.waveSize = sim.queue.length;
  sim.waveKills = 0;
  sim.events.push({ type: "wave", wave: sim.wave, boss: sim.queue[0] === "boss" });
}

const maxActive = (sim: SpaceSim) => Math.min(sim.rules.maxActiveCap, sim.rules.maxActive + Math.floor((sim.wave - 1) / 3));
const spawnInterval = (sim: SpaceSim) => Math.max(450, 2200 - sim.wave * 90) * sim.rules.spawn;

// ---- Rewards ----------------------------------------------------------------
function gainPower(sim: SpaceSim) {
  if (sim.powers.length >= MAX_POWERS) return;
  // Repair is likelier when the ship is hurt.
  const kind = sim.hp < sim.maxHp * 0.45 && rand(sim.rng) < 0.5 ? "repair" : POWER_KINDS[Math.floor(rand(sim.rng) * POWER_KINDS.length)];
  sim.powers.push(kind);
  sim.events.push({ type: "gain", kind });
}

function destroy(sim: SpaceSim, enemy: Enemy, byTyping: boolean) {
  sim.enemies = sim.enemies.filter((e) => e !== enemy);
  sim.shots = sim.shots.filter((s) => s.targetId !== enemy.id);
  if (sim.targetId === enemy.id) sim.targetId = null;
  sim.kills++;
  sim.waveKills++;
  if (byTyping) {
    sim.combo++;
    sim.bestCombo = Math.max(sim.bestCombo, sim.combo);
    if (sim.combo % 10 === 0) {
      sim.events.push({ type: "combo", combo: sim.combo });
      gainPower(sim);
    }
  }
  const base = enemy.kind === "boss" ? ENEMY_KINDS.boss.points + 100 * (sim.wave / BOSS_EVERY - 1) + SPACE_POINTS.bossBonus : ENEMY_KINDS[enemy.kind].points;
  const points = Math.round(base * comboMultiplier(sim.combo));
  sim.points += points;
  sim.events.push({ type: "kill", x: enemy.x, y: enemy.y, kind: enemy.kind, points });
  if (enemy.kind === "boss") {
    sim.bosses++;
    sim.bossId = null;
    sim.hazards = sim.hazards.filter((h) => !h.boss);
    sim.events.push({ type: "bossDown" });
    gainPower(sim);
    gainPower(sim);
  } else if (enemy.kind === "elite") gainPower(sim);
}

/** One hit lands on an enemy. */
function hit(sim: SpaceSim, enemy: Enemy, byTyping: boolean) {
  enemy.hp--;
  enemy.flashMs = 160;
  if (enemy.hp <= 0) return destroy(sim, enemy, byTyping);
  sim.events.push({ type: "hit", x: enemy.x, y: enemy.y, kind: enemy.kind, shield: enemy.kind === "armored" && enemy.hp === 1 });
}

/** Removes the active word (the enemy's next stage) without typing it. */
function skipWord(sim: SpaceSim, enemy: Enemy) {
  if (sim.targetId === enemy.id) {
    resetBuffer(enemy.buf, sim.stats);
    sim.targetId = null;
  }
  enemy.words.shift();
  if (enemy.words.length) enemy.buf = createBuffer(enemy.words[0], sim.cfg.language, "strict");
}

function fire(sim: SpaceSim, enemy: Enemy, kind: Shot["kind"] = "laser") {
  sim.shots.push({ id: sim.nextId++, targetId: enemy.id, x: PLAYER.x, y: PLAYER.y - 26, speed: sim.rapidMs > 0 ? 2.6 : 1.3, kind });
  sim.events.push({ type: "fire", x: enemy.x, y: enemy.y });
}

// ---- Input ----------------------------------------------------------------
/** Most dangerous first: the least time before it does damage. */
function danger(enemy: Enemy) {
  if (enemy.kind === "boss") return enemy.attackMs;
  if (enemy.hovering) return enemy.fuseMs;
  const speed = Math.sqrt(enemy.vx * enemy.vx + enemy.vy * enemy.vy) || 1e-6;
  return Math.max(0, enemy.goalY - enemy.y) / Math.max(1e-6, enemy.vy || speed) + (enemy.kind === "bomber" ? enemy.fuseMs : 0);
}

function miss(sim: SpaceSim) {
  if (sim.cfg.mode === "accuracy") {
    sim.combo = 0;
    sim.points = Math.max(0, sim.points - SPACE_POINTS.accuracyPenalty);
  } else sim.combo = Math.floor(sim.combo / 2);
  sim.events.push({ type: "wrong" });
}

export function spaceChar(sim: SpaceSim, char: string) {
  sim.log.push([sim.tick, 0, char]);
  if (!playing(sim)) return;
  let target = findTarget(sim);
  if (!target) {
    // The first letter locks onto the most dangerous ship whose word starts with it.
    const candidates = sim.enemies.filter((e) => isTargetable(e) && firstChar(e.buf) === char);
    if (!candidates.length) {
      countStray(sim.stats);
      return miss(sim);
    }
    target = candidates.reduce((best, e) => (danger(e) < danger(best) ? e : best));
    sim.targetId = target.id;
    if (!target.locked && target.seenAtMs !== null) {
      sim.reactionTotal += target.ageMs - target.seenAtMs;
      sim.reactionCount++;
    }
    target.locked = true;
    sim.events.push({ type: "lock" });
  }
  const result = typeChar(target.buf, char, sim.stats, elapsedMs(sim));
  if (result === "wrong") return miss(sim);
  if (result === "blocked") return;
  sim.events.push({ type: "key" });
  if (result !== "complete") return;
  // Word done: the target moves to its next word (if any) and the ship fires. The hit is applied when the shot lands.
  sim.targetId = null;
  target.words.shift();
  fire(sim, target);
  if (sim.rapidMs > 0 && target.words.length) {
    // Rapid fire: a second shot takes the next stage too.
    target.words.shift();
    fire(sim, target);
  }
  if (target.words.length) target.buf = createBuffer(target.words[0], sim.cfg.language, "strict");
}

/** Backspace removes the last letter; on an empty word it lets go of the target. */
export function spaceBackspace(sim: SpaceSim) {
  sim.log.push([sim.tick, 1]);
  if (!playing(sim)) return;
  const target = findTarget(sim);
  if (!target) return;
  backspace(target.buf, sim.stats);
  if (!target.buf.typed.length) {
    sim.targetId = null;
    sim.events.push({ type: "release" });
  }
}

/** Uses the power-up in a slot. Returns whether something happened. */
export function spacePower(sim: SpaceSim, slot: number) {
  sim.log.push([sim.tick, 2, String(slot)]);
  if (!playing(sim)) return false;
  const kind = sim.powers[slot];
  if (!kind) {
    sim.events.push({ type: "noPower" });
    return false;
  }
  const live = sim.enemies.filter((e) => !isDoomed(e) && e.introMs <= 0 && e.y > -20);
  const byDanger = [...live].sort((a, b) => danger(a) - danger(b));
  const focus = findTarget(sim) ?? byDanger[0] ?? null;
  // Attack power-ups need something to hit; they stay in the slot otherwise.
  if ((kind === "laser" || kind === "emp" || kind === "multi") && !focus) {
    sim.events.push({ type: "noPower" });
    return false;
  }
  sim.powers.splice(slot, 1);
  sim.powersUsed++;
  switch (kind) {
    case "shield": sim.shieldMs = POWER_MS.shield; break;
    case "rapid": sim.rapidMs = POWER_MS.rapid; break;
    case "slow": sim.slowMs = POWER_MS.slow; break;
    case "repair": sim.hp = Math.min(sim.maxHp, sim.hp + REPAIR_HP); break;
    case "laser": {
      // Clears the target outright; a boss loses two stages.
      const enemy = focus!;
      const stages = enemy.kind === "boss" ? Math.min(2, enemy.words.length) : enemy.words.length;
      for (let i = 0; i < stages; i++) {
        skipWord(sim, enemy);
        hit(sim, enemy, false);
        if (!sim.enemies.includes(enemy)) break;
      }
      sim.events.push({ type: "power", kind, x: enemy.x, y: enemy.y });
      return true;
    }
    case "emp": {
      const { x, y } = focus!;
      for (const enemy of live.filter((e) => dist(e.x, e.y, x, y) <= EMP_RADIUS)) {
        skipWord(sim, enemy);
        hit(sim, enemy, false);
      }
      sim.events.push({ type: "power", kind, x, y });
      return true;
    }
    case "multi":
      for (const enemy of byDanger.filter((e) => e.kind !== "boss").slice(0, MULTI_TARGETS)) {
        skipWord(sim, enemy);
        fire(sim, enemy, "missile");
      }
      break;
  }
  sim.events.push({ type: "power", kind });
  return true;
}

// ---- Time -----------------------------------------------------------------
function damagePlayer(sim: SpaceSim, amount: number) {
  if (sim.shieldMs > 0) {
    sim.events.push({ type: "blocked" });
    return;
  }
  const damage = Math.round(amount * sim.rules.damage);
  sim.hp = Math.max(0, sim.hp - damage);
  sim.waveDamaged = true;
  sim.combo = 0;
  sim.events.push({ type: "hurt", damage });
  if (sim.hp <= 0) finish(sim, "lost");
}

function finish(sim: SpaceSim, result: "won" | "lost") {
  if (sim.result) return;
  sim.result = result;
  sim.endTick = sim.tick;
  sim.targetId = null;
  if (result === "won") {
    if (sim.cfg.mode !== "survival") sim.points += sim.hp * SPACE_POINTS.healthBonus;
    if (sim.cfg.mode === "time") sim.points += SPACE_POINTS.timeBonus;
  }
  // Let the explosions play before the results appear.
  sim.endingMs = result === "lost" ? 1700 : 1300;
  sim.events.push({ type: result === "lost" ? "destroyed" : "victory" });
}

function launchHazard(sim: SpaceSim, from: Enemy, damage: number, travelMs: number, boss: boolean) {
  sim.hazards.push({ id: sim.nextId++, x: from.x, y: from.y + ENEMY_KINDS[from.kind].radius * 0.6, vx: (PLAYER.x - from.x) / travelMs, vy: (PLAYER.y - from.y) / travelMs, damage, boss });
  sim.events.push({ type: "bomb", x: from.x, y: from.y, boss });
}

function tickOnce(sim: SpaceSim) {
  sim.tick++;
  const dt = TICK_MS;
  for (const key of ["shieldMs", "rapidMs", "slowMs"] as const) if (sim[key] > 0) sim[key] = Math.max(0, sim[key] - dt);
  const slow = sim.slowMs > 0 ? SLOW_FACTOR : 1;

  if (sim.result) {
    // Finish animation: the field freezes, effects play out.
    sim.endingMs -= dt;
    if (sim.endingMs <= 0) sim.over = true;
    return;
  }

  // Waves.
  if (sim.breakMs > 0) {
    sim.breakMs -= dt;
    if (sim.breakMs <= 0) startWave(sim);
  } else if (sim.queue.length) {
    sim.spawnMs -= dt;
    const active = sim.enemies.filter((e) => e.kind !== "boss").length;
    if (sim.spawnMs <= 0 && (sim.queue[0] === "boss" || active < maxActive(sim))) {
      spawn(sim, sim.queue.shift()!);
      // Escorts trickle in more slowly during a boss fight.
      sim.spawnMs = spawnInterval(sim) * (sim.bossId !== null ? 2.4 : 1);
    }
  } else if (!sim.enemies.length && !sim.hazards.length && !sim.shots.length) {
    sim.wavesCleared++;
    sim.points += Math.round(SPACE_POINTS.waveBonus * sim.wave * (sim.waveKills / Math.max(1, sim.waveSize)));
    if (!sim.waveDamaged && sim.waveKills > 0) gainPower(sim);
    sim.events.push({ type: "waveClear" });
    const last = finalWave(sim.cfg);
    if (last !== null && sim.wave >= last) return finish(sim, "won");
    sim.breakMs = 2800;
  }

  // Enemies.
  for (const enemy of [...sim.enemies]) {
    enemy.ageMs += dt;
    if (enemy.flashMs > 0) enemy.flashMs -= dt;
    if (enemy.seenAtMs === null && isVisible(enemy)) enemy.seenAtMs = enemy.ageMs;
    const rule = ENEMY_KINDS[enemy.kind];
    if (enemy.kind === "boss") {
      if (enemy.introMs > 0) {
        enemy.introMs -= dt;
        enemy.y = Math.min(BOSS_Y, enemy.y + enemy.vy * dt);
        continue;
      }
      // Sways across the top and fires at the ship; faster in its last phase.
      enemy.x = WORLD.w / 2 + rule.weave * tri((enemy.ageMs - BOSS_INTRO_MS) / 9000);
      if (isDoomed(enemy)) continue;
      enemy.attackMs -= dt * slow;
      if (enemy.attackMs <= 0) {
        const lastPhase = enemy.hp <= enemy.maxHp / 3;
        enemy.attackMs = enemy.fuseMax * (lastPhase ? 0.75 : 1);
        launchHazard(sim, enemy, rule.damage + 3 * (sim.wave / BOSS_EVERY - 1), BOSS_SHOT_MS, true);
      }
      continue;
    }
    // Typed-out ships hold still while the shots land.
    if (isDoomed(enemy)) continue;
    if (enemy.hovering) {
      enemy.fuseMs -= dt * slow;
      if (enemy.fuseMs <= 0) {
        enemy.fuseMs = enemy.fuseMax;
        launchHazard(sim, enemy, rule.damage, BOMB_MS, false);
      }
      continue;
    }
    enemy.baseX += enemy.vx * dt * slow;
    enemy.y += enemy.vy * dt * slow;
    enemy.x = enemy.baseX + (rule.weave ? rule.weave * tri(enemy.ageMs / 2400 + enemy.weavePhase) * Math.min(1, enemy.ageMs / 1500) : 0);
    if (enemy.kind === "bomber" && enemy.y >= enemy.goalY) {
      enemy.y = enemy.goalY;
      enemy.hovering = true;
    }
    if (enemy.kind !== "bomber" && enemy.y >= DEFENSE_Y) {
      // Breached the defence line.
      sim.enemies = sim.enemies.filter((e) => e !== enemy);
      sim.shots = sim.shots.filter((s) => s.targetId !== enemy.id);
      if (sim.targetId === enemy.id) {
        resetBuffer(enemy.buf, sim.stats);
        sim.targetId = null;
      }
      sim.events.push({ type: "breach", x: enemy.x, damage: rule.damage });
      damagePlayer(sim, rule.damage);
      if (sim.result) return;
    }
  }

  // Player shots home in on their targets.
  for (const shot of [...sim.shots]) {
    const target = sim.enemies.find((e) => e.id === shot.targetId);
    if (!target) {
      sim.shots = sim.shots.filter((s) => s !== shot);
      continue;
    }
    const d = dist(shot.x, shot.y, target.x, target.y);
    const step = shot.speed * dt;
    if (d <= step + ENEMY_KINDS[target.kind].radius * 0.5) {
      sim.shots = sim.shots.filter((s) => s !== shot);
      hit(sim, target, shot.kind === "laser");
    } else {
      shot.x += ((target.x - shot.x) / d) * step;
      shot.y += ((target.y - shot.y) / d) * step;
    }
  }

  // Bombs and boss shots fly at the ship.
  for (const hazard of [...sim.hazards]) {
    hazard.x += hazard.vx * dt * slow;
    hazard.y += hazard.vy * dt * slow;
    if (hazard.y >= PLAYER.y - 18) {
      sim.hazards = sim.hazards.filter((h) => h !== hazard);
      damagePlayer(sim, hazard.damage);
      if (sim.result) return;
    }
  }

  if (sim.cfg.mode === "time" && sim.tick * TICK_MS >= sim.cfg.timeLimit * 1000) finish(sim, "won");
}

/** Advances by real time; the game itself moves in fixed ticks. */
export function stepSpace(sim: SpaceSim, dtMs: number) {
  sim.acc += dtMs;
  while (sim.acc >= TICK_MS && !sim.over) {
    sim.acc -= TICK_MS;
    tickOnce(sim);
  }
}

/** Advances exactly one tick (used by the server replay). */
export const tickSpace = tickOnce;

// ---- Outcome --------------------------------------------------------------
export type SpaceOutcome = TypingSummary & {
  timeMs: number; won: boolean; wave: number; wavesCleared: number; kills: number; bosses: number; bestCombo: number;
  avgReactionMs: number; powersUsed: number; hpLeft: number; incorrect: number; score: ScoreBreakdown;
};

export function spaceOutcome(sim: SpaceSim): SpaceOutcome {
  const timeMs = elapsedMs(sim);
  const summary = summarize(sim.stats, timeMs);
  // Accuracy Challenge doubles the accuracy reward.
  const base = sim.points + (sim.cfg.mode === "accuracy" ? Math.round(sim.points * accuracyRate(summary.accuracy)) : 0);
  const score = scoreBreakdown({ base, accuracy: summary.accuracy, wpm: summary.wpm, bestStreak: summary.bestStreak, difficulty: sim.cfg.difficulty });
  return {
    ...summary, timeMs, won: sim.result === "won", wave: sim.wave, wavesCleared: sim.wavesCleared, kills: sim.kills, bosses: sim.bosses, bestCombo: sim.bestCombo,
    avgReactionMs: sim.reactionCount ? Math.round(sim.reactionTotal / sim.reactionCount) : 0, powersUsed: sim.powersUsed, hpLeft: sim.hp, incorrect: summary.mistakes, score,
  };
}
