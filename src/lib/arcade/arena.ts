// Typing Battle Arena simulation. The wizard casts a spell by typing the word
// shown on it; the enemy attacks on a visible timer. Pure logic only.
import { createRng, pickWord, shiftClass, type Rng, type WordClass } from "@/lib/arcade/content";
import { byDifficulty, DIFFICULTY_INDEX, languagePace, type ArcadeDifficulty } from "@/lib/arcade/difficulty";
import { scoreBreakdown, type ScoreBreakdown } from "@/lib/arcade/scoring";
import { backspace, bufferSpeed, countStray, createBuffer, createStats, firstChar, resetBuffer, summarize, typeChar, type TypeBuffer, type TypingStats, type TypingSummary } from "@/lib/arcade/typing-core";
import type { Language } from "@/types";

export const ARENAS = ["forest", "ice", "volcano"] as const;
export type ArenaId = (typeof ARENAS)[number];
const ARENA_SCALE: Record<ArenaId, { hp: number; atk: number }> = { forest: { hp: 1, atk: 1 }, ice: { hp: 1.25, atk: 1.15 }, volcano: { hp: 1.5, atk: 1.3 } };

export const SPELL_IDS = ["fireball", "ice", "lightning", "shield", "ultimate"] as const;
export type SpellId = (typeof SPELL_IDS)[number];
type SpellRule = { mana: number; cooldownMs: number; damage: number; words: WordClass };
/** Bigger spells need longer words, more mana and a longer cooldown. */
export const SPELLS: Record<SpellId, SpellRule> = {
  fireball: { mana: 8, cooldownMs: 700, damage: 14, words: "short" },
  ice: { mana: 14, cooldownMs: 5000, damage: 10, words: "medium" },
  lightning: { mana: 24, cooldownMs: 8000, damage: 40, words: "long" },
  shield: { mana: 12, cooldownMs: 5500, damage: 0, words: "medium" },
  ultimate: { mana: 0, cooldownMs: 0, damage: 95, words: "phrase" },
};
const SHIELD_MS = 5000;
const SLOW_MS = 5000;
const MAX_MANA = 100;
const MANA_PER_SECOND = 4;
const INTERMISSION_MS = 2600;

export type EnemyKind = "slime" | "imp" | "beast" | "golem" | "mage" | "boss";
type EnemyRule = { hp: number; atk: number; intervalMs: number; /** Share of damage ignored (lightning pierces it). */ armor: number; /** Heals itself instead of every third attack. */ heals: number };
export const ENEMIES: Record<EnemyKind, EnemyRule> = {
  slime: { hp: 40, atk: 8, intervalMs: 5200, armor: 0, heals: 0 },
  imp: { hp: 55, atk: 10, intervalMs: 4300, armor: 0, heals: 0 },
  beast: { hp: 70, atk: 12, intervalMs: 3700, armor: 0, heals: 0 },
  golem: { hp: 105, atk: 18, intervalMs: 6000, armor: 0.4, heals: 0 },
  mage: { hp: 80, atk: 14, intervalMs: 4600, armor: 0, heals: 10 },
  boss: { hp: 210, atk: 21, intervalMs: 4400, armor: 0.15, heals: 0 },
};
/** The enemies of each arena, in order. The last one is the boss. */
export const ARENA_ROSTER: Record<ArenaId, EnemyKind[]> = {
  forest: ["slime", "imp", "beast", "boss"],
  ice: ["imp", "beast", "golem", "mage", "boss"],
  volcano: ["beast", "golem", "mage", "golem", "boss"],
};

export type Enemy = { kind: EnemyKind; index: number; hp: number; maxHp: number; atk: number; intervalMs: number; /** Time until the next attack. */ attackMs: number; slowMs: number; attacks: number; enraged: boolean };
export type Slot = { spell: SpellId; buf: TypeBuffer; /** Remaining cooldown. */ cooldownMs: number };

