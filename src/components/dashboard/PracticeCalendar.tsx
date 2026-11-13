"use client";

import { useLocale } from "@/components/shared/LocaleProvider";
import { longestDayRun } from "@/lib/achievements";
import { dayKey, isQualifyingSession } from "@/lib/progress/progress-analytics";
import type { SessionRecord } from "@/types/progress";

const WEEKS = 12;
const LEVELS = ["bg-slate-100", "bg-blue-200", "bg-blue-400", "bg-brand", "bg-blue-800"];

/**
 * Twelve weeks of practice days, one cell per day (columns are weeks, Monday on top). Only days with a finished
 * session of 10+ correct characters are filled, so the calendar matches what the streak counts.
 */
export default function PracticeCalendar({ sessions, now }: { sessions: SessionRecord[]; now: number }) {
  const { t, locale } = useLocale();
  const byDay = new Map<string, { min: number; n: number }>();
  for (const s of sessions) {
    if (!isQualifyingSession(s)) continue;
    const key = dayKey(Date.parse(s.completedAt));
    const cur = byDay.get(key) ?? { min: 0, n: 0 };
    byDay.set(key, { min: cur.min + s.durationSec / 60, n: cur.n + 1 });
  }
  const today = new Date(now);
  const mondayOffset = (today.getDay() + 6) % 7;
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - mondayOffset - (WEEKS - 1) * 7);
  const fmt = new Intl.DateTimeFormat(locale === "km" ? "km-KH" : "en-US", { month: "short", day: "numeric" });
  const cells = Array.from({ length: WEEKS * 7 }, (_, i) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const key = dayKey(date.getTime());
    const day = byDay.get(key);
    const level = !day ? 0 : day.min < 5 ? 1 : day.min < 15 ? 2 : day.min < 30 ? 3 : 4;
    return { key, future: date.getTime() > now, level, label: day ? t("dash.calCell", { date: fmt.format(date), n: Math.round(day.min), s: day.n }) : t("dash.calEmpty", { date: fmt.format(date) }) };
  });
  const inWindow = cells.filter((c) => c.level > 0).length;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="cal-heading">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="cal-heading" className="font-extrabold text-navy">{t("dash.calTitle")}</h2>
          <p className="text-xs text-mute">{t("dash.calSub")}</p>
        </div>
        <p className="text-xs font-semibold text-mute">{t("dash.calDays", { n: inWindow })} · {t("dash.calBest", { n: longestDayRun(sessions) })}</p>
      </div>
      <div className="mt-4 overflow-x-auto pb-1">
        <div className="grid w-max grid-flow-col grid-rows-7 gap-1" role="img" aria-label={`${t("dash.calTitle")}: ${t("dash.calDays", { n: inWindow })}`}>
          {cells.map((c) => <span key={c.key} title={c.future ? undefined : c.label} className={`h-3.5 w-3.5 rounded-[4px] sm:h-4 sm:w-4 ${c.future ? "bg-transparent" : LEVELS[c.level]}`} />)}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-end gap-1 text-[11px] text-mute" aria-hidden="true">
        {t("dash.calLess")}{LEVELS.map((l) => <span key={l} className={`h-3 w-3 rounded-[3px] ${l}`} />)}{t("dash.calMore")}
      </div>
    </section>
  );
}
