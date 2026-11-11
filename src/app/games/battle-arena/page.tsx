import type { Metadata } from "next";
import BattleArenaGame from "@/components/games/battle-arena/BattleArenaGame";

export const metadata: Metadata = {
  title: "Typing Battle Arena — DL Typing",
  description: "Cast fireballs, ice, lightning and shields by typing in English or Khmer. Accurate, fast typing hits harder as you fight through each arena to its boss.",
};

export default function Page() {
  return <BattleArenaGame />;
}
