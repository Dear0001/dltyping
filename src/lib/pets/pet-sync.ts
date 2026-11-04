import { validatePetState, type PetState } from "@/lib/pets/pet-storage";

/**
 * Pet data as it travels to and from the account (stored under `pets` in player_settings.settings).
 * `at` is when the team/settings were last changed on the device that wrote it.
 */
export type PetSync = { at: number; unlocked: PetState["unlocked"]; active: string | null; extra: string[]; enabled: boolean; settings: PetState["settings"] };

export function toPetSync(state: PetState, at: number): PetSync {
  return { at, unlocked: state.unlocked, active: state.active, extra: state.extra, enabled: state.enabled, settings: state.settings };
}

/** Sanitizes untrusted input (request body or stored JSON). Unknown pets are dropped. */
export function parsePetSync(value: unknown): PetSync | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;
  const state = validatePetState({ ...v, pending: [], history: [] });
  if (!state) return null;
  const at = typeof v.at === "number" && Number.isFinite(v.at) && v.at > 0 ? Math.floor(v.at) : 0;
  return toPetSync(state, at);
}

/**
 * Unlocked pets are the union (a pet is never lost). The team, enabled flag and settings come from
 * whichever side changed them last; on a tie `a` wins. The team is then checked against the union.
 */
export function mergePetSync(a: PetSync | null, b: PetSync | null): PetSync | null {
  if (!a || !b) return a ?? b;
  const [win, lose] = b.at > a.at ? [b, a] : [a, b];
  const unlocked = { ...lose.unlocked, ...win.unlocked };
  const checked = validatePetState({ unlocked, active: win.active, extra: win.extra, enabled: win.enabled, settings: win.settings });
  return checked ? toPetSync(checked, win.at) : win;
}
