"use client";

import QuestGame, { type QuestConfig } from "@/components/games/shared/QuestGame";
import { englishQuestLevels } from "@/data/game-content";

const STEPS = [
  { icon: "🗻", title: "Meet your explorer", text: "Guide the explorer across floating platforms to the summit gate at the end of each level." },
  { icon: "🎯", title: "Type the target", text: "The platform you stand on shows a letter or word. Type it exactly, including capital letters in the later levels." },
  { icon: "🦘", title: "Jump on success", text: "Each completed target makes the explorer leap to the next platform, collect a coin and grow your combo." },
  { icon: "⚠️", title: "Mind the slips", text: "Wrong keys break your combo. Enough slips cost a heart. Lose all hearts or run out of time and the level ends." },
  { icon: "⌨️", title: "Follow the keyboard", text: "The on-screen keyboard highlights the next key, so you learn finger positions as you play. Press Esc to pause." },
];

const config: QuestConfig = {
  gameId: "english-quest", language: "english", title: "English Quest", icon: "🗻", theme: "sky", hero: "explorer",
  levels: englishQuestLevels, steps: STEPS, finishText: "🎉 You reached the summit of every level!",
};

export default function EnglishQuestGame() {
  return <QuestGame config={config} />;
}
