"use client";

import Link from "next/link";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { SkCard } from "@/components/skeleton/Skeleton";
import TrainingRecommendations from "@/components/dashboard/TrainingRecommendations";
import { useTrainingRecommendations } from "@/hooks/useTrainingRecommendations";
import { MIN_SAMPLES } from "@/lib/progress/keyboard-analytics";
import { THRESHOLDS } from "@/lib/progress/training-recommendations";
import { useLocale } from "@/components/shared/LocaleProvider";

export default function TrainingView() {
  const { hydrated, recommendations, readiness } = useTrainingRecommendations();
  const { t } = useLocale();

  return (
    <DashboardShell title={t("train.title")} subtitle={t("train.subtitle")}>
      {!hydrated ? (
        <div className="space-y-3" aria-busy="true" aria-label={t("train.loading")}>{[0, 1, 2].map((i) => <SkCard key={i} lines={2} media={null} />)}</div>
      ) : recommendations.length > 0 ? (
        <>
          <TrainingRecommendations items={recommendations} />
          <p className="mt-4 text-xs text-mute">{t("train.update", { keys: MIN_SAMPLES, sessions: THRESHOLDS.minSessions })}</p>
        </>
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
          <p className="text-5xl" aria-hidden="true">{readiness.enough ? "🌟" : "🧭"}</p>
          <h2 className="mt-4 text-2xl font-extrabold text-navy">{t(readiness.enough ? "train.noWeak" : "train.notEnough")}</h2>
          <p className="mx-auto mt-2 max-w-xl text-mute">
            {readiness.enough
              ? t("train.goodShape")
              : t("train.needMore", { sessions: readiness.sessions, keys: readiness.keystrokes, min: THRESHOLDS.minSessions })}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/learn/english" className="rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white shadow-sm hover:brightness-110">{t("dash.practiceEn")}</Link>
            <Link href="/learn/khmer" className="rounded-xl bg-navy px-5 py-3 text-sm font-bold text-white shadow-sm hover:brightness-110">{t("dash.practiceKh")}</Link>
            <Link href="/games" className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-navy hover:border-brand hover:text-brand">{t("dash.playGame")}</Link>
          </div>
        </section>
      )}
    </DashboardShell>
  );
}
