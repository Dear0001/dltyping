import type { Metadata } from "next";
import WordSprintGame from "@/components/games/word-sprint/WordSprintGame";

export const metadata: Metadata = {
  title: "Word Sprint — Keyflow",
  description: "Race the timer by typing words in English or Khmer. Track WPM, accuracy and combos.",
};

export default function WordSprintPage() {
  return <WordSprintGame />;
}
