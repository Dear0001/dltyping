"use client";

import Link from "next/link";
import GameThumb from "@/components/games/shared/GameThumb";
import { primaryBtn, secondaryBtn } from "@/components/games/shared/GameDialog";
import SiteHeader from "@/components/shared/SiteHeader";
import { typingGames } from "@/data/games";
import { usePracticeBest, useScores } from "@/hooks/use-stored-value";
import { bestForGame } from "@/lib/local-progress";

const benefits = [
  { icon: "⚡", title: "Build real speed", text: "Live WPM, accuracy and error tracking show exactly where you improve." },
  { icon: "🇰🇭", title: "Khmer, done properly", text: "NiDA keyboard, Unicode-aware clusters, and lessons from single letters to sentences." },
  { icon: "🎮", title: "Learn by playing", text: "Three typing games turn drills into quick, replayable challenges." },
  { icon: "💾", title: "Progress that stays", text: "Best scores and settings are saved in your browser. No account required." },
];

export default function Landing() {
  const practice = usePracticeBest();
  const scores = useScores();
  const totalPlays = Object.values(scores).reduce((sum, s) => sum + s.plays, 0);

  return <div className="min-h-screen bg-surface text-navy">
    <SiteHeader />
    <main>
      <section className="relative overflow-hidden bg-gradient-to-br from-navy via-slate-900 to-blue-900 text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div>
            <p className="mb-3 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-sky-300">English · ខ្មែរ · Free · No sign-up</p>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">Type faster in <span className="text-accent">English</span> and <span className="font-khmer text-accent">ខ្មែរ</span>.</h1>
            <p className="mt-5 max-w-xl text-lg text-slate-300">Guided lessons, live feedback and playable typing games that build speed, accuracy and keyboard confidence — starting right now.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/setup" className={`${primaryBtn} !px-7 !py-3.5 !text-base`}>Start Typing</Link>
              <Link href="/games" className={`${secondaryBtn} !px-7 !py-3.5 !text-base`}>Explore Typing Games</Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3" aria-hidden="true">
            <div className="col-span-2 overflow-hidden rounded-3xl bg-gradient-to-br from-sky-400 to-blue-600 shadow-xl"><div className="aspect-[2/1]"><GameThumb id="letter-jump" /></div></div>
            <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-slate-900 shadow-xl"><div className="aspect-[2/1]"><GameThumb id="word-sprint" /></div></div>
            <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 to-sky-500 shadow-xl"><div className="aspect-[2/1]"><GameThumb id="mario-khmer-quest" /></div></div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6" aria-labelledby="practice-heading">
        <h2 id="practice-heading" className="text-2xl font-extrabold sm:text-3xl">Pick a language and start</h2>
        <p className="mt-1 text-mute">Each track has lessons, a virtual keyboard and a live results summary.</p>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-2xl font-extrabold text-brand">Aa</span><div><h3 className="text-xl font-extrabold">English</h3><p className="text-sm text-mute">QWERTY · beginner to intermediate</p></div></div>
            <p className="mt-4 text-sm text-slate-600">Home-row warm-ups, everyday words and focus passages with WPM and accuracy tracking.</p>
            <div className="mt-5 flex flex-wrap gap-2"><Link href="/learn/english" className={primaryBtn}>Practice English</Link>{practice.english && <span className="self-center text-xs font-semibold text-mute">Best: {practice.english.bestWpm} WPM · {practice.english.bestAccuracy}%</span>}</div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 font-khmer text-2xl font-extrabold text-brand">ក</span><div><h3 className="text-xl font-extrabold">ខ្មែរ Khmer</h3><p className="text-sm text-mute">NiDA keyboard · Unicode-aware</p></div></div>
            <p className="mt-4 text-sm text-slate-600">Consonants, syllables, daily words and short stories with cluster-aware feedback.</p>
            <div className="mt-5 flex flex-wrap gap-2"><Link href="/learn/khmer" className={primaryBtn}>Practice Khmer</Link>{practice.khmer && <span className="self-center text-xs font-semibold text-mute">Best: {practice.khmer.bestWpm} WPM · {practice.khmer.bestAccuracy}%</span>}</div>
          </div>
        </div>
      </section>

      <section className="bg-white py-14" aria-labelledby="games-heading">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><h2 id="games-heading" className="text-2xl font-extrabold sm:text-3xl">Featured typing games</h2><p className="mt-1 text-mute">Quick, replayable challenges that make practice fun.</p></div>
            <Link href="/games" className={secondaryBtn}>See all games →</Link>
          </div>
          <ul className="mt-6 grid gap-5 md:grid-cols-3">
            {typingGames.map((game) => {
              const best = bestForGame(scores, game.id);
              return <li key={game.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-surface shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className={`h-36 bg-gradient-to-br ${game.gradient}`} aria-hidden="true"><GameThumb id={game.id} /></div>
                <div className="p-5">
                  <h3 className="text-lg font-extrabold">{game.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{game.skill}</p>
                  <div className="mt-4 flex items-center justify-between"><span className="text-xs font-semibold text-mute">{best > 0 ? `🏆 ${best.toLocaleString("en-US")}` : game.languages.map((l) => (l === "khmer" ? "Khmer" : "English")).join(" · ")}</span><Link href={game.href} className={primaryBtn}>Play Now</Link></div>
                </div>
              </li>;
            })}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6" aria-labelledby="benefits-heading">
        <h2 id="benefits-heading" className="text-2xl font-extrabold sm:text-3xl">Why Keyflow</h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b) => <li key={b.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="text-3xl" aria-hidden="true">{b.icon}</div><h3 className="mt-2 font-extrabold">{b.title}</h3><p className="mt-1 text-sm text-slate-600">{b.text}</p></li>)}
        </ul>
      </section>

      <section id="progress" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-16 sm:px-6" aria-labelledby="progress-heading">
        <div className="rounded-3xl bg-gradient-to-br from-brand to-blue-800 p-8 text-white shadow-lg sm:p-10">
          <h2 id="progress-heading" className="text-2xl font-extrabold sm:text-3xl">Your progress, on this device</h2>
          <p className="mt-1 text-blue-100">Saved in your browser — no login needed.</p>
          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Best English WPM", practice.english?.bestWpm ?? "—"],
              ["Best Khmer WPM", practice.khmer?.bestWpm ?? "—"],
              ["Games played", totalPlays || "—"],
              ["Top game score", Math.max(0, ...typingGames.map((g) => bestForGame(scores, g.id))) || "—"],
            ].map(([label, value]) => <div key={String(label)} className="rounded-2xl bg-white/10 p-4"><dt className="text-xs font-bold uppercase tracking-wider text-blue-100">{label}</dt><dd className="mt-1 text-3xl font-extrabold tabular-nums">{value}</dd></div>)}
          </dl>
          <div className="mt-6 flex flex-wrap gap-3"><Link href="/learn/english" className={`${secondaryBtn} !border-white !bg-white`}>Quick start: English</Link><Link href="/learn/khmer" className={`${secondaryBtn} !border-white !bg-white`}>Quick start: Khmer</Link></div>
        </div>
      </section>
    </main>
    <footer className="border-t border-slate-200 bg-white py-8 text-center text-sm text-mute">
      <p>Keyflow · Free English &amp; Khmer typing practice <span className="text-bad">♥</span></p>
      <nav className="mt-2 flex justify-center gap-5 font-semibold" aria-label="Footer"><Link href="/setup" className="hover:text-brand">Practice</Link><Link href="/games" className="hover:text-brand">Games</Link><Link href="/learn/english" className="hover:text-brand">English</Link><Link href="/learn/khmer" className="hover:text-brand">Khmer</Link></nav>
    </footer>
  </div>;
}
