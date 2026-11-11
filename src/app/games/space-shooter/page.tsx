import type { Metadata } from "next";
import SpaceShooterGame from "@/components/games/space-shooter/SpaceShooterGame";

export const metadata: Metadata = {
  title: "Typing Space Shooter — DL Typing",
  description: "Defend the galaxy by typing in English or Khmer. Lock onto enemy ships by typing their words, collect power-ups, beat alien motherships and track your WPM, accuracy and reaction time.",
};

export default function Page() {
  return <SpaceShooterGame />;
}
