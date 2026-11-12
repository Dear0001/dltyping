/**
 * Counts quoted in copy (home, learn, llms.txt, metadata), computed from the real data so text never drifts
 * from the curriculum or the game list again. Plain module: safe in server and client code.
 */
import { englishCurriculum, khmerCurriculum, getAllLessons } from "@/data/curriculum";
import { typingGames } from "@/data/games";

export const SITE_FACTS = {
  enLessons: getAllLessons(englishCurriculum).length,
  enLevels: englishCurriculum.courses.length,
  kmLessons: getAllLessons(khmerCurriculum).length,
  kmLevels: khmerCurriculum.courses.length,
  games: typingGames.length,
} as const;

/** Placeholder values for translations that quote these counts ({en}, {enLevels}, {km}, {kmLevels}, {games}). */
export const FACT_VARS = { en: SITE_FACTS.enLessons, enLevels: SITE_FACTS.enLevels, km: SITE_FACTS.kmLessons, kmLevels: SITE_FACTS.kmLevels, games: SITE_FACTS.games };
