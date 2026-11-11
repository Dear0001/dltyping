"use client";

import { useState } from "react";
import { ACTIVITY_META, formatDuration, isGame } from "@/lib/progress/progress-analytics";
import { useLocale } from "@/components/shared/LocaleProvider";
import { useProgressText } from "@/hooks/useProgressText";
import type { SessionRecord } from "@/types/progress";

type Filter = "all" | "english" | "khmer" | "lessons" | "games";
const FILTERS: [Filter, string][] = [["all", "act.all"], ["english", "category.english"], ["khmer", "category.khmer"], ["lessons", "act.lessons"], ["games", "act.games"]];

const matches = (s: SessionRecord, f: Filter) =>
  f === "all" || f === s.language || (f === "games" && isGame(s.activity)) || (f === "lessons" && !isGame(s.activity));

function formatWhen(iso: string, t: (key: string, vars?: Record<string, string | number>) => string) {
  const d = new Date(iso);
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const today = new Date();
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return t("act.today", { time });
  if (d.toDateString() === yesterday.toDateString()) return t("act.yesterday", { time });
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: d.getFullYear() === today.getFullYear() ? undefined : "numeric" })}, ${time}`;
}

/** Newest-first list of finished sessions. `sessions` must already be sorted. */
export default function ActivityHistory({ sessions, pageSize = 8 }: { sessions: SessionRecord[]; pageSize?: number }) {
  const { t } = useLocale();
  const pt = useProgressText();
  const [filter, setFilter] = useState<Filter>("all");
  const [shown, setShown] = useState(pageSize);
  const rows = sessions.filter((s) => matches(s, filter));

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-labelledby="recent-activity">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 id="recent-activity" className="text-base font-extrabold text-navy">{t("act.title")}</h3>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label={t("act.filterLabel")}>
          {FILTERS.map(([id, label]) => (
            <button
              key={id} type="button" aria-pressed={filter === id} onClick={() => { setFilter(id); setShown(pageSize); }}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${filter === id ? "border-brand bg-brand text-white" : "border-slate-200 bg-white text-mute hover:border-brand hover:text-brand"}`}
            >{t(label)}</button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-mute">{t("act.empty")}</p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-100">
          {rows.slice(0, shown).map((s) => {
            const meta = ACTIVITY_META[s.activity];
            return (
              <li key={s.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-blue-50 text-lg" aria-hidden="true">{meta.icon}</span>
                <div className="min-w-0 flex-1 basis-48">
                  <p className="truncate text-sm font-bold text-navy">{pt.describeSession(s)}</p>
                  <p className="truncate text-xs text-mute">
                    {s.detail ? <>{s.detail} · </> : null}{formatWhen(s.completedAt, t)} · {formatDuration(s.durationSec)}
                  </p>
                </div>
                <div className="flex flex-none flex-wrap items-center gap-2 text-xs">
                  <span className={`rounded-full px-2 py-0.5 font-bold ${s.language === "khmer" ? "bg-sky-100 text-sky-800" : "bg-blue-100 text-blue-800"}`}>{t(`category.${s.language}`)}</span>
                  {s.score !== null && <Metric label={t("act.score")} value={s.score.toLocaleString("en-US")} />}
                  <Metric label={t("act.accuracy")} value={`${s.accuracy}%`} />
                  <Metric label={t("act.speed")} value={`${s.wpm} WPM`} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {rows.length > shown && (
        <button type="button" onClick={() => setShown((n) => n + pageSize)} className="mt-3 w-full rounded-xl border border-slate-200 py-2 text-sm font-semibold text-brand hover:bg-blue-50">
          {t("act.more", { n: rows.length - shown })}
        </button>
      )}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-lg bg-slate-50 px-2 py-1 text-navy">
      <span className="text-mute">{label} </span><strong className="tabular-nums">{value}</strong>
    </span>
  );
}
