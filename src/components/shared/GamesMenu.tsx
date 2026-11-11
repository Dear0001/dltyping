"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/components/shared/LocaleProvider";
import { typingGames } from "@/data/games";
import { useGameText } from "@/hooks/useGameText";
import { gameIcons } from "@/components/games/GameCatalog";

/** "Games" nav item. Opens a dropdown of games on hover or keyboard focus. */
export default function GamesMenu() {
  const { t } = useLocale();
  const gt = useGameText();
  const pathname = usePathname();
  const active = pathname.startsWith("/games");
  return <div className="gm-wrap">
    <Link className={`gm-trigger${active ? " active" : ""}`} href="/games" aria-haspopup="menu">{t("nav.games")}<span className="gm-caret" aria-hidden="true">⌄</span></Link>
    <div className="gm-menu" role="menu">
      {typingGames.map((game) => <Link key={game.id} role="menuitem" className="gm-item" href={game.href}>
        <span className="gm-icon" aria-hidden="true">{gameIcons[game.id]}</span>
        <span className="gm-text"><strong>{gt.title(game)}</strong><small>{game.languages.map(gt.language).join(" · ")} · {gt.difficulty(game.difficulties[0])}→{gt.difficulty(game.difficulties[game.difficulties.length - 1])}</small></span>
      </Link>)}
      <Link role="menuitem" className="gm-all" href="/games">{t("games.allGames")} →</Link>
    </div>
  </div>;
}
