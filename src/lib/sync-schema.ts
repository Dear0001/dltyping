// Wire format + validation shared by the sync route and the client.
export type SyncScore = { best: number; bestWpm: number; bestAccuracy: number; plays: number };
export type SyncPayload = {
  deviceId: string;
  scores: Record<string, SyncScore>;
  levels: Record<string, { stars: number; score: number }>;
  practice: Record<string, { bestWpm: number; bestAccuracy: number }>;
  settings?: Record<string, unknown>;
};
export type SyncState = Omit<SyncPayload, "deviceId">;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VARIANT = /^[a-z0-9:_-]{1,80}$/;
const MAX_ENTRIES = 500;

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
  if (isRecord(body.practice)) {
    for (const language of ["english", "khmer"]) {
      const v = body.practice[language];
      if (isRecord(v)) out.practice[language] = { bestWpm: int(v.bestWpm, 1000), bestAccuracy: int(v.bestAccuracy, 100) };
    }
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
  return out;
}
