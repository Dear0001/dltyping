"use client";

import Link from "next/link";
import GameCard from "@/components/games/GameCard";
import HeroDemo from "@/components/home/HeroDemo";
import ContinueCard from "@/components/learn/ContinueCard";
import { Sk } from "@/components/skeleton/Skeleton";
import { useHydrated, useStreak } from "@/hooks/useTypingProgress";
import { typingGames } from "@/data/games";
import { curricula, getAllLessons } from "@/data/curriculum";
import { usePracticeBest, useScores, useUserProgress } from "@/hooks/use-stored-value";
import { bestForGame, levelFromXp } from "@/lib/local-progress";
import { useLocale } from "@/components/shared/LocaleProvider";
import { FACT_VARS, SITE_FACTS } from "@/lib/site-facts";
import { Badge, Icon, ProgressBar, SectionHeading, btn, cardClass, cx } from "@/components/ui/ui";
import type { Language } from "@/types";

/** Featured on the home page: the newest games first, then one gentle starter. */
const FEATURED = ["space-shooter", "car-racing", "letter-jump"] as const;

const PATHS: { lang: Language; glyph: string; href: string; practice: string; accent: string; ring: string; points: string[] }[] = [
  { lang: "english", glyph: "Aa", href: "/learn?lang=english", practice: "/learn/english", accent: "from-blue-600 to-sky-400", ring: "text-brand", points: ["ui.home.en1", "ui.home.en2", "ui.home.en3"] },
  { lang: "khmer", glyph: "ក", href: "/learn?lang=khmer", practice: "/learn/khmer", accent: "from-emerald-600 to-teal-400", ring: "text-emerald-600", points: ["ui.home.km1", "ui.home.km2", "ui.home.km3"] },
];

function PathCard({ path }: { path: (typeof PATHS)[number] }) {
  const { t } = useLocale();
  const progress = useUserProgress();
  const practice = usePracticeBest();
  const hydrated = useHydrated();
  const curriculum = curricula[path.lang];
  const lessons = getAllLessons(curriculum);
  const done = lessons.filter((l) => progress.completedLessons[`${path.lang}:${l.id}`]).length;
  const pct = Math.round((done / lessons.length) * 100);
  const best = practice[path.lang]?.bestWpm;
  const label = t(`category.${path.lang}`);
  return (
    <article className={cx(cardClass, "group relative flex flex-col overflow-hidden")}>
      <div className={`relative flex h-28 items-end justify-between overflow-hidden bg-gradient-to-br ${path.accent} px-6 pb-4 text-white`}>
        <span className={cx("pointer-events-none absolute -right-3 -top-6 select-none text-[8.5rem] font-black leading-none text-white/15", path.lang === "khmer" && "font-khmer")} aria-hidden="true">{path.glyph}</span>
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/80">{t(path.lang === "khmer" ? "ui.home.kmLayout" : "ui.home.enLayout")}</p>
          <h3 className="text-2xl font-extrabold tracking-tight">{t(`category.${path.lang}`)}</h3>
        </div>
        {hydrated && best ? <Badge tone="dark" icon="bolt" className="relative">{t("overview.best", { wpm: best })}</Badge> : null}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <p className="text-sm font-semibold text-mute">{t(path.lang === "khmer" ? "overview.khMeta" : "overview.enMeta", { levels: curriculum.courses.length, n: lessons.length })}</p>
        <ul className="mt-4 space-y-2.5">
          {path.points.map((k) => <li key={k} className="flex items-start gap-2.5 text-[15px] text-navy"><span className={cx("mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full bg-slate-100", path.ring)}><Icon name="check" size={13} strokeWidth={2.6} /></span>{t(k)}</li>)}
        </ul>
        <div className="mt-5">
          {hydrated ? <>
            <div className="mb-1.5 flex justify-between text-xs font-semibold text-mute"><span>{t("learn.lessonsDone", { done, total: lessons.length })}</span><span>{pct}%</span></div>
            <ProgressBar value={pct} tone={path.lang === "khmer" ? "success" : "brand"} label={t("learn.lessonsDone", { done, total: lessons.length })} />
          </> : <Sk className="h-6 w-full" />}
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Link href={path.href} className={btn("primary", "md", "flex-1 sm:flex-none")}>{t(done ? "learn.continueLang" : "learn.startLang", { lang: label })}<Icon name="arrow" size={16} /></Link>
          <Link href={path.practice} className={btn("ghost", "md")}>{t("ui.home.freePractice")}</Link>
        </div>
      </div>
    </article>
  );
}

/** Shown only to returning learners (some XP or a completed lesson): their next lessons and level at a glance. */
function WelcomeBack() {
  const { t } = useLocale();
  const progress = useUserProgress();
  const hydrated = useHydrated();
  const streak = useStreak();
  if (!hydrated || (progress.xp <= 0 && !Object.keys(progress.completedLessons).length)) return null;
  const level = levelFromXp(progress.xp);
  return (
    <section className="mx-auto max-w-6xl px-4 pt-10 sm:px-6" aria-labelledby="welcome-heading">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="welcome-heading" className="text-xl font-extrabold tracking-tight text-navy">{t("ui.home.welcome")}</h2>
        <div className="flex flex-wrap gap-2">
          <Badge tone="brand" icon="star">{t("ui.home.level", { n: level })} · {progress.xp} XP</Badge>
          {streak > 0 && <Badge tone="warning" icon="flame">{t("learn.streakDays", { n: streak })}</Badge>}
        </div>
      </div>
      <ContinueCard />
    </section>
  );
}

