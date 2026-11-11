"use client";

import Link from "next/link";
import { useState } from "react";
import GameThumb from "@/components/games/shared/GameThumb";
import { primaryBtn, secondaryBtn } from "@/components/games/shared/GameDialog";
import { typingGames, type GameCategory } from "@/data/games";
import { useLocale } from "@/components/shared/LocaleProvider";
import { useGameText } from "@/hooks/useGameText";
import { useScores } from "@/hooks/use-stored-value";
import type { Difficulty } from "@/lib/game-engine";
import { bestForGame } from "@/lib/local-progress";
import type { Language } from "@/types";

type Filter<T extends string> = T | "all";

function Chips<T extends string>({ label, value, options, onChange }: { label: string; value: Filter<T>; options: { value: Filter<T>; label: string }[]; onChange: (v: Filter<T>) => void }) {
  return <div role="group" aria-label={label} className="flex flex-wrap items-center gap-1.5">
    <span className="mr-1 text-xs font-bold uppercase tracking-wider text-mute">{label}</span>
    {options.map((o) => <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)} className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${value === o.value ? "border-brand bg-brand text-white" : "border-slate-300 bg-white text-navy hover:border-brand"}`}>{o.label}</button>)}
  </div>;
}

export default function GameHub() {
  const { t } = useLocale();
  const gt = useGameText();
  const scores = useScores();
  const [language, setLanguage] = useState<Filter<Language>>("all");
  const [difficulty, setDifficulty] = useState<Filter<Difficulty>>("all");
  const [category, setCategory] = useState<Filter<GameCategory>>("all");

  const shown = typingGames.filter((g) => (language === "all" || g.languages.includes(language)) && (difficulty === "all" || g.difficulties.includes(difficulty)) && (category === "all" || g.category === category));
  const reset = () => { setLanguage("all"); setDifficulty("all"); setCategory("all"); };

  return <div className="min-h-screen bg-surface text-navy">
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-brand">{t("gamehub.kicker")}</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">{t("gamehub.title")}</h1>
        <p className="mt-1 max-w-2xl text-mute">{t("gamehub.subtitle")}</p>
      </div>
      <div className="mb-6 space-y-2.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <Chips label={t("gamehub.language")} value={language} onChange={setLanguage} options={[{ value: "all", label: t("gamehub.all") }, { value: "english", label: t("category.english") }, { value: "khmer", label: t("category.khmer") }]} />
        <Chips label={t("gamehub.difficulty")} value={difficulty} onChange={setDifficulty} options={[{ value: "all", label: t("gamehub.all") }, ...(["easy", "medium", "hard"] as const).map((d) => ({ value: d, label: gt.difficulty(d) }))]} />
        <Chips label={t("gamehub.category")} value={category} onChange={setCategory} options={[{ value: "all", label: t("gamehub.all") }, ...(["accuracy", "speed", "adventure"] as GameCategory[]).map((c) => ({ value: c, label: gt.category(c) }))]} />
      </div>

      {shown.length === 0
        ? <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <div className="text-4xl" aria-hidden="true">🔍</div>
            <h2 className="mt-2 text-lg font-bold">{t("gamehub.emptyTitle")}</h2>
            <p className="mb-4 text-sm text-mute">{t("gamehub.emptyText")}</p>
            <button type="button" className={primaryBtn} onClick={reset}>{t("gamehub.clear")}</button>
          </div>
        : <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {shown.map((game) => {
              const best = bestForGame(scores, game.id);
              return <li key={game.id} className="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <Link href={game.href} className={`block h-40 bg-gradient-to-br ${game.gradient}`} tabIndex={-1} aria-hidden="true"><GameThumb id={game.id} /></Link>
                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-2 flex flex-wrap gap-1.5 text-[11px] font-bold">
                    {game.languages.map((l) => <span key={l} className="rounded-full bg-blue-50 px-2.5 py-1 text-brand">{gt.language(l)}</span>)}
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">{gt.category(game.category)}</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">{gt.difficulty(game.difficulties[0])}–{gt.difficulty(game.difficulties[game.difficulties.length - 1])}</span>
                  </div>
                  <h2 className="text-xl font-extrabold">{gt.title(game)}</h2>
                  <p className="mt-1 flex-1 text-sm text-slate-600">{gt.description(game)}</p>
                  <p className="mt-3 text-xs font-semibold text-mute">{t("gamehub.skill")}<span className="text-navy">{gt.skill(game)}</span></p>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-mute">{best > 0 ? <>🏆 {t("gamehub.best")} <strong className="text-navy">{best.toLocaleString("en-US")}</strong></> : t("gamehub.noRecord")}</span>
                    <Link href={game.href} className={primaryBtn}>{t("gamehub.playNow")}</Link>
                  </div>
                </div>
              </li>;
            })}
          </ul>}
      <div className="mt-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-navy p-5 text-white">
        <p className="text-sm"><strong>{t("gamehub.ctaTitle")}</strong> <span className="text-slate-300">{t("gamehub.ctaText")}</span></p>
        <div className="flex gap-2"><Link href="/learn/english" className={`${secondaryBtn} !py-2`}>{t("gamehub.practiceEn")}</Link><Link href="/learn/khmer" className={`${secondaryBtn} !py-2`}>{t("gamehub.practiceKh")}</Link></div>
      </div>
    </main>
  </div>;
}
