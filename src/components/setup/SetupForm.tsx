"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { lessonCategories } from "@/data/categories";
import type { LessonCategory, LessonConfig } from "@/types";
import { useLocale } from "@/components/shared/LocaleProvider";
import { useCurriculumText } from "@/hooks/useCurriculumText";
import { useKeyboardSettings, type OSChoice } from "@/hooks/useKeyboardSettings";
import { useStoredValue } from "@/hooks/use-stored-value";
import { writeRaw } from "@/lib/local-progress";
import { RANDOM_LESSON, articleHref, pickArticle, suggestedTime } from "@/lib/lesson-picker";
import { DURATIONS, MAX_DURATION, minutesToDuration } from "@/lib/article-length";
import { codepoints } from "@/lib/khmer-unicode";
import VirtualKeyboard from "@/components/keyboard/VirtualKeyboard";
import { keyboardLabels } from "@/components/keyboard/labels";
import { Icon, Segmented, btn, cardClass, cx } from "@/components/ui/ui";

/** Whether the keyboard preview under the form is expanded (per device). */
const PREVIEW_KEY = "dlt.setup.keyboardPreview";
const validateBool = (v: unknown) => (typeof v === "boolean" ? v : null);

const fieldLabel = "mb-2 block text-xs font-bold uppercase tracking-[0.08em] text-mute";

/**
 * Quick practice setup: language, lesson and duration in one compact card, the rarely changed options
 * (custom length, Mac/Windows keyboard) behind "Advanced", and a collapsible keyboard preview that follows
 * the chosen language and shows the finger for the first key of the chosen lesson.
 */
