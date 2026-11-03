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
  | { type: "unlock" };

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
