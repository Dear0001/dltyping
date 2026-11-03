"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/components/shared/LocaleProvider";
import { difficultyLabels, typingGames } from "@/data/games";
import { gameIcons } from "@/components/games/GameCatalog";

/** "Games" nav item. Opens a dropdown of games on hover or keyboard focus. */
export default function GamesMenu() {
  const { t } = useLocale();
  const pathname = usePathname();
  const active = pathname.startsWith("/games");
  return <div className="gm-wrap">
    <Link className={`gm-trigger${active ? " active" : ""}`} href="/games" aria-haspopup="menu">{t("nav.games")}<span className="gm-caret" aria-hidden="true">⌄</span></Link>
    <div className="gm-menu" role="menu">
      {typingGames.map((game) => <Link key={game.id} role="menuitem" className="gm-item" href={game.href}>
        <span className="gm-icon" aria-hidden="true">{gameIcons[game.id]}</span>
        <span className="gm-text"><strong>{game.title}</strong><small>{game.languages.map((l) => (l === "khmer" ? "Khmer" : "English")).join(" · ")} · {difficultyLabels[game.difficulties[0]]}→{difficultyLabels[game.difficulties[game.difficulties.length - 1]]}</small></span>
      </Link>)}
      <Link role="menuitem" className="gm-all" href="/games">{t("games.allGames")} →</Link>
    </div>
  </div>;
}
