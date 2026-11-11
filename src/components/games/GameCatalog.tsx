"use client";

import Link from "next/link";
import { useLocale } from "@/components/shared/LocaleProvider";
import { typingGames } from "@/data/games";
import { useGameText } from "@/hooks/useGameText";

export const gameIcons: Record<(typeof typingGames)[number]["id"], string> = {
  "mario-khmer-quest": "🍄",
  "english-quest": "🗻",
  "sentence-rush": "📝",
  "letter-jump": "🦘",
  "word-sprint": "⚡",
};

export default function GameCatalog() {
  const { t } = useLocale();
  const gt = useGameText();

  return (
    <main className="games-shell">
      <header className="games-heading">
        <div>
          <span className="text-meta">{t("games.kicker")}</span>
          <h1>{t("games.title")}</h1>
          <p>{t("games.subtitle")}</p>
        </div>
        <span className="games-badge">{t("games.choose")}</span>
      </header>

      <section className="games-grid" aria-label={t("games.title")}>
        {typingGames.map((game, index) => (
          <article className="game-card" key={game.id}>
            <div className={`game-card-art bg-gradient-to-br ${game.gradient}`}>
              <span className="game-number">{String(index + 1).padStart(2, "0")}</span>
              <span className="game-emoji" aria-hidden="true">{gameIcons[game.id]}</span>
              <span className="game-platform">{gt.category(game.category)}</span>
            </div>
            <div className="game-card-copy">
              <div className="game-card-meta">
                <span>{game.languages.map(gt.language).join(" · ")}</span>
                <span aria-hidden="true">·</span>
                <span>{game.difficulties.map((difficulty) => gt.difficulty(difficulty)).join(" / ")}</span>
              </div>
              <h2>{gt.title(game)}</h2>
              <p>{gt.description(game)}</p>
              <p className="mt-2 text-xs font-medium">{gt.skill(game)}</p>
              <Link className="game-play-button" href={game.href}>
                {t("games.play")} <span aria-hidden="true">→</span>
              </Link>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
