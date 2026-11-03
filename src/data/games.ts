import type { Difficulty } from "@/lib/game-engine";
import type { Language } from "@/types";

export type GameCategory = "accuracy" | "speed" | "adventure";
export type GameId = "mario-khmer-quest" | "english-quest" | "sentence-rush" | "letter-jump" | "word-sprint";

export type TypingGame = {
  id: GameId;
  href: string;
  title: string;
  description: string;
  languages: Language[];
  difficulties: Difficulty[];
  category: GameCategory;
  skill: string;
  /** Tailwind gradient classes for the card thumbnail background. */
  gradient: string;
};

export const typingGames: TypingGame[] = [
  {
    id: "mario-khmer-quest",
    href: "/games/mario-khmer-quest",
    title: "Mario Khmer Quest",
    description: "Guide an explorer across ancient stone platforms by typing Khmer letters, syllables and words. Five levels, from first consonants to temple-gate words.",
    languages: ["khmer"],
    difficulties: ["easy", "medium", "hard"],
    category: "adventure",
    skill: "Khmer letters, clusters & words",
    gradient: "from-emerald-500 via-teal-500 to-sky-500",
  },
  {
    id: "english-quest",
    href: "/games/english-quest",
    title: "English Quest",
    description: "Lead the explorer over floating platforms by typing English letters, short words and long words. Five levels, from the home row to summit-gate vocabulary.",
    languages: ["english"],
    difficulties: ["easy", "medium", "hard"],
    category: "adventure",
    skill: "English letters, words & capitals",
    gradient: "from-amber-400 via-orange-500 to-rose-500",
  },
  {
    id: "letter-jump",
    href: "/games/letter-jump",
    title: "Letter Jump",
    description: "One letter, one hop. Type the glowing target to leap between floating platforms before the clock or your lives run out.",
    languages: ["english", "khmer"],
    difficulties: ["easy", "medium", "hard"],
    category: "accuracy",
    skill: "Key recognition & accuracy",
    gradient: "from-sky-400 via-blue-500 to-indigo-600",
  },
  {
    id: "sentence-rush",
    href: "/games/sentence-rush",
    title: "Sentence Rush",
    description: "Type whole sentences against the clock. Spaces, punctuation and flow all count — finish clean sentences to build your combo and WPM.",
    languages: ["english", "khmer"],
    difficulties: ["easy", "medium", "hard"],
    category: "speed",
    skill: "Sentence flow & punctuation",
    gradient: "from-fuchsia-500 via-purple-600 to-indigo-700",
  },
  {
    id: "word-sprint",
    href: "/games/word-sprint",
    title: "Word Sprint",
    description: "Race the timer: type each word to score, keep your combo alive and push your WPM in 30, 60 or 120 seconds.",
    languages: ["english", "khmer"],
    difficulties: ["easy", "medium", "hard"],
    category: "speed",
    skill: "Word speed & flow",
    gradient: "from-blue-600 via-blue-700 to-slate-900",
  },
];

export const categoryLabels: Record<GameCategory, string> = { accuracy: "Accuracy", speed: "Speed", adventure: "Adventure" };
export const difficultyLabels: Record<Difficulty, string> = { easy: "Easy", medium: "Medium", hard: "Hard" };

export function getGame(id: GameId) {
  return typingGames.find((game) => game.id === id)!;
}
