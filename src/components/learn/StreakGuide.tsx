import { QUALIFYING_MIN_CORRECT } from "@/lib/progress/progress-analytics";

type Criteria = { minAccuracy: number; minWpm?: number };

/** Streak guide for one lesson: what to do, and what it earns. */
export function LessonStreakGuide({ criteria, xp }: { criteria: Criteria; xp: number }) {
  const need = `${criteria.minAccuracy}%+ accuracy${criteria.minWpm ? ` and ${criteria.minWpm}+ WPM` : ""}`;
  return (
    <section className="rounded-2xl border border-orange-200 bg-orange-50 p-5 shadow-sm" aria-label="How this lesson earns a streak">
      <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wider text-orange-700">🔥 Streak guide</h2>
      <ol className="space-y-2 text-sm text-slate-700">
        <li><b>Every day: +1 streak, automatically.</b> Just open the site each day. Missing a whole day resets it.</li>
        <li><b>Task: complete this lesson = +1 more.</b> Type the whole text with {need} (and at least {QUALIFYING_MIN_CORRECT} correct characters). It completes automatically (+{xp} XP).</li>
        <li><b>Task: clear a game level = + its stars.</b> 1 star = +1, 2 stars = +2, 3 stars = +3.</li>
      </ol>
      <p className="mt-3 text-xs text-slate-600">Extra points are counted once per task type each day (the best star count wins).</p>
    </section>
  );
}

/** General guide shown on the Learn page. */
export function StreakGuide() {
  return (
    <details className="group mb-8 rounded-2xl border border-orange-200 bg-orange-50 shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-extrabold text-orange-800">
        <span>🔥 How do I earn a streak?</span>
        <span className="text-xl transition-transform group-open:rotate-180" aria-hidden="true">⌄</span>
      </summary>
      <div className="space-y-3 border-t border-orange-200 px-5 pb-5 pt-4 text-sm text-slate-700">
        <p><b>Every day: +1 streak, automatically</b> when you open the site. Missing a whole day starts you over.</p>
        <p><b>Extra tasks add more:</b></p>
        <ul className="list-disc space-y-1 pl-5">
          <li><b>Complete a lesson: +1.</b> Type the whole text and reach its accuracy (and WPM). The 🔥 on each lesson below shows what it needs.</li>
          <li><b>Clear a game level (Mario Khmer Quest or English Quest): + stars.</b> 1 star = +1, 2 = +2, 3 = +3 (3 stars: 95%+ accuracy and no lives lost; 2 stars: 85%+).</li>
        </ul>
        <p>Streaks unlock pets.</p>
      </div>
    </details>
  );
}
