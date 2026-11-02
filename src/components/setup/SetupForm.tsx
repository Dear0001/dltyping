"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import CategorySelector from "@/components/setup/CategorySelector";
import Timer from "@/components/typing/Timer";
import { lessonCategories } from "@/data/categories";
import type { LessonCategory, LessonConfig } from "@/types";

const timeLimits = [60, 120, 300];

export default function SetupForm() {
  const [config, setConfig] = useState<LessonConfig>({
    language: "english",
    categoryId: "english",
    timeLimit: 60,
    activeSectionId: lessonCategories[0].sections[0].id,
  });
  const category = useMemo(() => lessonCategories.find((item) => item.id === config.categoryId) ?? lessonCategories[0], [config.categoryId]);
  const selectedSection = category.sections.find((item) => item.id === config.activeSectionId) ?? category.sections[0];

  function selectCategory(nextCategory: LessonCategory) {
    setConfig((current) => ({
      ...current,
      language: nextCategory.language,
      categoryId: nextCategory.id,
      activeSectionId: nextCategory.sections[0].id,
    }));
  }

  const startHref = `/learn/${config.language}?lesson=${encodeURIComponent(selectedSection.id)}&time=${config.timeLimit}`;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="rounded-2xl border border-[#e8e9e2] bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-7">
          <span className="text-[10px] font-bold tracking-[0.16em] text-[#899084]">01 · CHOOSE A LANGUAGE</span>
          <div className="mt-3"><CategorySelector categories={lessonCategories} selectedId={config.categoryId} onSelect={selectCategory} /></div>
        </div>
        <div className="mb-7">
          <label htmlFor="lesson" className="text-[10px] font-bold tracking-[0.16em] text-[#899084]">02 · PICK A LESSON</label>
          <select id="lesson" value={config.activeSectionId} onChange={(event) => setConfig((current) => ({ ...current, activeSectionId: event.target.value }))} className="mt-3 block w-full rounded-lg border border-[#e5e7df] bg-white px-3 py-3 text-sm text-[#353c34] outline-none focus:border-[#739273] focus:ring-2 focus:ring-[#739273]/15">
            {category.sections.map((section) => <option key={section.id} value={section.id}>{section.title} · {section.level}</option>)}
          </select>
        </div>
        <fieldset>
          <legend className="text-[10px] font-bold tracking-[0.16em] text-[#899084]">03 · SET YOUR SESSION LENGTH</legend>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {timeLimits.map((seconds) => <button key={seconds} type="button" aria-pressed={config.timeLimit === seconds} onClick={() => setConfig((current) => ({ ...current, timeLimit: seconds }))} className={`rounded-lg border px-3 py-3 text-sm transition ${config.timeLimit === seconds ? "border-[#789778] bg-[#f1f5ee] font-semibold text-[#3d6445]" : "border-[#e8e9e2] bg-white text-[#737a70] hover:border-[#cbd5c7]"}`}>{seconds / 60} min<span className="mt-1 block text-[10px] font-normal opacity-75">{seconds} seconds</span></button>)}
          </div>
        </fieldset>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[#eff0eb] pt-5">
          <span className="text-xs text-[#858b80]">Free practice · no account required</span>
          <Link href={startHref} className="inline-flex items-center gap-4 rounded-lg bg-[#376449] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2d563d]">Start typing <span aria-hidden="true">→</span></Link>
        </div>
      </section>
      <aside className="space-y-4">
        <Timer seconds={config.timeLimit} />
        <div className="rounded-xl border border-[#e9ebe4] bg-[#f3f5ef] p-4">
          <span className="text-[9px] font-bold tracking-[0.14em] text-[#858b80]">UP NEXT</span>
          <h2 className="mt-2 font-serif text-xl text-[#30372f]">{selectedSection.title}</h2>
          <p className="mt-2 text-xs leading-5 text-[#7f867c]">{selectedSection.text.slice(0, 116)}{selectedSection.text.length > 116 ? "…" : ""}</p>
          <div className="mt-3 flex gap-2 text-[10px] text-[#848a80]"><span>{selectedSection.level}</span><span>·</span><span>{selectedSection.duration}</span></div>
        </div>
      </aside>
    </div>
  );
}
