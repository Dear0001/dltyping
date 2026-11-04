"use client";

import { useStoredValue } from "@/hooks/use-stored-value";
import { useHydrated } from "@/hooks/useTypingProgress";
import { getPet, type PetDefinition } from "@/lib/pets/pet-catalog";
import { activeIds, EMPTY_PETS, PETS_KEY, validatePetState } from "@/lib/pets/pet-storage";

/** Saved pet collection and preferences. Updates live across pages and tabs. */
export function usePetState() {
  const state = useStoredValue(PETS_KEY, EMPTY_PETS, validatePetState);
  const hydrated = useHydrated();
  const actives = activeIds(state).map(getPet).filter((p): p is PetDefinition => p !== null);
  return { state, hydrated, active: getPet(state.active), actives };
}
