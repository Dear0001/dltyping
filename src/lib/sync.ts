// Browser-side sync client. Local storage stays the source the UI reads;
// the server only ever raises records, so sync is safe to retry at any time.
import { LEVELS_KEY, PRACTICE_KEY, SCORES_KEY, SETTINGS_KEY, parseStored, readRaw, validateLevels, validatePractice, validateScores, removeRaw, writeRaw, type LevelBook, type PracticeBest, type ScoreBook } from "@/lib/local-progress";
import { KEYSTATS_KEY, KEYSTATS_REMOTE_KEY, EMPTY_BOOK, validateBook } from "@/lib/keyboard/key-stats";
import { parsePayload, type SyncPayload, type SyncState } from "@/lib/sync-schema";

const DEVICE_KEY = "dlt.device";
let lastSynced = "";
let inFlight = false;
let signedIn = false;

/** Called by the account store so sync knows whether to pull for an empty device. */
export function setSyncAccount(isSignedIn: boolean) {
  signedIn = isSignedIn;
  lastSynced = "";
}

/** Signing out on a shared browser must not leave one person's progress to be uploaded into the next account. */
export function clearLocalProgress() {
  for (const key of [SCORES_KEY, LEVELS_KEY, PRACTICE_KEY, SETTINGS_KEY, DEVICE_KEY, KEYSTATS_KEY, KEYSTATS_REMOTE_KEY]) removeRaw(key);
  lastSynced = "";
}

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : "";
}

export function getDeviceId(): string | null {
  const existing = readRaw(DEVICE_KEY);
  if (existing) return existing;
  const id = newId();
  if (!id) return null;
  writeRaw(DEVICE_KEY, id);
  return id;
}

function collect(deviceId: string): SyncPayload {
  const rawSettings = readRaw(SETTINGS_KEY);
  let settings: Record<string, unknown> | undefined;
  try {
    settings = rawSettings ? (JSON.parse(rawSettings) as Record<string, unknown>) : undefined; // only sync settings the user has actually set
  } catch {
    settings = undefined;
  }
  return {
    deviceId,
    scores: parseStored(readRaw(SCORES_KEY), {} as ScoreBook, validateScores),
    levels: parseStored(readRaw(LEVELS_KEY), {} as LevelBook, validateLevels),
    practice: parseStored(readRaw(PRACTICE_KEY), {} as Record<string, PracticeBest>, validatePractice),
    settings,
    keyStats: parseStored(readRaw(KEYSTATS_KEY), EMPTY_BOOK, validateBook),
  };
}

const max = (a: number, b: number) => Math.max(a, b);

function applyServerState(server: SyncState) {
  const scores = parseStored(readRaw(SCORES_KEY), {} as ScoreBook, validateScores);
  for (const [k, s] of Object.entries(server.scores)) {
    const l = scores[k];
    scores[k] = l ? { best: max(l.best, s.best), bestWpm: max(l.bestWpm, s.bestWpm), bestAccuracy: max(l.bestAccuracy, s.bestAccuracy), plays: max(l.plays, s.plays) } : s;
  }
  const levels = parseStored(readRaw(LEVELS_KEY), {} as LevelBook, validateLevels);
  for (const [k, s] of Object.entries(server.levels)) {
    const l = levels[k];
    levels[k] = l ? { stars: max(l.stars, s.stars), score: max(l.score, s.score) } : s;
  }
  const practice = parseStored(readRaw(PRACTICE_KEY), {} as Record<string, PracticeBest>, validatePractice);
  for (const [k, s] of Object.entries(server.practice)) {
    const l = practice[k];
    practice[k] = l ? { bestWpm: max(l.bestWpm, s.bestWpm), bestAccuracy: max(l.bestAccuracy, s.bestAccuracy) } : s;
  }
  // Only write what changed, so we don't re-trigger listeners needlessly.
  const writeIfChanged = (key: string, value: unknown) => {
    const next = JSON.stringify(value);
    if (readRaw(key) !== next) writeRaw(key, next);
  };
  writeIfChanged(SCORES_KEY, scores);
  writeIfChanged(LEVELS_KEY, levels);
  writeIfChanged(PRACTICE_KEY, practice);
  // Other devices' typing history replaces (not merges into) the stored copy: the server already summed it.
  if (server.keyStats) writeIfChanged(KEYSTATS_REMOTE_KEY, server.keyStats);
  // A brand-new device adopts the saved settings; an existing choice is never overwritten.
  if (server.settings && !readRaw(SETTINGS_KEY)) writeRaw(SETTINGS_KEY, JSON.stringify(server.settings));
}

/** Pushes local progress, then merges the server's result back. Silent on failure. */
export async function syncProgress(force = false): Promise<void> {
  if (inFlight || (typeof navigator !== "undefined" && !navigator.onLine)) return;
  const deviceId = getDeviceId();
  if (!deviceId) return;
  const payload = collect(deviceId);
  const body = JSON.stringify(payload);
  const empty = !Object.keys(payload.scores).length && !Object.keys(payload.levels).length && !Object.keys(payload.practice).length && !payload.settings && !Object.keys(payload.keyStats?.english ?? {}).length && !Object.keys(payload.keyStats?.khmer ?? {}).length;
  if (!force && (body === lastSynced || (empty && !signedIn))) return;
  inFlight = true;
  try {
    const response = await fetch("/api/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true });
    if (!response.ok) return;
    const server = (await response.json()) as SyncState;
    const check = parsePayload({ deviceId, ...server });
    if (!check) return;
    applyServerState(check);
    lastSynced = JSON.stringify(collect(deviceId));
  } catch {
    // Offline or server unavailable: local progress is unaffected; retry on next change.
  } finally {
    inFlight = false;
  }
}
