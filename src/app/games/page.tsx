import type { Metadata } from "next";
import GameHub from "@/components/games/GameHub";

export const metadata: Metadata = {
  title: "Typing Games — Keyflow",
  description: "Play free English and Khmer typing games: Letter Jump, Word Sprint and Mario Khmer Quest.",
};

export default function GamesPage() {
  return <GameHub />;
}
