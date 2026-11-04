// Wire format + validation shared by the sync route and the client.
export type SyncScore = { best: number; bestWpm: number; bestAccuracy: number; plays: number };
import { parsePetSync, type PetSync } from "@/lib/pets/pet-sync";

export type SyncKeyStat = { n: number; e: number; ms: number; t: number };
export type SyncKeyStats = Record<"english" | "khmer", Record<string, SyncKeyStat>>;
export type SyncPayload = {
  deviceId: string;
  scores: Record<string, SyncScore>;
  levels: Record<string, { stars: number; score: number }>;
  /** Level progress of the other level-based games, keyed by game id. */
  gameLevels?: Record<string, Record<string, { stars: number; score: number }>>;
  practice: Record<string, { bestWpm: number; bestAccuracy: number }>;
  settings?: Record<string, unknown>;
  /** Request: this device's own totals. Response: the sum of the account's OTHER devices. */
  keyStats?: SyncKeyStats;
  /** Active pets, unlocks and pet settings. Merged by the server (union of unlocks, latest change wins). */
  pets?: PetSync;
};
/** Level-based games, besides Mario Khmer Quest (which uses `levels`), whose progress syncs. */
export const EXTRA_LEVEL_GAMES: readonly string[] = ["english-quest"];
export type SyncState = Omit<SyncPayload, "deviceId">;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VARIANT = /^[a-z0-9:_-]{1,80}$/;
const MAX_ENTRIES = 500;
const MAX_KEYS_PER_LANGUAGE = 400;

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const int = (v: unknown, max: number) => (typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(0, Math.round(v))) : 0);

/** Returns a sanitized payload or null if the body is not acceptable. */
export function parsePayload(body: unknown): SyncPayload | null {
  if (!isRecord(body) || typeof body.deviceId !== "string" || !UUID.test(body.deviceId)) return null;
  const out: SyncPayload = { deviceId: body.deviceId.toLowerCase(), scores: {}, levels: {}, practice: {} };

  if (isRecord(body.scores)) {
    for (const [key, v] of Object.entries(body.scores).slice(0, MAX_ENTRIES)) {
      if (!VARIANT.test(key) || !isRecord(v)) continue;
      out.scores[key] = { best: int(v.best, 1e9), bestWpm: int(v.bestWpm, 1000), bestAccuracy: int(v.bestAccuracy, 100), plays: int(v.plays, 1e7) };
    }
  }
  if (isRecord(body.levels)) {
    for (const [key, v] of Object.entries(body.levels).slice(0, MAX_ENTRIES)) {
      const level = Number(key);
      if (!Number.isInteger(level) || level < 1 || level > 999 || !isRecord(v)) continue;
      out.levels[String(level)] = { stars: int(v.stars, 3), score: int(v.score, 1e9) };
    }
  }
  if (isRecord(body.gameLevels)) {
    const gameLevels: NonNullable<SyncPayload["gameLevels"]> = {};
    for (const game of EXTRA_LEVEL_GAMES) {
      const src = body.gameLevels[game];
      if (!isRecord(src)) continue;
      const levels: Record<string, { stars: number; score: number }> = {};
      for (const [key, v] of Object.entries(src).slice(0, MAX_ENTRIES)) {
        const level = Number(key);
        if (!Number.isInteger(level) || level < 1 || level > 999 || !isRecord(v)) continue;
        levels[String(level)] = { stars: int(v.stars, 3), score: int(v.score, 1e9) };
      }
      gameLevels[game] = levels;
    }
    out.gameLevels = gameLevels;
  }
  if (isRecord(body.practice)) {
    for (const language of ["english", "khmer"]) {
      const v = body.practice[language];
      if (isRecord(v)) out.practice[language] = { bestWpm: int(v.bestWpm, 1000), bestAccuracy: int(v.bestAccuracy, 100) };
    }
  }
  if (isRecord(body.keyStats)) {
    const ks: SyncKeyStats = { english: {}, khmer: {} };
    for (const language of ["english", "khmer"] as const) {
      const src = body.keyStats[language];
      if (!isRecord(src)) continue;
      for (const [ch, v] of Object.entries(src).slice(0, MAX_KEYS_PER_LANGUAGE)) {
        if (ch.length < 1 || ch.length > 8 || ch.includes("\0") || !isRecord(v)) continue;
        const n = int(v.n, 2e9);
        if (n === 0) continue;
        ks[language][ch] = { n, e: Math.min(n, int(v.e, 2e9)), ms: int(v.ms, 2e9), t: Math.min(n, int(v.t, 2e9)) };
      }
    }
    out.keyStats = ks;
  }
  if (isRecord(body.settings)) {
    const s = body.settings;
    out.settings = {
      sound: s.sound === false ? false : true,
      animations: s.animations === false ? false : true,
      language: s.language === "khmer" ? "khmer" : "english",
      difficulty: s.difficulty === "medium" || s.difficulty === "hard" ? s.difficulty : "easy",
    };
  }
  const pets = parsePetSync(body.pets);
  if (pets) out.pets = pets;
  return out;
}
