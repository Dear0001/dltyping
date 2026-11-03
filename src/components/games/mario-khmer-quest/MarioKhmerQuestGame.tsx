"use client";

import QuestGame, { type QuestConfig } from "@/components/games/shared/QuestGame";
import { marioLevels } from "@/data/game-content";

const STEPS = [
  { icon: "🧭", title: "Meet your explorer", text: "Guide the explorer across ancient stone platforms to the temple gate at the end of each level." },
  { icon: "🎯", title: "Type the target", text: "The platform you stand on shows a Khmer letter, syllable or word. Type it with your keyboard (any Khmer layout works — or Latin keys mapped to NiDA)." },
  { icon: "🦘", title: "Jump on success", text: "Each correct unit makes the explorer leap to the next platform, collect a coin and grow your combo." },
  { icon: "⚠️", title: "Mind the spikes", text: "Wrong keys make the explorer stumble and break your combo. Enough stumbles cost a heart. Lose all hearts or run out of time and the level ends." },
  { icon: "⌨️", title: "Use the NiDA keyboard", text: "The on-screen keyboard highlights the key for each next character, so you learn the layout as you play. Press Esc to pause." },
];

const config: QuestConfig = {
  gameId: "mario-khmer-quest", language: "khmer", title: "Mario Khmer Quest", icon: "🧭", theme: "temple", hero: "explorer",
  levels: marioLevels, steps: STEPS, unitClass: "font-khmer", finishText: "🎉 You finished every level of the quest!",
};

export default function MarioKhmerQuestGame() {
  return <QuestGame config={config} />;
}
