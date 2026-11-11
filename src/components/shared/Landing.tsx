"use client";

import Link from "next/link";
import GameThumb from "@/components/games/shared/GameThumb";
import { primaryBtn, secondaryBtn } from "@/components/games/shared/GameDialog";
import { Sk } from "@/components/skeleton/Skeleton";
import { useHydrated } from "@/hooks/useTypingProgress";
import { typingGames } from "@/data/games";
import { usePracticeBest, useScores } from "@/hooks/use-stored-value";
import { bestForGame } from "@/lib/local-progress";
import { useLocale } from "@/components/shared/LocaleProvider";
import { useGameText } from "@/hooks/useGameText";

const benefits = [{ icon: "📚", n: 1 }, { icon: "🇰🇭", n: 2 }, { icon: "🎮", n: 3 }, { icon: "🏆", n: 4 }];

export default function Landing({ children }: { children?: React.ReactNode }) {
  const { t } = useLocale();
  const gt = useGameText();
  const practice = usePracticeBest();
  const scores = useScores();
  const hydrated = useHydrated();
  const totalPlays = Object.values(scores).reduce((sum, s) => sum + s.plays, 0);

  return <div className="min-h-screen bg-surface text-navy">
    <main>
      <section className="relative overflow-hidden bg-gradient-to-br from-navy via-slate-900 to-blue-900 text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div>
            <p className="mb-3 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-sky-300">{t("overview.badge")}</p>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">{t("overview.heroPre")} <span className="text-accent">{t("category.english")}</span> {t("overview.heroAnd")} <span className="text-accent">{t("category.khmer")}</span>{t("overview.heroPost")}</h1>
            <p className="mt-5 max-w-xl text-lg text-slate-300">{t("overview.heroText")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/learn" className={`${primaryBtn} !px-7 !py-3.5 !text-base`}>{t("overview.ctaStart")}</Link>
              <Link href="/setup" className={`${secondaryBtn} !px-7 !py-3.5 !text-base`}>{t("overview.ctaQuick")}</Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3" aria-hidden="true">
            <div className="col-span-2 overflow-hidden rounded-3xl bg-gradient-to-br from-sky-400 to-blue-600 shadow-xl"><div className="aspect-[2/1]"><GameThumb id="letter-jump" /></div></div>
            <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-slate-900 shadow-xl"><div className="aspect-[2/1]"><GameThumb id="word-sprint" /></div></div>
            <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-fuchsia-500 to-indigo-700 shadow-xl"><div className="aspect-[2/1]"><GameThumb id="sentence-rush" /></div></div>
            <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 to-sky-500 shadow-xl"><div className="aspect-[2/1]"><GameThumb id="mario-khmer-quest" /></div></div>
            <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-amber-400 to-rose-500 shadow-xl"><div className="aspect-[2/1]"><GameThumb id="english-quest" /></div></div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6" aria-labelledby="practice-heading">
        <h2 id="practice-heading" className="text-2xl font-extrabold sm:text-3xl">{t("overview.pathTitle")}</h2>
        <p className="mt-1 text-mute">{t("overview.pathSub")}</p>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-2xl font-extrabold text-brand">Aa</span><div><p className="text-xl font-extrabold">English</p><p className="text-sm text-mute">{t("overview.enMeta")}</p></div></div>
            <p className="mt-4 text-sm text-slate-600">{t("overview.enDesc")}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/learn" className={primaryBtn}>{t("overview.enStart")}</Link>
              <Link href="/learn/english" className="self-center text-xs font-semibold text-mute hover:text-brand">{t("overview.enNow")}</Link>
              {practice.english && <span className="self-center text-xs font-semibold text-mute">{t("overview.best", { wpm: practice.english.bestWpm })}</span>}
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 font-khmer text-2xl font-extrabold text-emerald-700">ក</span><div><p className="text-xl font-extrabold">ខ្មែរ Khmer</p><p className="text-sm text-mute">{t("overview.khMeta")}</p></div></div>
            <p className="mt-4 text-sm text-slate-600">{t("overview.khDesc")}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/learn" className={primaryBtn}>{t("overview.khStart")}</Link>
              <Link href="/learn/khmer" className="self-center text-xs font-semibold text-mute hover:text-brand">{t("overview.khNow")}</Link>
              {practice.khmer && <span className="self-center text-xs font-semibold text-mute">{t("overview.best", { wpm: practice.khmer.bestWpm })}</span>}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-14" aria-labelledby="games-heading">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><h2 id="games-heading" className="text-2xl font-extrabold sm:text-3xl">{t("overview.gamesTitle")}</h2><p className="mt-1 text-mute">{t("overview.gamesSub")}</p></div>
            <Link href="/games" className={secondaryBtn}>{t("overview.seeAll")}</Link>
          </div>
          <ul className="mt-6 grid gap-5 md:grid-cols-3">
            {typingGames.map((game) => {
              const best = bestForGame(scores, game.id);
              return <li key={game.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-surface shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className={`h-36 bg-gradient-to-br ${game.gradient}`} aria-hidden="true"><GameThumb id={game.id} /></div>
                <div className="p-5">
                  <p className="text-lg font-extrabold">{gt.title(game)}</p>
                  <p className="mt-1 text-sm text-slate-600">{gt.skill(game)}</p>
                  <div className="mt-4 flex items-center justify-between"><span className="text-xs font-semibold text-mute">{best > 0 ? `🏆 ${best.toLocaleString("en-US")}` : game.languages.map(gt.language).join(" · ")}</span><Link href={game.href} className={primaryBtn}>{t("overview.play", { title: gt.title(game) })}</Link></div>
                </div>
              </li>;
            })}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6" aria-labelledby="benefits-heading">
        <h2 id="benefits-heading" className="text-2xl font-extrabold sm:text-3xl">{t("overview.whyTitle")}</h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b) => <li key={b.n} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="text-3xl" aria-hidden="true">{b.icon}</div><p className="mt-2 font-extrabold">{t(`overview.b${b.n}Title`)}</p><p className="mt-1 text-sm text-slate-600">{t(`overview.b${b.n}Text`)}</p></li>)}
        </ul>
      </section>

      {children}

      <section id="progress" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-16 sm:px-6" aria-labelledby="progress-heading">
        <div className="rounded-3xl bg-gradient-to-br from-brand to-blue-800 p-8 text-white shadow-lg sm:p-10">
          <h2 id="progress-heading" className="text-2xl font-extrabold sm:text-3xl">{t("overview.progTitle")}</h2>
          <p className="mt-1 text-blue-100">{t("overview.progSub")}</p>
          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              [t("overview.statEn"), practice.english?.bestWpm ?? "—"],
              [t("overview.statKh"), practice.khmer?.bestWpm ?? "—"],
              [t("overview.statPlays"), totalPlays || "—"],
              [t("overview.statTop"), Math.max(0, ...typingGames.map((g) => bestForGame(scores, g.id))) || "—"],
            ].map(([label, value]) => <div key={String(label)} className="rounded-2xl bg-white/10 p-4"><dt className="text-xs font-bold uppercase tracking-wider text-blue-100">{label}</dt><dd className="mt-1 text-3xl font-extrabold tabular-nums">{hydrated ? value : <Sk className="inline-block h-8 w-14 bg-white/25" />}</dd></div>)}
          </dl>
          <div className="mt-6 flex flex-wrap gap-3"><Link href="/learn" className={`${secondaryBtn} !border-white !bg-white`}>{t("overview.continue")}</Link><Link href="/progress" className={`${secondaryBtn} !border-white !bg-white`}>{t("overview.viewProgress")}</Link></div>
        </div>
      </section>
    </main>
  </div>;
}
