import type { ArcadeDifficulty } from "@/lib/arcade/difficulty";
import type { Language } from "@/types";

/** Game Center categories. Add "strategy" / "casual" here when the first game of that kind ships. */
export type GameCategory = "racing" | "survival" | "battle" | "adventure" | "skill";
export const GAME_CATEGORIES: readonly GameCategory[] = ["racing", "survival", "battle", "adventure", "skill"];
export type GameMode = "single";
export type GameLevel = "basic" | "intermediate" | "advanced";
export const GAME_LEVELS: readonly GameLevel[] = ["basic", "intermediate", "advanced"];
export type GameId = "space-shooter" | "car-racing" | "zombie-survival" | "battle-arena" | "mario-khmer-quest" | "english-quest" | "sentence-rush" | "letter-jump" | "word-sprint";

export type TypingGame = {
  id: GameId;
  href: string;
  title: string;
  description: string;
  languages: Language[];
  difficulties: ArcadeDifficulty[];
  category: GameCategory;
  /** Play modes that really exist. Multiplayer is added here only once it works. */
  modes: GameMode[];
  /** Skill level, used to group games in the navbar menu. */
  level: GameLevel;
  /** Shown with a "New" badge in the Game Center. */
  isNew?: boolean;
  skill: string;
  /** Tailwind gradient classes for the card thumbnail background. */
  gradient: string;
};

export const typingGames: TypingGame[] = [
  {
    id: "space-shooter",
    level: "advanced",
    href: "/games/space-shooter",
    title: "Typing Space Shooter",
    description: "Defend the galaxy, one word at a time. Type the word on an enemy ship to lock on and fire, earn power-ups and take down alien motherships.",
    languages: ["english", "khmer"],
    difficulties: ["easy", "medium", "hard", "expert"],
    category: "battle",
    modes: ["single"],
    isNew: true,
    skill: "Speed, accuracy & reaction time",
    gradient: "from-indigo-700 via-violet-800 to-slate-950",
  },
  {
    id: "car-racing",
    level: "intermediate",
    href: "/games/car-racing",
    title: "Typing Car Racing",
    description: "Every correct key pushes your car forward. Build a combo to charge the nitro, fire it with Enter and beat three computer cars to the finish line.",
    languages: ["english", "khmer"],
    difficulties: ["easy", "medium", "hard", "expert"],
    category: "racing",
    modes: ["single"],
    isNew: true,
    skill: "Sustained speed & rhythm",
    gradient: "from-rose-500 via-orange-500 to-amber-400",
  },
  {
    id: "zombie-survival",
    level: "advanced",
    href: "/games/zombie-survival",
    title: "Zombie Survival",
    description: "Zombies close in from every side, each carrying a word. Type a word to stop its zombie, grab power-ups and survive wave after wave.",
    languages: ["english", "khmer"],
    difficulties: ["easy", "medium", "hard", "expert"],
    category: "survival",
    modes: ["single"],
    isNew: true,
    skill: "Fast word recognition under pressure",
    gradient: "from-lime-600 via-emerald-700 to-slate-900",
  },
  {
    id: "battle-arena",
    level: "advanced",
    href: "/games/battle-arena",
    title: "Typing Battle Arena",
    description: "Cast spells by typing their words. Clean, fast typing hits harder, a shield blocks the enemy's strike, and a long streak unlocks your ultimate spell.",
    languages: ["english", "khmer"],
    difficulties: ["easy", "medium", "hard", "expert"],
    category: "battle",
    modes: ["single"],
    isNew: true,
    skill: "Accuracy & decision making",
    gradient: "from-violet-600 via-indigo-700 to-slate-900",
  },
  {
    id: "mario-khmer-quest",
    level: "basic",
    href: "/games/mario-khmer-quest",
    title: "Mario Khmer Quest",
    description: "Guide an explorer across ancient stone platforms by typing Khmer letters, syllables and words. Five levels, from first consonants to temple-gate words.",
    languages: ["khmer"],
    difficulties: ["easy", "medium", "hard"],
    category: "adventure",
    modes: ["single"],
    skill: "Khmer letters, clusters & words",
    gradient: "from-emerald-500 via-teal-500 to-sky-500",
  },
  {
    id: "english-quest",
    level: "basic",
    href: "/games/english-quest",
    title: "English Quest",
    description: "Lead the explorer over floating platforms by typing English letters, short words and long words. Five levels, from the home row to summit-gate vocabulary.",
    languages: ["english"],
    difficulties: ["easy", "medium", "hard"],
    category: "adventure",
    modes: ["single"],
    skill: "English letters, words & capitals",
    gradient: "from-amber-400 via-orange-500 to-rose-500",
  },
  {
    id: "letter-jump",
    level: "basic",
    href: "/games/letter-jump",
    title: "Letter Jump",
    description: "One letter, one hop. Type the glowing target to leap between floating platforms before the clock or your lives run out.",
    languages: ["english", "khmer"],
    difficulties: ["easy", "medium", "hard"],
    category: "skill",
    modes: ["single"],
    skill: "Key recognition & accuracy",
    gradient: "from-sky-400 via-blue-500 to-indigo-600",
  },
  {
    id: "sentence-rush",
    level: "intermediate",
    href: "/games/sentence-rush",
    title: "Sentence Rush",
    description: "Type whole sentences against the clock. Spaces, punctuation and flow all count — finish clean sentences to build your combo and WPM.",
    languages: ["english", "khmer"],
    difficulties: ["easy", "medium", "hard"],
    category: "skill",
    modes: ["single"],
    skill: "Sentence flow & punctuation",
    gradient: "from-fuchsia-500 via-purple-600 to-indigo-700",
  },
  {
    id: "word-sprint",
    level: "intermediate",
    href: "/games/word-sprint",
    title: "Word Sprint",
    description: "Race the timer: type each word to score, keep your combo alive and push your WPM in 30, 60 or 120 seconds.",
    languages: ["english", "khmer"],
    difficulties: ["easy", "medium", "hard"],
    category: "skill",
    modes: ["single"],
    skill: "Word speed & flow",
    gradient: "from-blue-600 via-blue-700 to-slate-900",
  },
];

export const categoryLabels: Record<GameCategory, string> = { racing: "Racing", survival: "Survival", battle: "Battle", adventure: "Adventure", skill: "Skill Training" };
export const difficultyLabels: Record<ArcadeDifficulty, string> = { easy: "Easy", medium: "Medium", hard: "Hard", expert: "Expert" };

export function getGame(id: GameId) {
  return typingGames.find((game) => game.id === id)!;
}
