"use client";

import Link from "next/link";
import { useState } from "react";
import SiteHeader from "@/components/shared/SiteHeader";
import GameThumb from "@/components/games/shared/GameThumb";
import { primaryBtn, secondaryBtn } from "@/components/games/shared/GameDialog";
import { categoryLabels, difficultyLabels, typingGames, type GameCategory } from "@/data/games";
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
  const scores = useScores();
  const [language, setLanguage] = useState<Filter<Language>>("all");
  const [difficulty, setDifficulty] = useState<Filter<Difficulty>>("all");
  const [category, setCategory] = useState<Filter<GameCategory>>("all");

  const shown = typingGames.filter((g) => (language === "all" || g.languages.includes(language)) && (difficulty === "all" || g.difficulties.includes(difficulty)) && (category === "all" || g.category === category));
  const reset = () => { setLanguage("all"); setDifficulty("all"); setCategory("all"); };

  return <div className="min-h-screen bg-surface text-navy">
    <SiteHeader />
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-brand">Play · Practice · Improve</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">Typing games</h1>
        <p className="mt-1 max-w-2xl text-mute">Every game is free and works right away — no account, no sign-up. Scores are saved on this device.</p>
      </div>
      <div className="mb-6 space-y-2.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <Chips label="Language" value={language} onChange={setLanguage} options={[{ value: "all", label: "All" }, { value: "english", label: "English" }, { value: "khmer", label: "ខ្មែរ Khmer" }]} />
        <Chips label="Difficulty" value={difficulty} onChange={setDifficulty} options={[{ value: "all", label: "All" }, ...(["easy", "medium", "hard"] as const).map((d) => ({ value: d, label: difficultyLabels[d] }))]} />
        <Chips label="Category" value={category} onChange={setCategory} options={[{ value: "all", label: "All" }, ...(Object.keys(categoryLabels) as GameCategory[]).map((c) => ({ value: c, label: categoryLabels[c] }))]} />
      </div>

      {shown.length === 0
        ? <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <div className="text-4xl" aria-hidden="true">🔍</div>
            <h2 className="mt-2 text-lg font-bold">No games match those filters</h2>
            <p className="mb-4 text-sm text-mute">Try a different language, difficulty or category.</p>
            <button type="button" className={primaryBtn} onClick={reset}>Clear filters</button>
          </div>
        : <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {shown.map((game) => {
              const best = bestForGame(scores, game.id);
              return <li key={game.id} className="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <Link href={game.href} className={`block h-40 bg-gradient-to-br ${game.gradient}`} tabIndex={-1} aria-hidden="true"><GameThumb id={game.id} /></Link>
                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-2 flex flex-wrap gap-1.5 text-[11px] font-bold">
                    {game.languages.map((l) => <span key={l} className="rounded-full bg-blue-50 px-2.5 py-1 text-brand">{l === "khmer" ? "ខ្មែរ Khmer" : "English"}</span>)}
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">{categoryLabels[game.category]}</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">{difficultyLabels[game.difficulties[0]]}–{difficultyLabels[game.difficulties[game.difficulties.length - 1]]}</span>
                  </div>
                  <h2 className="text-xl font-extrabold">{game.title}</h2>
                  <p className="mt-1 flex-1 text-sm text-slate-600">{game.description}</p>
                  <p className="mt-3 text-xs font-semibold text-mute">Skill: <span className="text-navy">{game.skill}</span></p>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-mute">{best > 0 ? <>🏆 Best <strong className="text-navy">{best.toLocaleString("en-US")}</strong></> : "No record yet"}</span>
                    <Link href={game.href} className={primaryBtn}>Play Now →</Link>
                  </div>
                </div>
              </li>;
            })}
          </ul>}
      <div className="mt-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-navy p-5 text-white">
        <p className="text-sm"><strong>Want structured lessons first?</strong> <span className="text-slate-300">Warm up with a guided practice session.</span></p>
        <div className="flex gap-2"><Link href="/learn/english" className={`${secondaryBtn} !py-2`}>English practice</Link><Link href="/learn/khmer" className={`${secondaryBtn} !py-2`}>Khmer practice</Link></div>
      </div>
    </main>
  </div>;
}
