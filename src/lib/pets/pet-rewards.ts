import { longestStreak } from "@/lib/progress/progress-analytics";
import { PETS, type PetDefinition } from "@/lib/pets/pet-catalog";
import type { PetState } from "@/lib/pets/pet-storage";
import type { SessionRecord } from "@/types/progress";

/**
 * Milestone rewards come straight from the catalog: a pet's `unlockStreak` is its milestone,
 * so changing a milestone means editing one number there.
 */
export const MILESTONES = PETS.map((p) => ({ days: p.unlockStreak, petId: p.id })).sort((a, b) => a.days - b.days);

/**
 * Unlocks every pet whose streak the learner has reached, based on real saved sessions
 * (see isQualifyingSession). Idempotent: running it again, after a refresh or in another
 * tab, grants nothing twice. Nothing is ever taken away.
 */
export function evaluateRewards(state: PetState, sessions: SessionRecord[], now: Date): { state: PetState; unlocked: PetDefinition[] } {
  const best = longestStreak(sessions);
  // A pet that so far only came from the account grant becomes permanent once the streak really earns it.
  const earned = PETS.filter((p) => p.unlockStreak <= best && (!state.unlocked[p.id] || state.unlocked[p.id].source === "account"));
  if (!earned.length) return { state, unlocked: [] };
  const unlocked = { ...state.unlocked };
  const history = [...state.history];
  const at = now.toISOString();
  const announce: string[] = [];
  for (const pet of earned) {
    const reward = { id: pet.id, at, streak: pet.unlockStreak };
    if (!state.unlocked[pet.id]) announce.push(pet.id); // already-owned grants get no second fanfare
    unlocked[pet.id] = reward;
    history.push(reward);
  }
  const newest = earned[earned.length - 1];
  return {
    state: {
      ...state,
      unlocked,
      history,
      pending: [...state.pending, ...announce],
      // First companion starts out as the active one; later rewards never replace the learner's choice.
      active: state.active ?? newest.id,
    },
    unlocked: earned,
  };
}

/** The next locked pet and how far away it is. Null when everything is unlocked. */
export function nextReward(state: PetState, bestStreak: number) {
  const next = PETS.filter((p) => !state.unlocked[p.id]).sort((a, b) => a.unlockStreak - b.unlockStreak)[0];
  return next ? { pet: next, daysToGo: Math.max(0, next.unlockStreak - bestStreak) } : null;
}
