"use client";

import Link from "next/link";
import GameThumb from "@/components/games/shared/GameThumb";
import { useLocale } from "@/components/shared/LocaleProvider";
import { useGameText } from "@/hooks/useGameText";
import type { TypingGame } from "@/data/games";
import { Badge, Icon, cardClass, cx } from "@/components/ui/ui";

const LEVEL_TONE = { basic: "bg-emerald-400", intermediate: "bg-amber-400", advanced: "bg-rose-500" } as const;

/** Language chips: short, so cards stay compact in both UI languages. */
export function LanguageChips({ languages, className = "" }: { languages: TypingGame["languages"]; className?: string }) {
  const gt = useGameText();
  return <span className={cx("flex flex-wrap gap-1", className)}>{languages.map((l) => <Badge key={l} tone="brand"><span className={l === "khmer" ? "font-khmer" : ""}>{gt.language(l)}</span></Badge>)}</span>;
}

/**
 * The one game card used on the home page and in the Game Center: 16:9 artwork, skill level, languages,
 * difficulty range, the learner's best score, and a single Play action. The whole card is one link.
 */
export default function GameCard({ game, best = 0, plays = 0, size = "md", priority }: { game: TypingGame; best?: number; plays?: number; size?: "md" | "lg"; priority?: boolean }) {
  const { t } = useLocale();
  const gt = useGameText();
  const range = `${gt.difficulty(game.difficulties[0])}–${gt.difficulty(game.difficulties[game.difficulties.length - 1])}`;
  return (
    <Link href={game.href} className={cx(cardClass, "group flex h-full flex-col overflow-hidden transition duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[var(--shadow-lg)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand")} data-priority={priority || undefined}>
      <div className={`relative aspect-video overflow-hidden bg-gradient-to-br ${game.gradient}`}>
        <div className="absolute inset-0 transition duration-500 group-hover:scale-[1.04]"><GameThumb id={game.id} /></div>
        {game.isNew && <Badge tone="new" className="absolute right-3 top-3 shadow">{t("arc.new")}</Badge>}
        <Badge tone="dark" className="absolute bottom-3 left-3"><span className={`h-1.5 w-1.5 rounded-full ${LEVEL_TONE[game.level]}`} />{t(`nav.level.${game.level}`)}</Badge>
        <span className="absolute bottom-3 right-3 grid h-11 w-11 translate-y-2 place-items-center rounded-full bg-white text-brand opacity-0 shadow-lg transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100" aria-hidden="true"><Icon name="play" size={18} /></span>
      </div>
      <div className={cx("flex flex-1 flex-col", size === "lg" ? "p-5" : "p-4")}>
        <div className="flex flex-wrap items-center gap-1.5">
          <LanguageChips languages={game.languages} />
          <Badge>{gt.category(game.category)}</Badge>
        </div>
        <h3 className={cx("mt-2.5 font-extrabold tracking-tight text-navy", size === "lg" ? "text-xl" : "text-lg")}>{gt.title(game)}</h3>
        <p className="mt-0.5 line-clamp-2 text-sm text-mute">{size === "lg" ? gt.description(game) : gt.skill(game)}</p>
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-3 text-xs">
          <span className="inline-flex items-center gap-1 font-semibold text-mute"><Icon name="bolt" size={14} />{range}</span>
          {best > 0
            ? <span className="inline-flex items-center gap-1 font-bold text-navy" title={t("ui.games.plays", { n: plays })}><Icon name="trophy" size={14} className="text-amber-500" />{best.toLocaleString("en-US")}</span>
            : <span className="font-semibold text-brand">{t("ui.games.playFree")}</span>}
        </div>
      </div>
    </Link>
  );
}
