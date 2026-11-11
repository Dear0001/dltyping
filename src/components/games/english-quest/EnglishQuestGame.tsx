"use client";

import QuestGame, { type QuestConfig } from "@/components/games/shared/QuestGame";
import { englishQuestLevels } from "@/data/game-content";

const config: QuestConfig = {
  gameId: "english-quest", language: "english", keyPrefix: "eq", icon: "🗻", theme: "sky", hero: "explorer",
  levels: englishQuestLevels, icons: ["🗻", "🎯", "🦘", "⚠️", "⌨️"],
};

export default function EnglishQuestGame() {
  return <QuestGame config={config} />;
}
