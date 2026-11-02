"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import CategorySelector from "@/components/setup/CategorySelector";
import Timer from "@/components/typing/Timer";
import { lessonCategories } from "@/data/categories";
import type { LessonCategory, LessonConfig } from "@/types";
import { useLocale } from "@/components/shared/LocaleProvider";

const timeLimits = [60, 120, 300];

export default function SetupForm() {
  const { setLocale, t } = useLocale();
  const [config, setConfig] = useState<LessonConfig>({
    language: "english",
    categoryId: "english",
    timeLimit: 60,
    activeSectionId: lessonCategories[0].sections[0].id,
  });
  const category = useMemo(() => lessonCategories.find((item) => item.id === config.categoryId) ?? lessonCategories[0], [config.categoryId]);
  const selectedSection = category.sections.find((item) => item.id === config.activeSectionId) ?? category.sections[0];

  function selectCategory(nextCategory: LessonCategory) {
    setLocale(nextCategory.language === "khmer" ? "km" : "en");
    setConfig((current) => ({
      ...current,
      language: nextCategory.language,
      categoryId: nextCategory.id,
      activeSectionId: nextCategory.sections[0].id,
    }));
  }

  const startHref = `/learn/${config.language}?lesson=${encodeURIComponent(selectedSection.id)}&time=${config.timeLimit}`;
  const sectionLevel = selectedSection.level === "Beginner" ? t("setup.beginner") : t("setup.intermediate");
  const sectionMinutes = Number.parseInt(selectedSection.duration, 10) || 1;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-7">
          <span className="text-[10px] font-bold tracking-[0.16em] text-[#64748b]">{t("setup.stepLanguage")}</span>
          <div className="mt-3"><CategorySelector categories={lessonCategories} selectedId={config.categoryId} onSelect={selectCategory} /></div>
        </div>
        <div className="mb-7">
          <label htmlFor="lesson" className="text-[10px] font-bold tracking-[0.16em] text-[#64748b]">{t("setup.stepLesson")}</label>
          <select id="lesson" value={config.activeSectionId} onChange={(event) => { const picked = category.sections.find((item) => item.id === event.target.value); const minutes = Number.parseInt(picked?.duration ?? "1", 10) || 1; setConfig((current) => ({ ...current, activeSectionId: event.target.value, timeLimit: minutes <= 1 ? 60 : minutes <= 2 ? 120 : 300 })); }} className="mt-3 block w-full rounded-lg border border-[#dee2e8] bg-white px-3 py-3 text-sm text-[#33373d] outline-none focus:border-[#717e94] focus:ring-2 focus:ring-[#717e94]/15">
            {category.sections.map((section) => <option key={section.id} value={section.id}>{section.title} · {section.level === "Beginner" ? t("setup.beginner") : t("setup.intermediate")}</option>)}
          </select>
        </div>
        <fieldset>
          <legend className="text-[10px] font-bold tracking-[0.16em] text-[#64748b]">{t("setup.stepTime")}</legend>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {timeLimits.map((seconds) => <button key={seconds} type="button" aria-pressed={config.timeLimit === seconds} onClick={() => setConfig((current) => ({ ...current, timeLimit: seconds }))} className={`rounded-lg border px-3 py-3 text-sm transition ${config.timeLimit === seconds ? "border-[#2563eb] bg-[#eff6ff] font-semibold text-[#3a4b67]" : "border-[#e2e8f0] bg-white text-[#6f747b] hover:border-[#e2e8f0]"}`}>{seconds / 60} {t("setup.min")}<span className="mt-1 block text-[10px] font-normal opacity-75">{seconds} {t("setup.seconds")}</span></button>)}
          </div>
        </fieldset>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[#ebedf0] pt-5">
          <span className="text-xs text-[#64748b]">{t("setup.free")}</span>
          <Link href={startHref} className="inline-flex items-center gap-4 rounded-lg bg-[#2563eb] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2a3c59]">{t("setup.start")} <span aria-hidden="true">→</span></Link>
        </div>
      </section>
      <aside className="space-y-4">
          <Timer seconds={config.timeLimit} label={t("timer.label")} />
        <div className="rounded-xl border border-[#eff6ff] bg-[#eff1f5] p-4">
          <span className="text-[9px] font-bold tracking-[0.14em] text-[#64748b]">{t("setup.upNext")}</span>
          <h2 className="mt-2 font-serif text-xl text-[#2e3238]">{selectedSection.title}</h2>
          <p className="mt-2 text-xs leading-5 text-[#64748b]">{selectedSection.text.slice(0, 116)}{selectedSection.text.length > 116 ? "…" : ""}</p>
          <div className="mt-3 flex gap-2 text-[10px] text-[#7f848b]"><span>{sectionLevel}</span><span>·</span><span>{sectionMinutes} {t("setup.min")}</span></div>
        </div>
      </aside>
    </div>
  );
}
