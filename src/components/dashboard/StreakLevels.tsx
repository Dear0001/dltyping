"use client";

import { levelStatuses, STREAK_LEVEL_COUNT } from "@/lib/progress/streak-levels";
import type { SessionRecord } from "@/types/progress";

export default function StreakLevels({ sessions }: { sessions: SessionRecord[] }) {
  const levels = levelStatuses(sessions);
  const unlocked = levels.filter((l) => l.unlocked).length;
  const next = levels.find((l) => !l.unlocked);
  return (
    <section aria-label="Streak levels" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-extrabold text-navy">Streak levels</h2>
        <p className="text-sm font-semibold text-brand">{unlocked} / {STREAK_LEVEL_COUNT} unlocked</p>
      </div>
      <p className="mt-1 text-xs text-mute">
        Finish any lesson, test or game that reaches a level&apos;s speed and accuracy with few enough errors to unlock it.
        {next ? ` Next: level ${next.level} needs ${next.minWpm}+ WPM, ${next.minAccuracy}%+ accuracy and at most ${next.maxErrors} error${next.maxErrors === 1 ? "" : "s"}.` : " All levels unlocked!"}
      </p>
      <ol className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {levels.map((l) => (
          <li key={l.level} className={`rounded-xl border px-3 py-2 text-xs ${l.unlocked ? "border-blue-200 bg-blue-50 text-navy" : "border-slate-200 bg-slate-50 text-mute"}`}>
            <p className="flex items-center justify-between font-bold">
              <span>{l.unlocked ? "🔥" : "🔒"} Level {l.level}</span>
              {l.unlocked && <span className="text-brand">Unlocked</span>}
            </p>
            <p className="mt-1">{l.minWpm}+ WPM · {l.minAccuracy}%+ · ≤ {l.maxErrors} error{l.maxErrors === 1 ? "" : "s"}</p>
            {l.by && <p className="mt-0.5 truncate text-[11px]">via {l.by}</p>}
          </li>
        ))}
      </ol>
    </section>
  );
}
