import { LESSON_POINTS, MAX_DAY_POINTS, QUALIFYING_MIN_CORRECT, STAR_POINTS } from "@/lib/progress/progress-analytics";

type Criteria = { minAccuracy: number; minWpm?: number };

/** Streak guide for one lesson: what to do, and what it earns. */
export function LessonStreakGuide({ criteria, xp }: { criteria: Criteria; xp: number }) {
  const need = `${criteria.minAccuracy}%+ accuracy${criteria.minWpm ? ` and ${criteria.minWpm}+ WPM` : ""}`;
  return (
    <section className="rounded-2xl border border-orange-200 bg-orange-50 p-5 shadow-sm" aria-label="How this lesson earns a streak">
      <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wider text-orange-700">🔥 Streak guide</h2>
      <ol className="space-y-2 text-sm text-slate-700">
        <li><b>Every day: +1 streak, automatically.</b> Just open the site. One missed day is forgiven; two in a row reset it.</li>
        <li><b>Each practice session: +1.</b> Finish any session with at least {QUALIFYING_MIN_CORRECT} correct characters.</li>
        <li><b>Complete this lesson: +{LESSON_POINTS} more.</b> Type the whole text with {need}. It completes automatically (+{xp} XP).</li>
        <li><b>Clear a game level: +{STAR_POINTS} per star</b> (up to +{STAR_POINTS * 3}).</li>
        <li><b>Streak level bonus:</b> your best streak level of the day (1-20) is added too.</li>
      </ol>
      <p className="mt-3 text-xs text-slate-600">A day can be worth up to {MAX_DAY_POINTS} streak points.</p>
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
        <p><b>Every day: +1 streak, automatically</b> when you open the site. One missed day is forgiven; two in a row start you over.</p>
        <p><b>Tasks add more, up to {MAX_DAY_POINTS} points a day:</b></p>
        <ul className="list-disc space-y-1 pl-5">
          <li><b>Finish a practice session: +1</b> (10+ correct characters).</li>
          <li><b>Complete a lesson: +{LESSON_POINTS}.</b> Type the whole text and reach its accuracy (and WPM).</li>
          <li><b>Clear a game level: +{STAR_POINTS} per star.</b> 3 stars: 90%+ accuracy and at most one life lost; 2 stars: 75%+.</li>
          <li><b>Streak level bonus:</b> + the highest of the 20 streak levels you reach that day.</li>
        </ul>
        <p>Streaks unlock pets.</p>
      </div>
    </details>
  );
}
