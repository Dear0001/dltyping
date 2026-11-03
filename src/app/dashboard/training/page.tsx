import type { Metadata } from "next";
import TrainingView from "@/components/dashboard/TrainingView";

export const metadata: Metadata = {
  title: "Personalized Training — DL Typing",
  description: "Practice recommendations built from your own weak keys, combinations, words and speed.",
};

export default function TrainingPage() {
  return <TrainingView />;
}
