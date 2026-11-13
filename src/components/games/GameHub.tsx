"use client";

import Link from "next/link";
import { useState } from "react";
import GameCard, { LanguageChips } from "@/components/games/GameCard";
import GameThumb from "@/components/games/shared/GameThumb";
import { GAME_CATEGORIES, typingGames, type GameCategory, type GameId } from "@/data/games";
import { useLocale } from "@/components/shared/LocaleProvider";
import { useGameText } from "@/hooks/useGameText";
import { useScores } from "@/hooks/use-stored-value";
import { useTypingProgress } from "@/hooks/useTypingProgress";
import { ARCADE_DIFFICULTIES, type ArcadeDifficulty } from "@/lib/arcade/difficulty";
import { bestForGame } from "@/lib/local-progress";
import { recommendGames } from "@/lib/game-recommendations";
import { Badge, EmptyState, Icon, PageHeader, Segmented, btn, cardClass, cx } from "@/components/ui/ui";
import type { Language } from "@/types";

type Filter<T extends string> = T | "all";

/** The game highlighted at the top of the Game Center. */
const FEATURED_ID: GameId = "space-shooter";
const GAME_IDS = new Set<string>(typingGames.map((g) => g.id));

export default function GameHub() {
  const { t } = useLocale();
  const gt = useGameText();
  const scores = useScores();
  const { store, hydrated } = useTypingProgress();
  const [language, setLanguage] = useState<Filter<Language>>("all");
  const [difficulty, setDifficulty] = useState<Filter<ArcadeDifficulty>>("all");
  const [category, setCategory] = useState<Filter<GameCategory>>("all");
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const shown = typingGames.filter((g) => (language === "all" || g.languages.includes(language)) && (difficulty === "all" || g.difficulties.includes(difficulty)) && (category === "all" || g.category === category)
    && (!q || `${gt.title(g)} ${g.title} ${gt.skill(g)}`.toLowerCase().includes(q)));
  const filtered = language !== "all" || difficulty !== "all" || category !== "all" || !!q;
  const reset = () => { setLanguage("all"); setDifficulty("all"); setCategory("all"); setQuery(""); };

  // Recently played: the latest game sessions on this device, newest first, one per game.
  const recent: { id: GameId; at: string }[] = [];
  if (hydrated) for (const s of [...store.sessions].sort((a, b) => b.completedAt.localeCompare(a.completedAt))) {
    if (GAME_IDS.has(s.activity) && !recent.some((r) => r.id === s.activity)) recent.push({ id: s.activity as GameId, at: s.completedAt });
    if (recent.length === 4) break;
  }
  const rec = hydrated ? recommendGames(store.sessions, typingGames) : null;
  const featured = typingGames.find((g) => g.id === FEATURED_ID)!;
  const featuredBest = hydrated ? bestForGame(scores, featured.id) : 0;
  const categories = GAME_CATEGORIES.filter((c) => typingGames.some((g) => g.category === c));
  const entry = (id: string) => Object.entries(scores).filter(([k]) => k === id || k.startsWith(`${id}:`)).reduce((n, [, s]) => n + s.plays, 0);

  return <div className="min-h-screen bg-surface text-navy">
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6">
      <PageHeader kicker={t("gamehub.kicker")} title={t("gamehub.title")} subtitle={t("gamehub.subtitle")} />

      {/* Featured */}
      <section aria-labelledby="featured-heading" className={cx(cardClass, "group relative grid overflow-hidden lg:grid-cols-[1.25fr_1fr]")}>
        <Link href={featured.href} tabIndex={-1} aria-hidden="true" className={`relative block aspect-video overflow-hidden bg-gradient-to-br ${featured.gradient} lg:aspect-auto lg:min-h-[320px]`}>
          <div className="absolute inset-0 transition duration-700 group-hover:scale-[1.03]"><GameThumb id={featured.id} /></div>
        </Link>
        <div className="flex flex-col justify-center gap-4 p-6 sm:p-8">
          <div className="flex flex-wrap gap-1.5"><Badge tone="new" icon="star">{t("ui.games.featured")}</Badge><LanguageChips languages={featured.languages} /><Badge>{gt.category(featured.category)}</Badge></div>
          <div>
            <h2 id="featured-heading" className="text-2xl font-extrabold tracking-tight sm:text-3xl">{gt.title(featured)}</h2>
            <p className="mt-2 leading-relaxed text-mute">{gt.description(featured)}</p>
          </div>
          <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <div><dt className="text-xs font-semibold text-mute">{t("gamehub.skill").replace(/[:：៖]\s*$/, "")}</dt><dd className="font-bold">{gt.skill(featured)}</dd></div>
            <div><dt className="text-xs font-semibold text-mute">{t("gamehub.difficulty")}</dt><dd className="font-bold">{gt.difficulty(featured.difficulties[0])}–{gt.difficulty(featured.difficulties[featured.difficulties.length - 1])}</dd></div>
            <div><dt className="text-xs font-semibold text-mute">{t("gamehub.best")}</dt><dd className="font-bold tabular-nums">{featuredBest > 0 ? featuredBest.toLocaleString("en-US") : "—"}</dd></div>
          </dl>
          <div><Link href={featured.href} className={btn("primary", "lg")}>{t("gamehub.playNow")}</Link></div>
        </div>
      </section>

      {/* Recently played */}
      {recent.length > 0 && <section className="mt-10" aria-labelledby="recent-heading">
        <h2 id="recent-heading" className="mb-3 text-lg font-extrabold tracking-tight">{t("ui.games.recent")}</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {recent.map(({ id }) => {
            const game = typingGames.find((g) => g.id === id)!;
            const best = bestForGame(scores, id);
            return <li key={id}><Link href={game.href} className={cx(cardClass, "flex items-center gap-3 p-2.5 pr-4 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]")}>
              <span className={`relative aspect-video w-24 flex-none overflow-hidden rounded-lg bg-gradient-to-br ${game.gradient}`}><GameThumb id={id} /></span>
              <span className="min-w-0"><span className="block truncate text-sm font-bold">{gt.title(game)}</span><span className="mt-0.5 flex items-center gap-1 text-xs text-mute"><Icon name="trophy" size={12} className="text-amber-500" />{best > 0 ? best.toLocaleString("en-US") : "—"}</span></span>
            </Link></li>;
          })}
        </ul>
      </section>}

      {/* Recommended: from the learner's own speed and play history */}
      {rec && rec.games.length > 0 && <section className="mt-10" aria-labelledby="rec-heading">
        <div className="mb-3">
          <h2 id="rec-heading" className="flex items-center gap-2 text-lg font-extrabold tracking-tight"><Icon name="sparkle" size={18} className="text-brand" />{t("ui.games.recTitle")}</h2>
          <p className="text-sm text-mute">{rec.reason.kind === "starter" ? t("ui.games.recStarter") : t("ui.games.recSpeed", { wpm: rec.reason.wpm, lang: t(`category.${rec.reason.language}`) })}</p>
        </div>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rec.games.map((game) => <li key={game.id}><GameCard game={game} best={bestForGame(scores, game.id)} plays={entry(game.id)} /></li>)}
        </ul>
      </section>}

      {/* Filters */}
      <section className="mt-10" aria-labelledby="all-heading">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 id="all-heading" className="text-xl font-extrabold tracking-tight sm:text-2xl">{t("ui.games.all")} <span className="text-base font-bold text-mute">{shown.length}/{typingGames.length}</span></h2>
          <label className="relative w-full sm:w-64">
            <span className="sr-only">{t("ui.games.search")}</span>
            <Icon name="search" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("ui.games.search")} className="h-10 w-full rounded-xl border border-line bg-card pl-9 pr-3 text-sm outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" />
          </label>
        </div>
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div role="group" aria-label={t("gamehub.category")} className="-mx-1 flex max-w-full gap-1.5 overflow-x-auto px-1 pb-1">
            {([["all", t("gamehub.all")], ...categories.map((c) => [c, gt.category(c)])] as [Filter<GameCategory>, string][]).map(([value, label]) => (
              <button key={value} type="button" aria-pressed={category === value} onClick={() => setCategory(value)}
                className={cx("h-9 whitespace-nowrap rounded-full px-4 text-[13px] font-bold transition", category === value ? "bg-navy text-white" : "bg-card text-navy ring-1 ring-inset ring-line hover:ring-slate-300")}>{label}</button>
            ))}
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Segmented size="sm" label={t("gamehub.language")} value={language} onChange={setLanguage} options={[{ value: "all", label: t("gamehub.all") }, { value: "english", label: t("category.english") }, { value: "khmer", label: t("category.khmer") }]} />
            <label className="sr-only" htmlFor="gh-diff">{t("gamehub.difficulty")}</label>
            <select id="gh-diff" value={difficulty} onChange={(e) => setDifficulty(e.target.value as Filter<ArcadeDifficulty>)} className="h-9 rounded-xl border border-line bg-card px-3 text-[13px] font-bold text-navy outline-none focus:border-brand">
              <option value="all">{t("gamehub.difficulty")}: {t("gamehub.all")}</option>
              {ARCADE_DIFFICULTIES.map((d) => <option key={d} value={d}>{gt.difficulty(d)}</option>)}
            </select>
            {filtered && <button type="button" onClick={reset} className="h-9 px-2 text-[13px] font-bold text-brand hover:underline">{t("gamehub.clear")}</button>}
          </div>
        </div>

        {shown.length === 0
          ? <EmptyState icon="games" title={t("gamehub.emptyTitle")} text={t("gamehub.emptyText")} action={<button type="button" className={btn("primary")} onClick={reset}>{t("gamehub.clear")}</button>} />
          : <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((game) => <li key={game.id}><GameCard game={game} best={hydrated ? bestForGame(scores, game.id) : 0} plays={hydrated ? entry(game.id) : 0} size="lg" /></li>)}
            </ul>}
      </section>

      <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-navy p-6 text-white">
        <p className="text-sm"><strong>{t("gamehub.ctaTitle")}</strong> <span className="text-slate-300">{t("gamehub.ctaText")}</span></p>
        <div className="flex gap-2"><Link href="/learn/english" className={btn("inverse", "md")}>{t("gamehub.practiceEn")}</Link><Link href="/learn/khmer" className={btn("outlineLight", "md")}>{t("gamehub.practiceKh")}</Link></div>
      </div>
    </main>
  </div>;
}
