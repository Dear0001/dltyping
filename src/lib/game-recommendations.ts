// Picks games for the Game Center's "Recommended for you" row from the learner's own saved sessions:
// games at the skill level their recent practice speed suggests, in the language they practise most,
// unplayed games first. With no history it says so and suggests the beginner games.
import type { GameLevel, TypingGame } from "@/data/games";
import { isQualifyingSession } from "@/lib/progress/progress-analytics";
import type { Language } from "@/types";
import type { SessionRecord } from "@/types/progress";

const PRACTICE = new Set(["lesson", "typing-test", "drill"]);
/** Average WPM up to which a level fits; above the last one, advanced. Khmer is slower to type, so its bands are lower. */
const BANDS: Record<Language, [number, number]> = { english: [20, 40], khmer: [12, 25] };
const ORDER: GameLevel[] = ["basic", "intermediate", "advanced"];

export type GameRecommendation = { games: TypingGame[]; reason: { kind: "starter" } | { kind: "speed"; wpm: number; language: Language } };

export function recommendGames(sessions: readonly SessionRecord[], games: readonly TypingGame[], count = 3): GameRecommendation {
  const practice = sessions.filter((s) => PRACTICE.has(s.activity) && isQualifyingSession(s));
  const played = new Set(sessions.map((s) => s.activity));
  if (!practice.length) {
    return { games: games.filter((g) => g.level === "basic").sort((a, b) => Number(played.has(a.id)) - Number(played.has(b.id))).slice(0, count), reason: { kind: "starter" } };
  }
  const language: Language = practice.filter((s) => s.language === "khmer").length > practice.length / 2 ? "khmer" : "english";
  const recent = practice.filter((s) => s.language === language).slice(-6);
  const wpm = Math.round(recent.reduce((n, s) => n + s.wpm, 0) / recent.length);
  const [low, high] = BANDS[language];
  const level = ORDER.indexOf(wpm < low ? "basic" : wpm < high ? "intermediate" : "advanced");
  const picks = games
    .filter((g) => g.languages.includes(language))
    .map((g) => ({ g, distance: Math.abs(ORDER.indexOf(g.level) - level), played: played.has(g.id) ? 1 : 0 }))
    .sort((a, b) => a.distance - b.distance || a.played - b.played)
    .slice(0, count)
    .map((x) => x.g);
  return { games: picks, reason: { kind: "speed", wpm, language } };
}
