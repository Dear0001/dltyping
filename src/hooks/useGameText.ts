"use client";

import { useLocale } from "@/components/shared/LocaleProvider";
import type { TypingGame, GameCategory } from "@/data/games";
import type { Difficulty } from "@/lib/game-engine";
import type { Language } from "@/types";

/** Localized names and labels for the game catalogue (the data file keeps the English originals for SEO). */
export function useGameText() {
  const { t } = useLocale();
  return {
    title: (g: Pick<TypingGame, "id">) => t(`game.${g.id}.title`),
    description: (g: Pick<TypingGame, "id">) => t(`game.${g.id}.desc`),
    skill: (g: Pick<TypingGame, "id">) => t(`game.${g.id}.skill`),
    category: (c: GameCategory) => t(`game.cat.${c}`),
    difficulty: (d: Difficulty) => t(`games.difficulty.${d}`),
    language: (l: Language) => t(l === "khmer" ? "category.khmer" : "category.english"),
  };
}