export type ArenaEvent =
  | { type: "key" | "wrong" | "lock" | "noMana" | "ultReady" | "enemyDown" | "nextEnemy" | "enrage" | "won" | "lost" }
  | { type: "cast"; spell: SpellId; damage: number; crit: boolean; power: number }
  | { type: "enemyAttack"; damage: number; blocked: boolean }
  | { type: "enemyHeal"; amount: number };

export type ArenaConfig = { language: Language; difficulty: ArcadeDifficulty; arena: ArenaId; spells: SpellId[]; seed: number };

export type ArenaSim = {
  cfg: ArenaConfig;
  rng: Rng;
  hp: number; maxHp: number;
  mana: number;
  shieldMs: number;
  slots: Slot[];
  /** Index of the spell being typed. */
  active: number | null;
  roster: EnemyKind[];
  enemy: Enemy | null;
  /** Pause between enemies. */
  intermissionMs: number;
  stats: TypingStats;
  /** Clean casts in a row. */
  combo: number; bestCombo: number;
  /** 0-100, charges the ultimate. */
  ult: number;
  crits: number; casts: number;
  damageTaken: number; damageDealt: number;
  defeated: number;
  points: number;
  elapsedMs: number;
  over: "won" | "lost" | null;
  events: ArenaEvent[];
};

function makeEnemy(sim: ArenaSim, index: number): Enemy {
  const kind = sim.roster[index];
  const rule = ENEMIES[kind], scale = ARENA_SCALE[sim.cfg.arena];
  const hp = Math.round(rule.hp * scale.hp * byDifficulty(sim.cfg.difficulty, [0.8, 1, 1.25, 1.5]));
  const atk = Math.round(rule.atk * scale.atk * byDifficulty(sim.cfg.difficulty, [0.7, 1, 1.2, 1.45]));
  // Khmer casts take more keystrokes, so enemies give a little more time.
  const intervalMs = Math.round((rule.intervalMs * byDifficulty(sim.cfg.difficulty, [1.3, 1, 0.88, 0.76])) / (0.5 + languagePace(sim.cfg.language) / 2));
  return { kind, index, hp, maxHp: hp, atk, intervalMs, attackMs: intervalMs + 800, slowMs: 0, attacks: 0, enraged: false };
}

function wordClassFor(sim: ArenaSim, spell: SpellId): WordClass {
  const level = DIFFICULTY_INDEX[sim.cfg.difficulty];
  const cls = SPELLS[spell].words;
  if (level === 0) return spell === "ultimate" ? "long" : shiftClass(cls, -1);
  if (level === 3 && spell === "fireball") return "medium";
  return cls;
}

function newWord(sim: ArenaSim, spell: SpellId, skip?: Slot) {
  const others = sim.slots.filter((s) => s !== skip);
  const word = pickWord(sim.rng, sim.cfg.language, wordClassFor(sim, spell), new Set(others.map((s) => firstChar(s.buf))), new Set(sim.slots.map((s) => s.buf.text)));
  return createBuffer(word, sim.cfg.language, "free");
}

export function createArena(cfg: ArenaConfig): ArenaSim {
  const sim: ArenaSim = {
    cfg, rng: createRng(cfg.seed), hp: 100, maxHp: 100, mana: 60, shieldMs: 0, slots: [], active: null, roster: ARENA_ROSTER[cfg.arena], enemy: null, intermissionMs: 1200,
    stats: createStats(), combo: 0, bestCombo: 0, ult: 0, crits: 0, casts: 0, damageTaken: 0, damageDealt: 0, defeated: 0, points: 0, elapsedMs: 0, over: null, events: [],
  };
  const spells = SPELL_IDS.filter((id) => id === "ultimate" || cfg.spells.includes(id));
  for (const spell of spells) {
    const slot: Slot = { spell, buf: createBuffer("", cfg.language, "free"), cooldownMs: 0 };
    sim.slots.push(slot);
    slot.buf = newWord(sim, spell, slot);
  }
  return sim;
}

