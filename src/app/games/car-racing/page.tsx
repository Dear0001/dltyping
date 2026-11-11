import type { Metadata } from "next";
import CarRacingGame from "@/components/games/car-racing/CarRacingGame";

export const metadata: Metadata = {
  title: "Typing Car Racing — DL Typing",
  description: "Race three computer cars by typing in English or Khmer. Every correct key speeds up your car, combos charge a nitro boost, and your WPM and accuracy decide the score.",
};

export default function Page() {
  return <CarRacingGame />;
}
