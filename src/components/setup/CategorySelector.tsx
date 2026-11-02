"use client";

import type { LessonCategory } from "@/types";
import { useLocale } from "@/components/shared/LocaleProvider";

type CategorySelectorProps = {
  categories: LessonCategory[];
  selectedId: string;
  onSelect: (category: LessonCategory) => void;
};

export default function CategorySelector({ categories, selectedId, onSelect }: CategorySelectorProps) {
  const { locale, t } = useLocale();
  return (
    <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label={locale === "km" ? "ប្រភេទមេរៀន" : "Lesson category"}>
      {categories.map((category) => {
        const selected = category.id === selectedId;
        return (
          <button key={category.id} type="button" role="radio" aria-checked={selected} onClick={() => onSelect(category)} className={`rounded-xl border p-4 text-left transition ${selected ? "border-[#2563eb] bg-[#eff6ff] shadow-sm" : "border-[#e2e8f0] bg-white hover:border-[#e2e8f0]"}`}>
            <span className="flex items-center justify-between">
              <span className="font-serif text-lg text-[#2e3238]">{t(category.id === "english" ? "category.english" : "category.khmer")}</span>
              <span className={`grid h-5 w-5 place-items-center rounded-full border text-xs ${selected ? "border-[#52637e] bg-[#52637e] text-white" : "border-[#d1d6dd] text-transparent"}`}>✓</span>
            </span>
            <span className="mt-1 block text-xs text-[#64748b]">{t(category.id === "english" ? "category.englishLabel" : "category.khmerLabel")}</span>
            <span className="mt-3 block text-[10px] text-[#64748b]">{category.sections.length} {t("category.openAccess")}</span>
          </button>
        );
      })}
    </div>
  );
}
