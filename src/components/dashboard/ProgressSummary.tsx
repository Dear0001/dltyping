"use client";

import Link from "next/link";
import { useLocale } from "@/components/shared/LocaleProvider";
import { typingGames } from "@/data/games";
import { useAchievements } from "@/hooks/useAchievements";
import { useGameText } from "@/hooks/useGameText";
import { useScores, useUserProgress } from "@/hooks/use-stored-value";
import { useTrainingRecommendations } from "@/hooks/useTrainingRecommendations";
import { useTypingProgress } from "@/hooks/useTypingProgress";
import { recommendGames } from "@/lib/game-recommendations";
import { bestForGame, levelFromXp, xpForLevel } from "@/lib/local-progress";
import { THRESHOLDS } from "@/lib/progress/training-recommendations";
import { ProgressBar } from "@/components/ui/ui";

const panel = "flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
const kicker = "text-xs font-semibold uppercase tracking-wide text-mute";
const more = "mt-auto pt-3 text-sm font-bold text-brand hover:underline";

/**
 * Overview row that ties the dashboard to the rest of the learner's progress: XP and level,
 * achievements and game records, and the single most useful next step. All from saved data.
 */
export default function ProgressSummary() {
  const { t } = useLocale();
  const gt = useGameText();
  const progress = useUserProgress();
  const achievements = useAchievements();
  const scores = useScores();
  const { store } = useTypingProgress();
  const { recommendations, readiness } = useTrainingRecommendations();

  const level = levelFromXp(progress.xp);
  const floor = xpForLevel(level), ceil = xpForLevel(level + 1);
  const pct = ceil > floor ? Math.min(100, Math.round(((progress.xp - floor) / (ceil - floor)) * 100)) : 100;
  const typist = t(`typist.${level}`) === `typist.${level}` ? t("typist.default") : t(`typist.${level}`);
  const unlocked = achievements.filter((a) => a.unlocked).length;
  const records = typingGames.map((game) => ({ game, best: bestForGame(scores, game.id) })).filter((r) => r.best > 0).sort((a, b) => b.best - a.best).slice(0, 3);
  const top = recommendations[0];
  const games = top ? null : recommendGames(store.sessions, typingGames, 2);

  return (
    <section aria-labelledby="summary-heading">
      <h2 id="summary-heading" className="sr-only">{t("dsum.title")}</h2>
      <div className="grid gap-3 md:grid-cols-3">
        <div className={panel}>
          <p className={kicker}>{t("dsum.level")}</p>
          <p className="mt-2 text-2xl font-extrabold leading-tight text-navy">{t("prog.level", { n: level })}</p>
          <p className="text-sm font-semibold text-mute">{typist}</p>
          <ProgressBar value={pct} className="mt-3" label={t("prog.level", { n: level })} />
          <p className="mt-1.5 text-xs tabular-nums text-mute">{progress.xp.toLocaleString("en-US")} XP{ceil > progress.xp && <> · {t("dsum.xpToNext", { xp: (ceil - progress.xp).toLocaleString("en-US"), n: level + 1 })}</>}</p>
          <Link href="/progress#xp-heading" className={more}>{t("dsum.howXp")}</Link>
        </div>

        <div className={panel}>
          <p className={kicker}>{t("dsum.records")}</p>
          <p className="mt-2 text-2xl font-extrabold leading-tight text-navy">{t("achv.summary", { n: unlocked, total: achievements.length })}</p>
          {records.length > 0
            ? <ul className="mt-2 space-y-1 text-sm">
                {records.map(({ game, best }) => <li key={game.id} className="flex justify-between gap-2"><Link href={game.href} className="truncate text-navy hover:text-brand">{gt.title(game)}</Link><strong className="tabular-nums text-brand">{best.toLocaleString("en-US")}</strong></li>)}
              </ul>
            : <p className="mt-2 text-sm text-mute">{t("dsum.noRecords")}</p>}
          <Link href="/progress#ach-heading" className={more}>{t("dsum.allRecords")}</Link>
        </div>

        <div className={panel}>
          <p className={kicker}>{t("dsum.next")}</p>
          {top
            ? <>
                <p className="mt-2 text-base font-extrabold leading-snug text-navy">{top.title}</p>
                <p className="mt-1 line-clamp-3 text-sm text-mute">{top.reason}</p>
                {top.actions[0] && <Link href={top.actions[0].href} className="mt-3 inline-flex w-fit rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white shadow-sm hover:brightness-110">{top.actions[0].label}</Link>}
                <Link href="/dashboard/training" className={more}>{t("dsum.allTraining", { n: recommendations.length })}</Link>
              </>
            : <>
                <p className="mt-2 text-sm text-mute">{readiness.enough ? t("dsum.noWeak") : t("dsum.needMore", { n: Math.max(1, THRESHOLDS.minSessions - readiness.sessions) })}</p>
                {games && games.games.length > 0 && <ul className="mt-2 space-y-1 text-sm">
                  {games.games.map((g) => <li key={g.id}>🎮 <Link href={g.href} className="font-semibold text-navy hover:text-brand">{gt.title(g)}</Link></li>)}
                </ul>}
                <Link href="/dashboard/training" className={more}>{t("dsum.openTraining")}</Link>
              </>}
        </div>
      </div>
    </section>
  );
}
