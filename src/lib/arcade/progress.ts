// Arcade progression: XP, per-game statistics, result history, achievements and
// unlockable content. Stored on the device like the rest of the learner's
// progress (see local-progress.ts). applyResult() is pure so it can be tested.
import { isArcadeDifficulty, type ArcadeDifficulty } from "@/lib/arcade/difficulty";
import { levelFromArcadeXp, xpForResult } from "@/lib/arcade/scoring";
import { parseStored, readRaw, writeRaw } from "@/lib/local-progress";
import type { Language } from "@/types";

export const ARCADE_GAMES = ["car-racing", "zombie-survival", "battle-arena", "space-shooter"] as const;
export type ArcadeGameId = (typeof ARCADE_GAMES)[number];

/** What a game reports when a run ends. */
export type ArcadeResult = {
  game: ArcadeGameId;
  language: Language;
  difficulty: ArcadeDifficulty;
  score: number;
  wpm: number;
  cpm: number;
  accuracy: number;
  mistakes: number;
  correctChars: number;
  bestStreak: number;
  durationMs: number;
  won: boolean;
  /** Short label for the history list, e.g. "Wave 7" or "2nd place". */
  detail?: string;
  /** Counters added to the game's lifetime totals (kills, nitro boosts…). */
  sum?: Record<string, number>;
  /** Values kept as lifetime bests (highest wave…). */
  max?: Record<string, number>;
};

export type GameStats = {
  plays: number;
  wins: number;
  bestScore: number;
  bestWpm: number;
  bestAccuracy: number;
  bestStreak: number;
  totalMs: number;
  sum: Record<string, number>;
  max: Record<string, number>;
};

export type HistoryEntry = { game: ArcadeGameId; at: string; score: number; wpm: number; accuracy: number; difficulty: ArcadeDifficulty; language: Language; won: boolean; detail?: string };

export type ArcadeStore = {
  version: 1;
  xp: number;
  games: Partial<Record<ArcadeGameId, GameStats>>;
  /** Newest last. */
  history: HistoryEntry[];
  /** Achievement id → ISO time earned. */
  achievements: Record<string, string>;
  /** Unlock ids earned so far. */
  unlocks: string[];
  /** Chosen car, paint, track, stage, arena… keyed by option name. */
  loadout: Record<string, string>;
  music: boolean;
};

export const ARCADE_KEY = "dlt.arcade.v1";
export const MAX_HISTORY = 60;
export const EMPTY_STATS: GameStats = { plays: 0, wins: 0, bestScore: 0, bestWpm: 0, bestAccuracy: 0, bestStreak: 0, totalMs: 0, sum: {}, max: {} };
export const EMPTY_ARCADE: ArcadeStore = { version: 1, xp: 0, games: {}, history: [], achievements: {}, unlocks: [], loadout: {}, music: true };

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const num = (value: unknown) => (typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0);
const numMap = (value: unknown): Record<string, number> => (isRecord(value) ? Object.fromEntries(Object.entries(value).filter(([, v]) => typeof v === "number" && Number.isFinite(v)).map(([k, v]) => [k, v as number])) : {});
const isGameId = (value: unknown): value is ArcadeGameId => ARCADE_GAMES.includes(value as ArcadeGameId);

export function validateArcade(value: unknown): ArcadeStore | null {
  if (!isRecord(value)) return null;
  const games: ArcadeStore["games"] = {};
  if (isRecord(value.games)) {
    for (const id of ARCADE_GAMES) {
      const g = value.games[id];
      if (isRecord(g)) games[id] = { plays: num(g.plays), wins: num(g.wins), bestScore: num(g.bestScore), bestWpm: num(g.bestWpm), bestAccuracy: num(g.bestAccuracy), bestStreak: num(g.bestStreak), totalMs: num(g.totalMs), sum: numMap(g.sum), max: numMap(g.max) };
    }
  }
  const history: HistoryEntry[] = [];
  if (Array.isArray(value.history)) {
    for (const h of value.history.slice(-MAX_HISTORY)) {
      if (!isRecord(h) || !isGameId(h.game) || typeof h.at !== "string" || !isArcadeDifficulty(h.difficulty)) continue;
      history.push({ game: h.game, at: h.at, score: num(h.score), wpm: num(h.wpm), accuracy: num(h.accuracy), difficulty: h.difficulty, language: h.language === "khmer" ? "khmer" : "english", won: h.won === true, ...(typeof h.detail === "string" ? { detail: h.detail.slice(0, 60) } : {}) });
    }
  }
  const strMap = (v: unknown): Record<string, string> => (isRecord(v) ? Object.fromEntries(Object.entries(v).filter(([, x]) => typeof x === "string")) as Record<string, string> : {});
  return {
    version: 1,
    xp: num(value.xp),
    games,
    history,
    achievements: strMap(value.achievements),
    unlocks: Array.isArray(value.unlocks) ? Array.from(new Set(value.unlocks.filter((u): u is string => typeof u === "string"))) : [],
    loadout: strMap(value.loadout),
    music: value.music !== false,
  };
}

