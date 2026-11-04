import type { Metadata } from "next";
import GameHub from "@/components/games/GameHub";

export const metadata: Metadata = {
  title: "Typing Games — DL Typing",
  description: "Play free English and Khmer typing games: Letter Jump, Word Sprint, Sentence Rush, English Quest and Mario Khmer Quest. Build speed and accuracy while having fun, right in your browser.",
};

export default function GamesPage() {
  return <GameHub />;
}
