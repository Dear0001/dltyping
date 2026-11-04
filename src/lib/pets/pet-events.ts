/**
 * Tiny event bus so lessons, tests and games can tell the companion something happened
 * without importing any pet code. Safe on the server (no listeners there).
 */
export type PetEvent =
  | { type: "click" }
  | { type: "celebrate" }
  /** `good` = the learner did well (high accuracy). */
  | { type: "encourage"; good: boolean }
  | { type: "wake" }
  | { type: "unlock" }
  /** Cast a legendary pet's ultimate. `pet`: only that pet (otherwise every pet that has one). */
  | { type: "ultimate"; pet?: string }
  /** Cast one of a pet's abilities (`id` from its `abilities`). */
  | { type: "ability"; pet?: string; id: string };

/** When the ultimate can be cast again (ms timestamp). Shared so the menu can show the wait. */
export const ultimateCooldown = { readyAt: 0, seconds: 25 };

const listeners = new Set<(event: PetEvent) => void>();

export function emitPetEvent(event: PetEvent) {
  listeners.forEach((listener) => listener(event));
}

export function subscribePetEvents(listener: (event: PetEvent) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
