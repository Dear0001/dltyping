"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import CategorySelector from "@/components/setup/CategorySelector";
import Timer from "@/components/typing/Timer";
import { lessonCategories } from "@/data/categories";
import type { LessonCategory, LessonConfig } from "@/types";
import { useLocale } from "@/components/shared/LocaleProvider";
import { useCurriculumText } from "@/hooks/useCurriculumText";
import { RANDOM_LESSON, articleHref, pickArticle, suggestedTime } from "@/lib/lesson-picker";
import { DURATIONS, MAX_DURATION, minutesToDuration } from "@/lib/article-length";

const timeLimits = DURATIONS;

export default function SetupForm() {
  const { setLocale, t } = useLocale();
  const ct = useCurriculumText();
  const router = useRouter();
  const [timeTouched, setTimeTouched] = useState(false);
  const [customMinutes, setCustomMinutes] = useState("");
  const [config, setConfig] = useState<LessonConfig>({
    language: "english",
    categoryId: "english",
    timeLimit: 60,
    activeSectionId: RANDOM_LESSON,
  });
  const category = useMemo(() => lessonCategories.find((item) => item.id === config.categoryId) ?? lessonCategories[0], [config.categoryId]);
  const isRandom = config.activeSectionId === RANDOM_LESSON;
  const chosenSection = category.sections.find((item) => item.id === config.activeSectionId);
  const selectedSection = chosenSection ?? category.sections[0];

  function selectCategory(nextCategory: LessonCategory) {
    setLocale(nextCategory.language === "khmer" ? "km" : "en");
    setConfig((current) => ({
      ...current,
      language: nextCategory.language,
      categoryId: nextCategory.id,
      activeSectionId: RANDOM_LESSON,
    }));
  }

  const startHref = `/learn/${config.language}?lesson=${isRandom ? RANDOM_LESSON : encodeURIComponent(selectedSection.id)}&time=${config.timeLimit}`;

  // Random mode: when Start is pressed, an article is drawn whose length fits the chosen duration at the user's own average speed.
  function start(event: React.MouseEvent) {
    if (!isRandom) return;
    event.preventDefault();
    const { article, goal } = pickArticle(config.language, config.timeLimit);
    router.push(articleHref(config.language, article, goal, config.timeLimit));
  }
  const sectionLevel = selectedSection.level === "Beginner" ? t("setup.beginner") : t("setup.intermediate");
  const sectionMinutes = Number.parseInt(selectedSection.duration, 10) || 1;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="rounded-2xl border border-[color:var(--line)] bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-7">
          <span className="text-[10px] font-bold tracking-[0.16em] text-[color:var(--muted)]">{t("setup.stepLanguage")}</span>
          <div className="mt-3"><CategorySelector categories={lessonCategories} selectedId={config.categoryId} onSelect={selectCategory} /></div>
        </div>
        <div className="mb-7">
          <label htmlFor="lesson" className="text-[10px] font-bold tracking-[0.16em] text-[color:var(--muted)]">{t("setup.stepLesson")}</label>
          <select id="lesson" value={config.activeSectionId} onChange={(event) => { const picked = category.sections.find((item) => item.id === event.target.value); setConfig((current) => ({ ...current, activeSectionId: event.target.value, timeLimit: picked && !timeTouched ? suggestedTime(picked) : current.timeLimit })); }} className="mt-3 block w-full rounded-lg border border-[#dee2e8] bg-white px-3 py-3 text-sm text-[#33373d] outline-none focus:border-[#717e94] focus:ring-2 focus:ring-[#717e94]/15">
            <option value={RANDOM_LESSON}>{t("setup.randomArticleRecommended")}</option>
            {category.sections.map((section) => <option key={section.id} value={section.id}>{ct.passageTitle(section)} · {section.level === "Beginner" ? t("setup.beginner") : t("setup.intermediate")}</option>)}
          </select>
        </div>
        <fieldset>
          <legend className="text-[10px] font-bold tracking-[0.16em] text-[color:var(--muted)]">{t("setup.stepTime")}</legend>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {timeLimits.map((seconds) => <button key={seconds} type="button" aria-pressed={config.timeLimit === seconds} onClick={() => { setTimeTouched(true); setCustomMinutes(""); setConfig((current) => ({ ...current, timeLimit: seconds })); }} className={`rounded-lg border px-3 py-3 text-sm transition ${config.timeLimit === seconds ? "border-[color:var(--green)] bg-[color:var(--pale)] font-semibold text-[#3a4b67]" : "border-[color:var(--line)] bg-white text-[#6f747b] hover:border-[color:var(--line)]"}`}>{seconds / 60} {t("setup.min")}<span className="mt-1 block text-[10px] font-normal opacity-75">{seconds} {t("setup.seconds")}</span></button>)}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <label htmlFor="custom-minutes" className="text-xs text-[color:var(--muted)]">{t("setup.orEnterYourOwn")}</label>
            <input id="custom-minutes" type="number" inputMode="numeric" min={1} max={MAX_DURATION / 60} step={1} value={customMinutes} placeholder="e.g. 7"
              onChange={(event) => {
                const value = event.target.value;
                setCustomMinutes(value);
                const seconds = minutesToDuration(Number(value));
                if (value !== "" && seconds) { setTimeTouched(true); setConfig((current) => ({ ...current, timeLimit: seconds })); }
              }}
              onBlur={() => { const seconds = minutesToDuration(Number(customMinutes)); if (seconds) setCustomMinutes(String(seconds / 60)); else setCustomMinutes(""); }}
              className="w-24 rounded-lg border border-[#dee2e8] bg-white px-3 py-2 text-sm text-[#33373d] outline-none focus:border-[#717e94] focus:ring-2 focus:ring-[#717e94]/15" />
            <span className="text-xs text-[color:var(--muted)]">{t("setup.min")} (1–{MAX_DURATION / 60})</span>
          </div>
        </fieldset>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[#ebedf0] pt-5">
          <span className="text-xs text-[color:var(--muted)]">{t("setup.free")}</span>
          <Link href={startHref} onClick={start} className="inline-flex items-center gap-4 rounded-lg bg-[color:var(--green)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2a3c59]">{t("setup.start")} <span aria-hidden="true">→</span></Link>
        </div>
      </section>
      <aside className="space-y-4">
          <Timer seconds={config.timeLimit} label={t("timer.label")} />
        <div className="rounded-xl border border-[color:var(--pale)] bg-[#eff1f5] p-4">
          <span className="text-[9px] font-bold tracking-[0.14em] text-[color:var(--muted)]">{t("setup.upNext")}</span>
          <h2 className="mt-2 font-serif text-xl text-[#2e3238]">{isRandom ? (t("setup.randomArticle")) : ct.passageTitle(selectedSection)}</h2>
          <p className="mt-2 text-xs leading-5 text-[color:var(--muted)]">{isRandom ? t("setup.randomDesc") : <>{selectedSection.text.slice(0, 116)}{selectedSection.text.length > 116 ? "…" : ""}</>}</p>
          {!isRandom && <div className="mt-3 flex gap-2 text-[10px] text-[#7f848b]"><span>{sectionLevel}</span><span>·</span><span>{sectionMinutes} {t("setup.min")}</span></div>}
        </div>
      </aside>
    </div>
  );
}
