import type { Metadata } from "next";
import MarioKhmerQuestGame from "@/components/games/mario-khmer-quest/MarioKhmerQuestGame";

export const metadata: Metadata = {
  title: "Mario Khmer Quest — DL Typing",
  description: "A platform-adventure typing game that teaches Khmer letters, subscript clusters and words across five levels. Practise the NiDA layout while you explore, collect stars and finish each level.",
};

export default function MarioKhmerQuestPage() {
  return <MarioKhmerQuestGame />;
}
