import { parseStored, readRaw, writeRaw } from "@/lib/local-progress";
import { PET_BY_ID } from "@/lib/pets/pet-catalog";

/**
 * All pet data in one versioned localStorage entry. Plain JSON keyed by pet id and ISO
 * dates, so it can later sync to a PostgreSQL table (user_id, pet_id, unlocked_at).
 */
export const PETS_KEY = "dlt.pets.v1";
export const PETS_VERSION = 1;

export type AnimationSetting = "full" | "reduced" | "off";
export type TypingPolicy = "quiet" | "stay" | "hide";
export type PetSize = "sm" | "md" | "lg";

export type PetSettings = {
  animations: AnimationSetting;
  /** Pet reacts to and follows the cursor. */
  cursor: boolean;
  speech: boolean;
  /** What the pet does while the learner is typing on practice and game pages. */
  whileTyping: TypingPolicy;
  size: PetSize;
};

export type PetReward = {
  id: string;
  /** ISO */
  at: string;
  /** milestone (streak days) that earned it */
  streak: number;
  /** "account": granted by the signed-in account, removed again on sign-out. Absent: earned by streak, kept forever. */
  source?: "account";
};

export type PetState = {
  version: typeof PETS_VERSION;
  /** Permanent: a pet stays unlocked even if the streak is later lost or progress is reset. */
  unlocked: Record<string, PetReward>;
  /** Newly unlocked pets the learner has not been told about yet. */
  pending: string[];
  active: string | null;
  enabled: boolean;
  settings: PetSettings;
  /** Reward history in the order earned. */
  history: PetReward[];
};

export const DEFAULT_PET_SETTINGS: PetSettings = { animations: "full", cursor: true, speech: true, whileTyping: "quiet", size: "md" };
export const EMPTY_PETS: PetState = { version: PETS_VERSION, unlocked: {}, pending: [], active: null, enabled: true, settings: DEFAULT_PET_SETTINGS, history: [] };

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

function validateReward(id: string, v: unknown): PetReward | null {
  if (!PET_BY_ID[id] || !isRecord(v)) return null;
  const at = typeof v.at === "string" && !Number.isNaN(Date.parse(v.at)) ? v.at : new Date(0).toISOString();
  const streak = typeof v.streak === "number" && Number.isFinite(v.streak) ? v.streak : PET_BY_ID[id].unlockStreak;
  return { id, at, streak, ...(v.source === "account" ? { source: "account" as const } : {}) };
}

/** Parses stored data defensively. Unknown pets and malformed entries are dropped, never thrown on. */
export function validatePetState(value: unknown): PetState | null {
  if (!isRecord(value)) return null;
  const unlocked: Record<string, PetReward> = {};
  if (isRecord(value.unlocked)) for (const [id, r] of Object.entries(value.unlocked)) { const reward = validateReward(id, r); if (reward) unlocked[id] = reward; }
  const history: PetReward[] = [];
  const seen = new Set<string>();
  if (Array.isArray(value.history)) for (const h of value.history) { const reward = isRecord(h) && typeof h.id === "string" ? validateReward(h.id, h) : null; if (reward && !seen.has(reward.id)) { seen.add(reward.id); history.push(reward); } }
  const pending = Array.isArray(value.pending) ? [...new Set(value.pending.filter((id): id is string => typeof id === "string" && id in unlocked))] : [];
  const s = isRecord(value.settings) ? value.settings : {};
  const d = DEFAULT_PET_SETTINGS;
  const active = typeof value.active === "string" && value.active in unlocked ? value.active : null;
  return {
    version: PETS_VERSION,
    unlocked, pending, active,
    enabled: typeof value.enabled === "boolean" ? value.enabled : true,
    history,
    settings: {
      animations: s.animations === "full" || s.animations === "reduced" || s.animations === "off" ? s.animations : d.animations,
      cursor: typeof s.cursor === "boolean" ? s.cursor : d.cursor,
      speech: typeof s.speech === "boolean" ? s.speech : d.speech,
      whileTyping: s.whileTyping === "quiet" || s.whileTyping === "stay" || s.whileTyping === "hide" ? s.whileTyping : d.whileTyping,
      size: s.size === "sm" || s.size === "md" || s.size === "lg" ? s.size : d.size,
    },
  };
}

export const readPetState = (): PetState => parseStored(readRaw(PETS_KEY), EMPTY_PETS, validatePetState);
export const writePetState = (state: PetState) => writeRaw(PETS_KEY, JSON.stringify(state));

/** Read-modify-write. Always re-reads, so concurrent tabs merge instead of overwriting. */
export function updatePets(fn: (state: PetState) => PetState): PetState {
  const current = readPetState();
  const next = fn(current);
  if (next !== current) writePetState(next); // unchanged: leave storage alone
  return next;
}

export const selectPet = (id: string) => updatePets((s) => (s.unlocked[id] ? { ...s, active: id, enabled: true } : s));
export const setPetEnabled = (enabled: boolean) => updatePets((s) => ({ ...s, enabled }));
export const patchPetSettings = (patch: Partial<PetSettings>) => updatePets((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
export const dismissPending = (id: string) => updatePets((s) => ({ ...s, pending: s.pending.filter((p) => p !== id) }));

/**
 * Unlocks every pet for a signed-in account that has the all-pets perk. Pets already earned by
 * streak are left as they are. Does nothing (and writes nothing) when there is nothing to add.
 */
export function grantAllPets(): PetState {
  return updatePets((s) => {
    const missing = Object.values(PET_BY_ID).filter((p) => !s.unlocked[p.id]);
    if (!missing.length) return s;
    const at = new Date().toISOString();
    const unlocked = { ...s.unlocked };
    for (const p of missing) unlocked[p.id] = { id: p.id, at, streak: p.unlockStreak, source: "account" };
    return { ...s, unlocked, active: s.active ?? missing[0].id };
  });
}

/** Removes account-granted pets (on sign-out) but never ones earned by streak. */
export function revokeAccountGrants(): PetState {
  return updatePets((s) => {
    const granted = Object.values(s.unlocked).filter((r) => r.source === "account").map((r) => r.id);
    if (!granted.length) return s;
    const unlocked = Object.fromEntries(Object.entries(s.unlocked).filter(([id]) => !granted.includes(id)));
    const stillActive = s.active !== null && s.active in unlocked;
    return { ...s, unlocked, pending: s.pending.filter((id) => id in unlocked), active: stillActive ? s.active : (Object.keys(unlocked)[0] ?? null) };
  });
}
