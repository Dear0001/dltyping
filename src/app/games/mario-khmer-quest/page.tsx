import type { Metadata } from "next";
import MarioKhmerQuestGame from "@/components/games/mario-khmer-quest/MarioKhmerQuestGame";

export const metadata: Metadata = {
  title: "Mario Khmer Quest — Keyflow",
  description: "A platform-adventure game that teaches Khmer letters, clusters and words across five levels.",
};

export default function MarioKhmerQuestPage() {
  return <MarioKhmerQuestGame />;
}
