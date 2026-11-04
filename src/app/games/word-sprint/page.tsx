import type { Metadata } from "next";
import WordSprintGame from "@/components/games/word-sprint/WordSprintGame";

export const metadata: Metadata = {
  title: "Word Sprint — DL Typing",
  description: "Race the timer by typing words in English or Khmer as fast as you can. Track your words per minute, accuracy and combos, and beat your own best score with every sprint.",
};

export default function WordSprintPage() {
  return <WordSprintGame />;
}
