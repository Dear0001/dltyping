import type { Metadata } from "next";
import EnglishQuestGame from "@/components/games/english-quest/EnglishQuestGame";

export const metadata: Metadata = {
  title: "English Quest — Keyflow",
  description: "A platform-adventure game that teaches English letters, words and capitals across five levels.",
};

export default function EnglishQuestPage() {
  return <EnglishQuestGame />;
}
