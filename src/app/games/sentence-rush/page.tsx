import type { Metadata } from "next";
import SentenceRushGame from "@/components/games/sentence-rush/SentenceRushGame";

export const metadata: Metadata = {
  title: "Sentence Rush — DL Typing",
  description: "A timed sentence-typing game for English and Khmer. Build combos with clean sentences and push your WPM.",
};

export default function SentenceRushPage() {
  return <SentenceRushGame />;
}
