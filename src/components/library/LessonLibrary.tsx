"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import SiteHeader from "@/components/shared/SiteHeader";
import ContinueCard from "@/components/learn/ContinueCard";
import { curricula, levelLabels, levelColors } from "@/data/curriculum";
import { useUserProgress } from "@/hooks/use-stored-value";
import type { CurriculumLevel, Language } from "@/types";

type Entry = {
  key: string;
  language: Language;
  lessonId: string;
  title: string;
  titleKm?: string;
  courseTitle: string;
  moduleTitle: string;
  level: CurriculumLevel;
  keyFocus: string[];
  xpReward: number;
  minAccuracy: number;
  order: number;
};

type LangFilter = "all" | Language;
type StatusFilter = "all" | "todo" | "done";
type SortKey = "path" | "title" | "xp" | "level";

const LEVEL_ORDER: CurriculumLevel[] = ["beginner", "basic", "intermediate", "advanced", "expert"];

// Built once at module load: the curriculum is static data.
const ENTRIES: Entry[] = (["english", "khmer"] as const).flatMap((language) => {
  let order = 0;
  return curricula[language].courses.flatMap((course) =>
    course.modules.flatMap((mod) =>
      mod.lessons.map((lesson) => ({
        key: `${language}:${lesson.id}`,
        language,
        lessonId: lesson.id,
        title: lesson.title,
        titleKm: lesson.titleKm,
        courseTitle: course.title,
        moduleTitle: mod.titleKm ?? mod.title,
        level: course.level,
        keyFocus: lesson.keyFocus,
        xpReward: lesson.xpReward,
        minAccuracy: lesson.completionCriteria.minAccuracy,
        order: order++,
      })),
    ),
  );
});

const chip = (active: boolean) =>
  `rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
    active ? "border-brand bg-brand text-white" : "border-slate-200 bg-white text-navy hover:border-brand/50"
  }`;

export default function LessonLibrary() {
  const progress = useUserProgress();
  const [query, setQuery] = useState("");
  const [lang, setLang] = useState<LangFilter>("all");
  const [level, setLevel] = useState<CurriculumLevel | "all">("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("path");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = ENTRIES.filter((e) => {
      if (lang !== "all" && e.language !== lang) return false;
      if (level !== "all" && e.level !== level) return false;
      const done = !!progress.completedLessons[e.key];
      if (status === "done" && !done) return false;
      if (status === "todo" && done) return false;
      if (!q) return true;
      const haystack = [e.title, e.titleKm ?? "", e.courseTitle, e.moduleTitle, ...e.keyFocus].join(" ").toLowerCase();
      return haystack.includes(q);
    });
    const sorted = [...filtered];
    if (sort === "title") sorted.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === "xp") sorted.sort((a, b) => b.xpReward - a.xpReward || a.order - b.order);
    else if (sort === "level")
      sorted.sort((a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level) || a.order - b.order);
    else sorted.sort((a, b) => a.language.localeCompare(b.language) || a.order - b.order);
    return sorted;
  }, [query, lang, level, status, sort, progress.completedLessons]);

  const hasFilters = query !== "" || lang !== "all" || level !== "all" || status !== "all";
  const reset = () => {
    setQuery("");
    setLang("all");
    setLevel("all");
    setStatus("all");
  };

  return (
    <div className="min-h-screen bg-surface text-navy">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-brand">Library</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">All lessons</h1>
          <p className="mt-2 max-w-2xl text-mute">
            Every English and Khmer lesson in one list. Search by title or key, filter by level and status, and jump straight in.
          </p>
        </div>

        <ContinueCard />

        <div className="mb-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap gap-3">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search lessons, courses or keys…"
              aria-label="Search lessons"
              className="min-w-[220px] flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-brand focus:bg-white"
            />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              aria-label="Sort lessons"
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold outline-none focus:border-brand"
            >
              <option value="path">Sort: Learning path</option>
              <option value="level">Sort: Level</option>
              <option value="xp">Sort: Most XP</option>
              <option value="title">Sort: A–Z</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Language">
            {(["all", "english", "khmer"] as const).map((v) => (
              <button key={v} type="button" aria-pressed={lang === v} onClick={() => setLang(v)} className={chip(lang === v)}>
                {v === "all" ? "All languages" : v === "english" ? "English" : "Khmer"}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Level">
            {(["all", ...LEVEL_ORDER] as const).map((v) => (
              <button key={v} type="button" aria-pressed={level === v} onClick={() => setLevel(v)} className={chip(level === v)}>
                {v === "all" ? "All levels" : levelLabels[v]}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Status">
            {(["all", "todo", "done"] as const).map((v) => (
              <button key={v} type="button" aria-pressed={status === v} onClick={() => setStatus(v)} className={chip(status === v)}>
                {v === "all" ? "Any status" : v === "todo" ? "Not completed" : "Completed"}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-3 flex items-center justify-between text-sm text-mute" aria-live="polite">
          <span>
            {results.length} {results.length === 1 ? "lesson" : "lessons"}
            {hasFilters ? ` of ${ENTRIES.length}` : ""}
          </span>
          {hasFilters && (
            <button type="button" onClick={reset} className="font-bold text-brand hover:underline">
              Clear filters
            </button>
          )}
        </div>

        {results.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="font-bold">No lessons match your filters</p>
            <p className="mt-1 text-sm text-mute">Try a different search term or clear the filters.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {results.map((e) => {
              const done = !!progress.completedLessons[e.key];
              return (
                <li key={e.key}>
                  <Link
                    href={`/learn/${e.language}/${e.lessonId}`}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 transition hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-sm"
                  >
                    <span
                      className={`grid h-8 w-8 flex-none place-items-center rounded-full text-sm font-bold ${done ? "bg-brand text-white" : "bg-slate-200 text-slate-500"}`}
                      aria-label={done ? "Completed" : "Not completed"}
                    >
                      {done ? "✓" : "→"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm font-semibold ${e.language === "khmer" ? "font-khmer" : ""}`}>
                        {e.titleKm ?? e.title}
                      </p>
                      <p className="truncate text-[11px] text-mute">
                        {e.courseTitle} · {e.keyFocus.slice(0, 4).join(" · ")}
                        {e.keyFocus.length > 4 ? " …" : ""}
                      </p>
                    </div>
                    <span className="hidden flex-none rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600 sm:inline">
                      {e.language === "english" ? "EN" : "KM"}
                    </span>
                    <span className={`hidden flex-none rounded-full px-2.5 py-0.5 text-[11px] font-bold sm:inline ${levelColors[e.level]}`}>
                      {levelLabels[e.level]}
                    </span>
                    <span className="flex-none text-xs font-bold text-amber-600">+{e.xpReward} XP</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
