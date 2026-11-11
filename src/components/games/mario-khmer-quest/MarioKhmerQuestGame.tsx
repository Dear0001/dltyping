"use client";

import QuestGame, { type QuestConfig } from "@/components/games/shared/QuestGame";
import { marioLevels } from "@/data/game-content";

const config: QuestConfig = {
  gameId: "mario-khmer-quest", language: "khmer", keyPrefix: "mk", icon: "🧭", theme: "temple", hero: "explorer",
  levels: marioLevels, icons: ["🧭", "🎯", "🦘", "⚠️", "⌨️"], unitClass: "font-khmer",
};

export default function MarioKhmerQuestGame() {
  return <QuestGame config={config} />;
}
