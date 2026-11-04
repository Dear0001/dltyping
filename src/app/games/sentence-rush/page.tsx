import type { Metadata } from "next";
import SentenceRushGame from "@/components/games/sentence-rush/SentenceRushGame";

export const metadata: Metadata = {
  title: "Sentence Rush — DL Typing",
  description: "A timed sentence-typing game for English and Khmer. Build combos with clean, accurate sentences, learn punctuation and sentence flow, and push your words per minute higher each round.",
};

export default function SentenceRushPage() {
  return <SentenceRushGame />;
}
