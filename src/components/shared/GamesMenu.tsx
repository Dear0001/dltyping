"use client";

import { useState, type MouseEvent } from "react";
import Link from "next/link";
import BiText from "@/components/shared/BiText";
import { useLocale } from "@/components/shared/LocaleProvider";
import { GAME_LEVELS, typingGames } from "@/data/games";
import { useGameText } from "@/hooks/useGameText";
import { gameIcons } from "@/components/games/GameCatalog";

/**
 * "Games" nav item. Opens a dropdown of games on hover or keyboard focus.
 * `active` comes from SiteHeader (it reads the pathname inside a Suspense boundary).
 */
export default function GamesMenu({ active = false }: { active?: boolean }) {
  const { t } = useLocale();
  const gt = useGameText();
  // After picking a game the pointer is still over the menu (and focus is in it), so it would stay open on the new
  // page. `closed` hides it until the pointer leaves/re-enters or focus comes back.
  const [closed, setClosed] = useState(false);
  const reopen = () => { if (closed) setClosed(false); };
  const onMenuClick = (e: MouseEvent) => {
    if (!(e.target as Element).closest("a")) return;
    setClosed(true);
    (document.activeElement as HTMLElement | null)?.blur();
  };
  return <div className="gm-wrap" data-closed={closed || undefined} onMouseEnter={reopen} onMouseLeave={reopen} onFocus={reopen}>
    <Link data-nav="" className={`gm-trigger${active ? " active" : ""}`} href="/games" aria-haspopup="menu"><BiText k="nav.games" /><span className="gm-caret" aria-hidden="true">⌄</span></Link>
    <div className="gm-menu" role="menu" onClick={onMenuClick}>
      {/* Grouped by skill level so learners can find games that suit them. */}
      <div className="gm-cols">
        {GAME_LEVELS.map((level) => <div key={level} className="gm-col" role="group" aria-labelledby={`gm-level-${level}`}>
          <div className="gm-level" id={`gm-level-${level}`}><span className={`gm-dot gm-dot-${level}`} aria-hidden="true" />{t(`nav.level.${level}`)}<small>{t(`nav.level.${level}.d`)}</small></div>
          {typingGames.filter((game) => game.level === level).map((game) => <Link key={game.id} role="menuitem" className="gm-item" href={game.href}>
            <span className="gm-icon" aria-hidden="true">{gameIcons[game.id]}</span>
            <span className="gm-text"><strong><span className="gm-title">{gt.title(game)}</span>{game.isNew && <em className="gm-new">{t("arc.new")}</em>}</strong><small>{game.languages.map(gt.language).join(" · ")}</small></span>
          </Link>)}
        </div>)}
      </div>
      <Link role="menuitem" className="gm-all" href="/games">{t("games.allGames")} →</Link>
    </div>
  </div>;
}
