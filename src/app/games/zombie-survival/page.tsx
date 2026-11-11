import type { Metadata } from "next";
import ZombieSurvivalGame from "@/components/games/zombie-survival/ZombieSurvivalGame";

export const metadata: Metadata = {
  title: "Zombie Survival — DL Typing",
  description: "Survive waves of zombies by typing the word above each one in English or Khmer. Runners, armored zombies, bosses and power-ups keep every wave different.",
};

export default function Page() {
  return <ZombieSurvivalGame />;
}
