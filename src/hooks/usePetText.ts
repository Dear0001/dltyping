"use client";

import { useLocale } from "@/components/shared/LocaleProvider";
import { kmBehaviors, kmBlurbs, kmPets, kmRarity, kmSay, kmSkillNames } from "@/lib/pets/pet-km";
import type { PetDefinition, Rarity } from "@/lib/pets/pet-catalog";

/** Same lookup the speech bubble uses outside React: Khmer when available, otherwise the English original. */
export const petSay = (locale: string, text: string) => (locale === "km" && kmSay[text]) || text;

/** Localized pet names, descriptions and skill labels (English comes from pet-catalog.ts). */
export function usePetText() {
  const { locale } = useLocale();
  const km = locale === "km";
  return {
    locale,
    name: (p: Pick<PetDefinition, "id" | "name">) => (km && kmPets[p.id]?.name) || p.name,
    firstName: (p: Pick<PetDefinition, "id" | "name">) => ((km && kmPets[p.id]?.name) || p.name).split(" ")[0],
    tagline: (p: Pick<PetDefinition, "id" | "tagline">) => (km && kmPets[p.id]?.tagline) || p.tagline,
    personality: (p: Pick<PetDefinition, "id" | "personality">) => (km && kmPets[p.id]?.personality) || p.personality,
    behavior: (b: string) => (km && kmBehaviors[b]) || b,
    rarity: (r: Rarity) => (km && kmRarity[r]) || r.charAt(0).toUpperCase() + r.slice(1),
    skill: (name: string) => (km && kmSkillNames[name]) || name,
    blurb: (text: string) => (km && kmBlurbs[text]) || text,
  };
}