export const statsFor = (store: ArcadeStore, game: ArcadeGameId): GameStats => store.games[game] ?? EMPTY_STATS;
export const totalPlays = (store: ArcadeStore) => ARCADE_GAMES.reduce((n, id) => n + statsFor(store, id).plays, 0);

// ---- Achievements -----------------------------------------------------------
export type AchievementDef = { id: string; icon: string; game: ArcadeGameId | null; earned: (store: ArcadeStore, result: ArcadeResult) => boolean };

const inGame = (game: ArcadeGameId, test: (store: ArcadeStore, result: ArcadeResult) => boolean) => (store: ArcadeStore, result: ArcadeResult) => result.game === game && test(store, result);

/** Titles and descriptions live in the dictionary as `ach.<id>.t` / `ach.<id>.d`. */
export const ACHIEVEMENTS: readonly AchievementDef[] = [
  { id: "first-game", icon: "🎮", game: null, earned: (s) => totalPlays(s) >= 1 },
  { id: "sharpshooter", icon: "🎯", game: null, earned: (_, r) => r.accuracy >= 95 && r.correctChars >= 60 },
  { id: "swift-fingers", icon: "💨", game: null, earned: (_, r) => r.wpm >= 40 && r.correctChars >= 60 },
  { id: "lightning-hands", icon: "⚡", game: null, earned: (_, r) => r.wpm >= 60 && r.correctChars >= 60 },
  { id: "streak-50", icon: "🔥", game: null, earned: (_, r) => r.bestStreak >= 50 },
  { id: "streak-100", icon: "🌋", game: null, earned: (_, r) => r.bestStreak >= 100 },
  { id: "all-rounder", icon: "🧭", game: null, earned: (s) => ARCADE_GAMES.every((id) => statsFor(s, id).plays >= 1) },
  { id: "veteran", icon: "🎖️", game: null, earned: (s) => totalPlays(s) >= 25 },
  { id: "race-finish", icon: "🏁", game: "car-racing", earned: inGame("car-racing", () => true) },
  { id: "race-win", icon: "🥇", game: "car-racing", earned: inGame("car-racing", (_, r) => r.won) },
  { id: "race-nitro", icon: "🚀", game: "car-racing", earned: inGame("car-racing", (_, r) => (r.sum?.nitro ?? 0) >= 3) },
  { id: "race-clean", icon: "✨", game: "car-racing", earned: inGame("car-racing", (_, r) => r.won && r.accuracy >= 97) },
  { id: "race-expert", icon: "👑", game: "car-racing", earned: inGame("car-racing", (_, r) => r.won && r.difficulty === "expert") },
  { id: "zombie-wave5", icon: "🧟", game: "zombie-survival", earned: inGame("zombie-survival", (_, r) => (r.max?.wave ?? 0) >= 5) },
  { id: "zombie-wave10", icon: "💀", game: "zombie-survival", earned: inGame("zombie-survival", (_, r) => (r.max?.wave ?? 0) >= 10) },
  { id: "zombie-boss", icon: "👹", game: "zombie-survival", earned: inGame("zombie-survival", (_, r) => (r.sum?.bosses ?? 0) >= 1) },
  { id: "zombie-untouched", icon: "🛡️", game: "zombie-survival", earned: inGame("zombie-survival", (_, r) => (r.max?.flawlessWaves ?? 0) >= 3) },
  { id: "zombie-hunter", icon: "🏹", game: "zombie-survival", earned: inGame("zombie-survival", (s) => (statsFor(s, "zombie-survival").sum.kills ?? 0) >= 200) },
  { id: "arena-victory", icon: "🏆", game: "battle-arena", earned: inGame("battle-arena", (_, r) => r.won) },
  { id: "arena-resilient", icon: "💚", game: "battle-arena", earned: inGame("battle-arena", (_, r) => r.won && (r.max?.hpLeft ?? 0) >= 70) },
  { id: "arena-crits", icon: "💥", game: "battle-arena", earned: inGame("battle-arena", (_, r) => (r.sum?.crits ?? 0) >= 5) },
  { id: "arena-dragon", icon: "🐉", game: "battle-arena", earned: inGame("battle-arena", (_, r) => r.won && (r.difficulty === "hard" || r.difficulty === "expert")) },
  { id: "arena-archmage", icon: "🧙", game: "battle-arena", earned: inGame("battle-arena", (s) => ["forest", "ice", "volcano"].every((a) => (statsFor(s, "battle-arena").sum[`cleared_${a}`] ?? 0) >= 1)) },
  { id: "space-first-contact", icon: "👽", game: "space-shooter", earned: inGame("space-shooter", (_, r) => (r.sum?.kills ?? 0) >= 1) },
  { id: "space-defender", icon: "🛰️", game: "space-shooter", earned: inGame("space-shooter", (s) => (statsFor(s, "space-shooter").sum.kills ?? 0) >= 100) },
  { id: "space-galaxy", icon: "🌌", game: "space-shooter", earned: inGame("space-shooter", (_, r) => (r.max?.wave ?? 0) >= 10) },
  { id: "space-boss", icon: "🛸", game: "space-shooter", earned: inGame("space-shooter", (_, r) => (r.sum?.bosses ?? 0) >= 1) },
  { id: "space-perfect", icon: "💎", game: "space-shooter", earned: inGame("space-shooter", (_, r) => r.won && r.accuracy === 100 && r.correctChars >= 50) },
  { id: "space-speed", icon: "☄️", game: "space-shooter", earned: inGame("space-shooter", (_, r) => r.wpm >= 50 && r.correctChars >= 60) },
  { id: "space-combo", icon: "🔗", game: "space-shooter", earned: inGame("space-shooter", (_, r) => (r.max?.combo ?? 0) >= 20) },
  { id: "space-survivor", icon: "⏳", game: "space-shooter", earned: inGame("space-shooter", (_, r) => (r.max?.survivalMs ?? 0) >= 300000) },
  { id: "space-elite", icon: "🎖️", game: "space-shooter", earned: inGame("space-shooter", (_, r) => r.won && r.difficulty === "expert") },
];