export default function SetupForm() {
  const { t, locale } = useLocale();
  const ct = useCurriculumText();
  const router = useRouter();
  const kb = keyboardLabels(locale);
  const [kbSettings, updateKb] = useKeyboardSettings();
  const previewOpen = useStoredValue(PREVIEW_KEY, false, validateBool);
  const [timeTouched, setTimeTouched] = useState(false);
  const [customMinutes, setCustomMinutes] = useState("");
  const [config, setConfig] = useState<LessonConfig>({ language: "english", categoryId: "english", timeLimit: 60, activeSectionId: RANDOM_LESSON });
  const category = useMemo(() => lessonCategories.find((item) => item.id === config.categoryId) ?? lessonCategories[0], [config.categoryId]);
  const isRandom = config.activeSectionId === RANDOM_LESSON;
  const selectedSection = category.sections.find((item) => item.id === config.activeSectionId) ?? category.sections[0];
  const levelText = (level: string) => (level === "Beginner" ? t("setup.beginner") : t("setup.intermediate"));
  const minutes = config.timeLimit / 60;
  const customActive = !(DURATIONS as readonly number[]).includes(config.timeLimit);
  // The preview shows finger guidance for the first character the learner will type (unknown for a random article).
  const firstChar = isRandom ? null : codepoints(selectedSection.text)[0] ?? null;

  // Choosing the practice language no longer switches the whole interface language: that is the header's job.
  function selectCategory(nextCategory: LessonCategory) {
    setConfig((current) => ({ ...current, language: nextCategory.language, categoryId: nextCategory.id, activeSectionId: RANDOM_LESSON }));
  }

  function pickLesson(id: string) {
    const picked = category.sections.find((item) => item.id === id);
    setConfig((current) => ({ ...current, activeSectionId: id, timeLimit: picked && !timeTouched ? suggestedTime(picked) : current.timeLimit }));
  }

  function pickDuration(seconds: number) {
    setTimeTouched(true);
    setCustomMinutes("");
    setConfig((current) => ({ ...current, timeLimit: seconds }));
  }

  const startHref = `/learn/${config.language}?lesson=${isRandom ? RANDOM_LESSON : encodeURIComponent(selectedSection.id)}&time=${config.timeLimit}`;

  // Random mode: an article is drawn on Start, sized to the chosen duration at the user's own average speed.
  function startRandom() {
    const { article, goal } = pickArticle(config.language, config.timeLimit);
    router.push(articleHref(config.language, article, goal, config.timeLimit));
  }
  function start(event?: { preventDefault: () => void }) {
    if (!isRandom) { if (!event) router.push(startHref); return; }
    event?.preventDefault();
    startRandom();
  }

  // Enter starts the session unless the learner is typing in a field or using a control.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Enter" || event.defaultPrevented || event.isComposing) return;
      const el = event.target as HTMLElement | null;
      if (el && el.closest("input, select, textarea, button, a, summary, [contenteditable]")) return;
      event.preventDefault();
      start();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const langName = t(config.language === "khmer" ? "setup.langKhmer" : "setup.langEnglish");
  const lessonName = isRandom ? t("setup.randomArticle") : ct.passageTitle(selectedSection);

  return (
    <div className="space-y-4">
      <section className={cx(cardClass, "p-5 sm:p-6")} aria-labelledby="setup-form-title">
        <h2 id="setup-form-title" className="sr-only">{t("setup.title")}</h2>

        {/* Language + duration side by side on wide screens: the two choices everyone makes. */}
        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <div>
            <span className={fieldLabel} id="setup-lang">{t("setup.language")}</span>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-labelledby="setup-lang">
              {lessonCategories.map((item) => {
                const on = item.id === config.categoryId;
                const km = item.language === "khmer";
                return (
                  <button key={item.id} type="button" role="radio" aria-checked={on} onClick={() => selectCategory(item)}
                    className={cx("flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition", on ? "border-brand bg-blue-50/70 ring-2 ring-brand/15" : "border-line bg-card hover:border-slate-300")}>
                    <span className={cx("grid h-9 w-9 shrink-0 place-items-center rounded-lg text-sm font-extrabold", on ? "bg-brand text-white" : "bg-slate-100 text-navy", km && "font-khmer")}>{km ? "ក" : "Aa"}</span>
                    <span className="min-w-0">
                      <span className={cx("block text-sm font-bold text-navy", km && "font-khmer")}>{t(km ? "setup.langKhmer" : "setup.langEnglish")}</span>
                      <span className="block text-xs text-mute">{km ? "NiDA" : "QWERTY"} · {t("setup.lessonCount", { n: item.sections.length })}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <span className={fieldLabel} id="setup-time">{t("setup.duration")}</span>
            <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-labelledby="setup-time">
              {DURATIONS.map((seconds) => {
                const on = config.timeLimit === seconds;
                return (
                  <button key={seconds} type="button" role="radio" aria-checked={on} onClick={() => pickDuration(seconds)}
                    className={cx("h-[52px] rounded-xl border text-sm font-bold tabular-nums transition", on ? "border-brand bg-brand text-white shadow-sm shadow-brand/20" : "border-line bg-card text-navy hover:border-slate-300")}>
                    {seconds / 60}<span className={cx("ml-0.5 text-xs font-semibold", on ? "text-white/80" : "text-mute")}>{t("setup.min")}</span>
                  </button>
                );
              })}
            </div>
            {customActive && <p className="mt-1.5 text-xs font-semibold text-brand">{t("setup.customChosen", { n: minutes })}</p>}
          </div>
        </div>

        {/* Lesson */}
        <div className="mt-5">
          <label htmlFor="lesson" className={fieldLabel}>{t("setup.lesson")}</label>
          <div className="relative">
            <select id="lesson" value={config.activeSectionId} onChange={(event) => pickLesson(event.target.value)}
              className={cx("h-12 w-full appearance-none rounded-xl border border-line bg-card pl-3.5 pr-10 text-[15px] font-semibold text-navy outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15", config.language === "khmer" && "font-khmer")}>
              <option value={RANDOM_LESSON}>{t("setup.randomArticleRecommended")}</option>
              {category.sections.map((section) => <option key={section.id} value={section.id}>{ct.passageTitle(section)} · {levelText(section.level)}</option>)}
            </select>
            <Icon name="chevron" size={18} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-mute" />
          </div>
          <p className={cx("mt-2 line-clamp-2 text-sm leading-relaxed text-mute", !isRandom && config.language === "khmer" && "font-khmer")}>
            {isRandom ? t("setup.randomDesc") : <><span className="font-semibold text-navy">{levelText(selectedSection.level)}</span> · {selectedSection.text.slice(0, 140)}{selectedSection.text.length > 140 ? "…" : ""}</>}
          </p>
        </div>

        {/* Advanced: custom length and the physical keyboard type. Closed by default. */}
        <details className="group mt-5 rounded-xl border border-line bg-slate-50/60 open:bg-card">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-bold text-navy [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2"><Icon name="target" size={16} className="text-mute" />{t("setup.advanced")}<span className="hidden font-normal text-mute sm:inline">· {t("setup.advancedHint")}</span></span>
            <Icon name="chevron" size={16} className="text-mute transition group-open:rotate-180" />
          </summary>
          <div className="grid gap-5 border-t border-line px-4 py-4 sm:grid-cols-2">
            <div>
              <label htmlFor="custom-minutes" className={fieldLabel}>{t("setup.customLength")}</label>
              <div className="flex items-center gap-2">
                <input id="custom-minutes" type="number" inputMode="numeric" min={1} max={MAX_DURATION / 60} step={1} value={customMinutes} placeholder={t("setup.customPh")}
                  onChange={(event) => {
                    const value = event.target.value;
                    setCustomMinutes(value);
                    const seconds = minutesToDuration(Number(value));
                    if (value !== "" && seconds) { setTimeTouched(true); setConfig((current) => ({ ...current, timeLimit: seconds })); }
                  }}
                  onBlur={() => { const seconds = minutesToDuration(Number(customMinutes)); setCustomMinutes(seconds ? String(seconds / 60) : ""); }}
                  className="h-10 w-24 rounded-lg border border-line bg-card px-3 text-sm text-navy outline-none focus:border-brand focus:ring-2 focus:ring-brand/15" />
                <span className="text-xs text-mute">{t("setup.min")} (1–{MAX_DURATION / 60})</span>
              </div>
            </div>
            <div>
              <span className={fieldLabel}>{kb.os}</span>
              <Segmented<OSChoice> size="sm" label={kb.os} value={kbSettings.os} onChange={(os) => updateKb({ os })}
                options={[{ value: "auto", label: kb.auto }, { value: "mac", label: kb.mac }, { value: "windows", label: kb.windows }]} />
              <p className="mt-1.5 text-xs text-mute">{t("setup.osHint")}</p>
            </div>
          </div>
        </details>

        {/* Summary + start */}
        <div className="mt-5 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-mute">{t("setup.ready")}</p>
            <p className="mt-0.5 truncate text-[15px] font-bold text-navy">
              {langName} · <span className={cx(!isRandom && config.language === "khmer" && "font-khmer")}>{lessonName}</span> · {t("setup.minutes", { n: minutes })}
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-1 sm:items-end">
            <Link href={startHref} onClick={start} className={btn("primary", "lg", "h-14 px-8 text-base")}>
              <Icon name="play" size={18} />{t("setup.start")}
            </Link>
            <span className="text-center text-xs text-mute sm:text-right">{t("setup.orPress")} <kbd className="rounded border border-line bg-slate-50 px-1.5 py-0.5 font-sans text-[11px] font-semibold text-navy">Enter</kbd></span>
          </div>
        </div>
      </section>

      {/* Keyboard preview: collapsible, follows the chosen language, guides the first key of the chosen lesson. */}
      <section className={cx(cardClass, "overflow-hidden")}>
        <button type="button" aria-expanded={previewOpen} aria-controls="setup-keyboard" onClick={() => writeRaw(PREVIEW_KEY, JSON.stringify(!previewOpen))}
          className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left sm:px-6">
          <span className="flex min-w-0 items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-navy"><Icon name="keyboard" size={18} /></span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-navy">{t("setup.preview")} · {config.language === "khmer" ? kb.khmer + " NiDA" : kb.english + " QWERTY"}</span>
              <span className="block truncate text-xs text-mute">{t("setup.previewHint")}</span>
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-1.5 text-xs font-bold text-brand">{previewOpen ? kb.hide : kb.show}<Icon name="chevron" size={16} className={cx("transition", previewOpen && "rotate-180")} /></span>
        </button>
        {previewOpen && (
          <div id="setup-keyboard" className="border-t border-line px-2 pb-4 pt-2 sm:px-4">
            <VirtualKeyboard language={config.language} expected={firstChar} disabled={!firstChar} />
          </div>
        )}
      </section>
    </div>
  );
}