export default function Landing({ children }: { children?: React.ReactNode }) {
  const { t, locale } = useLocale();
  // Khmer does not put spaces between words, only between phrases.
  const sp = locale === "km" ? "" : " ";
  const practice = usePracticeBest();
  const scores = useScores();
  const hydrated = useHydrated();
  const totalPlays = Object.values(scores).reduce((sum, s) => sum + s.plays, 0);
  const featured = FEATURED.map((id) => typingGames.find((g) => g.id === id)!);

  return <div className="min-h-screen bg-surface text-navy">
    <main>
      {/* ---------- Hero ---------- */}
      <section className="hero-surface relative overflow-hidden border-b border-line">
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pb-24 lg:pt-20">
          <div>
            <Badge tone="brand" icon="sparkle" className="!px-3 !py-1 !text-xs">{t("ui.home.badge")}</Badge>
            <h1 className="mt-5 text-[2.6rem] font-extrabold leading-[1.05] tracking-tight text-navy sm:text-6xl">
              {t("overview.heroPre")}{sp}<span className="text-brand">{t("category.english")}</span> {t("overview.heroAnd")}{sp}<span className="hero-khmer bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">{t("category.khmer")}</span>{t("overview.heroPost")}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-mute">{t("overview.heroText")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/learn" className={btn("primary", "lg")}>{t("overview.ctaStart")}<Icon name="arrow" size={18} /></Link>
              <Link href="/setup" className={btn("secondary", "lg")}><Icon name="bolt" size={18} className="text-amber-500" />{t("overview.ctaQuick")}</Link>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-line pt-6">
              {[["ui.home.factEn", SITE_FACTS.enLessons], ["ui.home.factKm", SITE_FACTS.kmLessons], ["ui.home.factGames", SITE_FACTS.games]].map(([k, n]) => (
                <div key={k}><dt className="text-xs font-semibold text-mute">{t(String(k))}</dt><dd className="mt-0.5 text-2xl font-extrabold tabular-nums text-navy">{n}</dd></div>
              ))}
            </dl>
          </div>
          <HeroDemo />
        </div>
      </section>

      <WelcomeBack />

      {/* ---------- Learning paths ---------- */}
      <section className="mx-auto max-w-6xl px-4 pt-16 sm:px-6" aria-labelledby="practice-heading">
        <SectionHeading id="practice-heading" title={t("overview.pathTitle")} subtitle={t("overview.pathSub")} />
        <div className="grid gap-5 md:grid-cols-2">{PATHS.map((p) => <PathCard key={p.lang} path={p} />)}</div>
      </section>

      {/* ---------- Featured games ---------- */}
      <section className="mx-auto max-w-6xl px-4 pt-16 sm:px-6" aria-labelledby="games-heading">
        <SectionHeading id="games-heading" title={t("overview.gamesTitle")} subtitle={t("overview.gamesSub")}
          action={<Link href="/games" className={btn("secondary", "sm")}>{t("ui.home.allGames", { n: SITE_FACTS.games })}<Icon name="arrow" size={15} /></Link>} />
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((game) => <li key={game.id}><GameCard game={game} best={hydrated ? bestForGame(scores, game.id) : 0} /></li>)}
        </ul>
      </section>

      {/* ---------- Why (short) ---------- */}
      <section className="mx-auto max-w-6xl px-4 pt-16 sm:px-6" aria-labelledby="benefits-heading">
        <h2 id="benefits-heading" className="sr-only">{t("overview.whyTitle")}</h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {([["learn", 1, "bg-blue-50 text-brand"], ["globe", 2, "bg-emerald-50 text-emerald-600"], ["games", 3, "bg-violet-50 text-violet-600"], ["trophy", 4, "bg-amber-50 text-amber-600"]] as const).map(([icon, n, tone]) => (
            <li key={n} className={cx(cardClass, "p-5")}>
              <span className={`grid h-10 w-10 place-items-center rounded-xl ${tone}`}><Icon name={icon} size={20} /></span>
              <p className="mt-3 font-extrabold text-navy">{t(`overview.b${n}Title`)}</p>
              <p className="mt-1 text-sm leading-relaxed text-mute">{t(`overview.b${n}Text`, FACT_VARS)}</p>
            </li>
          ))}
        </ul>
      </section>

      {children}

      {/* ---------- Progress band ---------- */}
      <section id="progress" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-16 sm:px-6" aria-labelledby="progress-heading">
        <div className="relative overflow-hidden rounded-3xl bg-navy p-7 text-white shadow-[var(--shadow-lg)] sm:p-10">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand/40 blur-3xl" aria-hidden="true" />
          <div className="relative flex flex-wrap items-end justify-between gap-6">
            <div>
              <h2 id="progress-heading" className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t("overview.progTitle")}</h2>
              <p className="mt-1 text-slate-300">{t("overview.progSub")}</p>
            </div>
            <div className="flex flex-wrap gap-2"><Link href="/learn" className={btn("inverse", "md")}>{t("overview.continue")}</Link><Link href="/progress" className={btn("outlineLight", "md")}>{t("overview.viewProgress")}</Link></div>
          </div>
          <dl className="relative mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              [t("overview.statEn"), practice.english?.bestWpm ?? "—"],
              [t("overview.statKh"), practice.khmer?.bestWpm ?? "—"],
              [t("overview.statPlays"), totalPlays || "—"],
              [t("overview.statTop"), Math.max(0, ...typingGames.map((g) => bestForGame(scores, g.id))) || "—"],
            ].map(([label, value]) => <div key={String(label)} className="rounded-2xl bg-white/[0.07] p-4 ring-1 ring-inset ring-white/10"><dt className="text-xs font-semibold text-slate-300">{label}</dt><dd className="mt-1 text-3xl font-extrabold tabular-nums">{hydrated ? value : <Sk className="inline-block h-8 w-14 bg-white/25" />}</dd></div>)}
          </dl>
        </div>
      </section>
    </main>
  </div>;
}