// ---- Unlockable content -----------------------------------------------------
export type UnlockKind = "car" | "paint" | "track" | "stage" | "spell" | "arena";
export type UnlockDef = { id: string; kind: UnlockKind; game: ArcadeGameId; unlocked: (store: ArcadeStore) => boolean };

const race = (s: ArcadeStore) => statsFor(s, "car-racing");
const zombie = (s: ArcadeStore) => statsFor(s, "zombie-survival");
const arena = (s: ArcadeStore) => statsFor(s, "battle-arena");

/**
 * Everything not listed here is available from the start. Unlocks are earned by
 * playing only (never bought) and change looks or open new places, not power.
 * Names and requirements live in the dictionary as `unl.<id>` / `unl.<id>.how`.
 */
export const UNLOCKS: readonly UnlockDef[] = [
  { id: "car:falcon", kind: "car", game: "car-racing", unlocked: (s) => race(s).plays >= 2 },
  { id: "car:viper", kind: "car", game: "car-racing", unlocked: (s) => race(s).wins >= 1 },
  { id: "car:titan", kind: "car", game: "car-racing", unlocked: (s) => race(s).bestWpm >= 45 || race(s).wins >= 5 },
  { id: "paint:gold", kind: "paint", game: "car-racing", unlocked: (s) => race(s).wins >= 3 },
  { id: "paint:midnight", kind: "paint", game: "car-racing", unlocked: (s) => race(s).plays >= 5 },
  { id: "paint:neon", kind: "paint", game: "car-racing", unlocked: (s) => race(s).bestStreak >= 80 },
  { id: "track:desert", kind: "track", game: "car-racing", unlocked: (s) => race(s).plays >= 1 },
  { id: "track:city", kind: "track", game: "car-racing", unlocked: (s) => (race(s).sum.winsMediumUp ?? 0) >= 1 },
  { id: "stage:street", kind: "stage", game: "zombie-survival", unlocked: (s) => (zombie(s).max.wave ?? 0) >= 4 },
  { id: "stage:lab", kind: "stage", game: "zombie-survival", unlocked: (s) => (zombie(s).max.wave ?? 0) >= 8 },
  { id: "spell:ice", kind: "spell", game: "battle-arena", unlocked: (s) => (arena(s).sum.defeated ?? 0) >= 2 },
  { id: "spell:lightning", kind: "spell", game: "battle-arena", unlocked: (s) => (arena(s).sum.defeated ?? 0) >= 6 },
  { id: "arena:ice", kind: "arena", game: "battle-arena", unlocked: (s) => (arena(s).sum.cleared_forest ?? 0) >= 1 },
  { id: "arena:volcano", kind: "arena", game: "battle-arena", unlocked: (s) => (arena(s).sum.cleared_ice ?? 0) >= 1 },
];