/** Why a spell cannot be started right now, or null when it can. */
export function slotBlock(sim: ArenaSim, slot: Slot): "cooldown" | "mana" | "charge" | null {
  if (slot.spell === "ultimate") return sim.ult >= 100 ? null : "charge";
  if (slot.cooldownMs > 0) return "cooldown";
  if (sim.mana < SPELLS[slot.spell].mana) return "mana";
  return null;
}

/** A cast counts as fast (and can crit) above this many characters per second. */
export const critSpeed = (language: Language) => 4 * languagePace(language);

function cast(sim: ArenaSim, slot: Slot) {
  const rule = SPELLS[slot.spell];
  const clean = slot.buf.mistakes === 0;
  // Accuracy decides how hard the spell hits: every mistake on the word weakens it.
  const power = Math.max(0.5, 1 - 0.12 * slot.buf.mistakes);
  const crit = clean && rule.damage > 0 && bufferSpeed(slot.buf, sim.elapsedMs) >= critSpeed(sim.cfg.language);
  sim.combo = clean ? sim.combo + 1 : 0;
  sim.bestCombo = Math.max(sim.bestCombo, sim.combo);
  sim.casts++;
  if (crit) sim.crits++;
  sim.mana -= rule.mana;
  let damage = 0;
  const enemy = sim.enemy;
  if (rule.damage > 0 && enemy) {
    const armor = slot.spell === "lightning" || slot.spell === "ultimate" ? 0 : ENEMIES[enemy.kind].armor;
    damage = Math.max(1, Math.round(rule.damage * power * (1 + Math.min(sim.combo, 10) * 0.05) * (crit ? 1.5 : 1) * (1 - armor)));
    enemy.hp = Math.max(0, enemy.hp - damage);
    sim.damageDealt += damage;
    if (slot.spell === "ice") enemy.slowMs = SLOW_MS;
  }
  if (slot.spell === "shield") sim.shieldMs = SHIELD_MS * power;
  if (slot.spell === "ultimate") sim.ult = 0;
  slot.cooldownMs = rule.cooldownMs;
  slot.buf = newWord(sim, slot.spell, slot);
  sim.active = null;
  sim.events.push({ type: "cast", spell: slot.spell, damage, crit, power });
  if (enemy && enemy.hp <= 0) defeatEnemy(sim, enemy);
  else if (enemy && enemy.kind === "boss" && !enemy.enraged && enemy.hp <= enemy.maxHp * 0.4) {
    // Second phase: a wounded boss attacks faster.
    enemy.enraged = true;
    enemy.intervalMs = Math.round(enemy.intervalMs * 0.75);
    sim.events.push({ type: "enrage" });
  }
}

function defeatEnemy(sim: ArenaSim, enemy: Enemy) {
  sim.defeated++;
  sim.points += enemy.kind === "boss" ? 700 : 120 + enemy.index * 60;
  sim.enemy = null;
  sim.events.push({ type: "enemyDown" });
  if (sim.defeated >= sim.roster.length) {
    sim.points += sim.hp * 5 + sim.crits * 20;
    sim.over = "won";
    sim.events.push({ type: "won" });
  } else {
    sim.intermissionMs = INTERMISSION_MS;
  }
}

function miss(sim: ArenaSim) {
  sim.ult = Math.max(0, sim.ult - 12);
  sim.events.push({ type: "wrong" });
}

export function arenaChar(sim: ArenaSim, char: string) {
  // Nothing to aim at between enemies, so keys are ignored (no penalty) until the next one arrives.
  if (sim.over || !sim.enemy) return;
  if (sim.active === null) {
    // The first letter chooses the spell.
    const matches = sim.slots.filter((s) => firstChar(s.buf) === char);
    const slot = matches.find((s) => slotBlock(sim, s) === null);
    if (!slot) {
      countStray(sim.stats);
      if (matches.some((s) => slotBlock(sim, s) === "mana")) sim.events.push({ type: "noMana" });
      return miss(sim);
    }
    sim.active = sim.slots.indexOf(slot);
    sim.events.push({ type: "lock" });
  }
  const slot = sim.slots[sim.active];
  const result = typeChar(slot.buf, char, sim.stats, sim.elapsedMs);
  if (result === "blocked") return;
  if (result === "wrong") return miss(sim);
  sim.mana = Math.min(MAX_MANA, sim.mana + 1);
  const hadUlt = sim.ult >= 100;
  sim.ult = Math.min(100, sim.ult + 2.2);
  if (!hadUlt && sim.ult >= 100) sim.events.push({ type: "ultReady" });
  sim.events.push({ type: "key" });
  if (result === "complete") cast(sim, slot);
}

