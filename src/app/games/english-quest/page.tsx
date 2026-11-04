import type { Metadata } from "next";
import EnglishQuestGame from "@/components/games/english-quest/EnglishQuestGame";

export const metadata: Metadata = {
  title: "English Quest — DL Typing",
  description: "A platform-adventure typing game that teaches English letters, words and capital letters across five levels. Collect stars, beat each level and gain speed.",
};

export default function EnglishQuestPage() {
  return <EnglishQuestGame />;
}