const LOCKED = new Set(UNLOCKS.map((u) => u.id));
/** True when an option (e.g. "car:viper") can be used. Options without an unlock rule are always available. */
export const isUnlocked = (store: ArcadeStore, id: string) => !LOCKED.has(id) || store.unlocks.includes(id);

// ---- Applying a result ------------------------------------------------------
export type ResultOutcome = { store: ArcadeStore; xpGained: number; levelBefore: number; levelAfter: number; newAchievements: string[]; newUnlocks: string[]; isBestScore: boolean; previousBest: number };

export function applyResult(store: ArcadeStore, result: ArcadeResult, nowIso: string): ResultOutcome {
  const previous = statsFor(store, result.game);
  const sum = { ...previous.sum };
  for (const [key, value] of Object.entries(result.sum ?? {})) sum[key] = (sum[key] ?? 0) + value;
  const max = { ...previous.max };
  for (const [key, value] of Object.entries(result.max ?? {})) max[key] = Math.max(max[key] ?? 0, value);
  const stats: GameStats = {
    plays: previous.plays + 1,
    wins: previous.wins + (result.won ? 1 : 0),
    bestScore: Math.max(previous.bestScore, result.score),
    bestWpm: Math.max(previous.bestWpm, result.wpm),
    bestAccuracy: Math.max(previous.bestAccuracy, result.accuracy),
    bestStreak: Math.max(previous.bestStreak, result.bestStreak),
    totalMs: previous.totalMs + Math.max(0, result.durationMs),
    sum,
    max,
  };
  const xpGained = xpForResult(result.score, result.won);
  const entry: HistoryEntry = { game: result.game, at: nowIso, score: result.score, wpm: result.wpm, accuracy: result.accuracy, difficulty: result.difficulty, language: result.language, won: result.won, ...(result.detail ? { detail: result.detail } : {}) };
  let next: ArcadeStore = { ...store, xp: store.xp + xpGained, games: { ...store.games, [result.game]: stats }, history: [...store.history, entry].slice(-MAX_HISTORY) };

  const newAchievements = ACHIEVEMENTS.filter((a) => !next.achievements[a.id] && a.earned(next, result)).map((a) => a.id);
  if (newAchievements.length) next = { ...next, achievements: { ...next.achievements, ...Object.fromEntries(newAchievements.map((id) => [id, nowIso])) } };
  const newUnlocks = UNLOCKS.filter((u) => !next.unlocks.includes(u.id) && u.unlocked(next)).map((u) => u.id);
  if (newUnlocks.length) next = { ...next, unlocks: [...next.unlocks, ...newUnlocks] };

  return { store: next, xpGained, levelBefore: levelFromArcadeXp(store.xp), levelAfter: levelFromArcadeXp(next.xp), newAchievements, newUnlocks, isBestScore: result.score > previous.bestScore, previousBest: previous.bestScore };
}

// ---- Storage ----------------------------------------------------------------
export const readArcade = (): ArcadeStore => parseStored(readRaw(ARCADE_KEY), EMPTY_ARCADE, validateArcade);

export function recordArcadeResult(result: ArcadeResult, now = new Date()): ResultOutcome {
  const outcome = applyResult(readArcade(), result, now.toISOString());
  writeRaw(ARCADE_KEY, JSON.stringify(outcome.store));
  return outcome;
}

export function updateArcade(patch: Partial<Pick<ArcadeStore, "music">> & { loadout?: Record<string, string> }) {
  const store = readArcade();
  writeRaw(ARCADE_KEY, JSON.stringify({ ...store, ...(patch.music === undefined ? {} : { music: patch.music }), loadout: { ...store.loadout, ...patch.loadout } }));
}

/**
 * The saved choice for a loadout slot, if it is still valid and unlocked;
 * otherwise the fallback. `kind` is the unlock prefix (e.g. "car" → "car:viper").
 */
export function loadoutChoice<T extends string>(store: ArcadeStore, key: string, allowed: readonly T[], fallback: T, kind?: UnlockKind): T {
  const saved = store.loadout[key] as T | undefined;
  if (saved === undefined || !allowed.includes(saved)) return fallback;
  return kind && !isUnlocked(store, `${kind}:${saved}`) ? fallback : saved;
}