/** Backspace fixes a mistake; on an empty word it lets go of the spell. */
export function arenaBackspace(sim: ArenaSim) {
  if (sim.over || sim.active === null) return;
  const slot = sim.slots[sim.active];
  backspace(slot.buf, sim.stats);
  if (!slot.buf.typed.length) {
    resetBuffer(slot.buf, sim.stats);
    slot.buf.mistakes = 0;
    sim.active = null;
  }
}

export function stepArena(sim: ArenaSim, dtMs: number) {
  if (sim.over) return;
  sim.elapsedMs += dtMs;
  sim.mana = Math.min(MAX_MANA, sim.mana + (MANA_PER_SECOND * dtMs) / 1000);
  if (sim.shieldMs > 0) sim.shieldMs = Math.max(0, sim.shieldMs - dtMs);
  for (const slot of sim.slots) if (slot.cooldownMs > 0) slot.cooldownMs = Math.max(0, slot.cooldownMs - dtMs);

  if (!sim.enemy) {
    sim.intermissionMs -= dtMs;
    if (sim.intermissionMs > 0) return;
    if (sim.defeated > 0) {
      // A short rest between fights.
      sim.hp = Math.min(sim.maxHp, sim.hp + 15);
      sim.mana = Math.min(MAX_MANA, sim.mana + 30);
    }
    sim.enemy = makeEnemy(sim, sim.defeated);
    sim.events.push({ type: "nextEnemy" });
    return;
  }

  const enemy = sim.enemy;
  if (enemy.slowMs > 0) enemy.slowMs = Math.max(0, enemy.slowMs - dtMs);
  enemy.attackMs -= dtMs * (enemy.slowMs > 0 ? 0.45 : 1);
  if (enemy.attackMs > 0) return;
  enemy.attackMs = enemy.intervalMs;
  enemy.attacks++;
  const heals = ENEMIES[enemy.kind].heals;
  if (heals && enemy.attacks % 3 === 0 && enemy.hp < enemy.maxHp) {
    const amount = Math.min(enemy.maxHp - enemy.hp, heals);
    enemy.hp += amount;
    sim.events.push({ type: "enemyHeal", amount });
    return;
  }
  const blocked = sim.shieldMs > 0;
  const damage = blocked ? Math.round(enemy.atk * 0.15) : enemy.atk;
  if (blocked) sim.shieldMs = 0;
  sim.hp = Math.max(0, sim.hp - damage);
  sim.damageTaken += damage;
  sim.events.push({ type: "enemyAttack", damage, blocked });
  if (sim.hp <= 0) {
    sim.over = "lost";
    sim.events.push({ type: "lost" });
  }
}

export type ArenaOutcome = TypingSummary & { timeMs: number; won: boolean; defeated: number; total: number; crits: number; casts: number; bestCombo: number; hpLeft: number; damageDealt: number; damageTaken: number; score: ScoreBreakdown };

export function arenaOutcome(sim: ArenaSim): ArenaOutcome {
  const summary = summarize(sim.stats, sim.elapsedMs);
  const score = scoreBreakdown({ base: sim.points, accuracy: summary.accuracy, wpm: summary.wpm, bestStreak: summary.bestStreak, difficulty: sim.cfg.difficulty });
  return { ...summary, timeMs: sim.elapsedMs, won: sim.over === "won", defeated: sim.defeated, total: sim.roster.length, crits: sim.crits, casts: sim.casts, bestCombo: sim.bestCombo, hpLeft: sim.hp, damageDealt: sim.damageDealt, damageTaken: sim.damageTaken, score };
}
