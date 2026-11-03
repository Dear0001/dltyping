"use client";

import Link from "next/link";
import DashboardShell from "@/components/dashboard/DashboardShell";
import TrainingRecommendations from "@/components/dashboard/TrainingRecommendations";
import { useTrainingRecommendations } from "@/hooks/useTrainingRecommendations";
import { MIN_SAMPLES } from "@/lib/progress/keyboard-analytics";
import { THRESHOLDS } from "@/lib/progress/training-recommendations";

export default function TrainingView() {
  const { hydrated, recommendations, readiness } = useTrainingRecommendations();

  return (
    <DashboardShell title="Personalized training" subtitle="Exercises chosen from your own results: weak keys, tricky combinations, misspelled words, speed and consistency.">
      {!hydrated ? (
        <div className="space-y-3" aria-busy="true">{[0, 1].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white" />)}</div>
      ) : recommendations.length > 0 ? (
        <>
          <TrainingRecommendations items={recommendations} />
          <p className="mt-4 text-xs text-mute">Recommendations update after every session. Keys need {MIN_SAMPLES}+ keystrokes and speed advice needs {THRESHOLDS.minSessions}+ sessions before they appear.</p>
        </>
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
          <p className="text-5xl" aria-hidden="true">{readiness.enough ? "🌟" : "🧭"}</p>
          <h2 className="mt-4 text-2xl font-extrabold text-navy">{readiness.enough ? "No weak spots found" : "Not enough data to personalise yet"}</h2>
          <p className="mx-auto mt-2 max-w-xl text-mute">
            {readiness.enough
              ? "Your keys, combinations and recent sessions are all in good shape. Keep practicing and new suggestions will appear if anything slips."
              : `We only recommend exercises backed by real results. You have ${readiness.sessions} saved session${readiness.sessions === 1 ? "" : "s"} and ${readiness.keystrokes} keystrokes. Complete at least ${THRESHOLDS.minSessions} sessions to unlock suggestions.`}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/learn/english" className="rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white shadow-sm hover:brightness-110">Practice English</Link>
            <Link href="/learn/khmer" className="rounded-xl bg-navy px-5 py-3 text-sm font-bold text-white shadow-sm hover:brightness-110">Practice Khmer</Link>
            <Link href="/games" className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-navy hover:border-brand hover:text-brand">Play a game</Link>
          </div>
        </section>
      )}
    </DashboardShell>
  );
}
