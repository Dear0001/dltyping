"use client";

import { useLocale } from "@/components/shared/LocaleProvider";
import { useProgressText } from "@/hooks/useProgressText";
import { levelStatuses, STREAK_LEVEL_COUNT } from "@/lib/progress/streak-levels";
import type { SessionRecord } from "@/types/progress";

export default function StreakLevels({ sessions }: { sessions: SessionRecord[] }) {
  const { t } = useLocale();
  const pt = useProgressText();
  const levels = levelStatuses(sessions);
  const unlocked = levels.filter((l) => l.unlocked).length;
  const next = levels.find((l) => !l.unlocked);
  return (
    <section aria-label={t("sl.title")} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-extrabold text-navy">{t("sl.title")}</h2>
        <p className="text-sm font-semibold text-brand">{t("sl.unlocked", { a: unlocked, b: STREAK_LEVEL_COUNT })}</p>
      </div>
      <p className="mt-1 text-xs text-mute">
        {t("sl.help")}
        {next ? t("sl.next", { level: next.level, wpm: next.minWpm, acc: next.minAccuracy, err: next.maxErrors }) : t("sl.all")}
      </p>
      <ol className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {levels.map((l) => (
          <li key={l.level} className={`rounded-xl border px-3 py-2 text-xs ${l.unlocked ? "border-blue-200 bg-blue-50 text-navy" : "border-slate-200 bg-slate-50 text-mute"}`}>
            <p className="flex items-center justify-between font-bold">
              <span>{l.unlocked ? "🔥" : "🔒"} {t("sl.level", { n: l.level })}</span>
              {l.unlocked && <span className="text-brand">{t("sl.unlockedTag")}</span>}
            </p>
            <p className="mt-1">{t("sl.req", { wpm: l.minWpm, acc: l.minAccuracy, err: l.maxErrors })}</p>
            {l.by && <p className="mt-0.5 truncate text-[11px]">{t("sl.via", { by: l.activity ? pt.activityLabel(l.activity) : l.by })}</p>}
          </li>
        ))}
      </ol>
    </section>
  );
}
