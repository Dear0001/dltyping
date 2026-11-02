"use client";

import type { LessonCategory } from "@/types";

type CategorySelectorProps = {
  categories: LessonCategory[];
  selectedId: string;
  onSelect: (category: LessonCategory) => void;
};

export default function CategorySelector({ categories, selectedId, onSelect }: CategorySelectorProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Lesson category">
      {categories.map((category) => {
        const selected = category.id === selectedId;
        return (
          <button key={category.id} type="button" role="radio" aria-checked={selected} onClick={() => onSelect(category)} className={`rounded-xl border p-4 text-left transition ${selected ? "border-[#789778] bg-[#f1f5ee] shadow-sm" : "border-[#e8e9e2] bg-white hover:border-[#cbd5c7]"}`}>
            <span className="flex items-center justify-between">
              <span className="font-serif text-lg text-[#30372f]">{category.name}</span>
              <span className={`grid h-5 w-5 place-items-center rounded-full border text-xs ${selected ? "border-[#557b5a] bg-[#557b5a] text-white" : "border-[#d8dcd2] text-transparent"}`}>✓</span>
            </span>
            <span className="mt-1 block text-xs text-[#7f867c]">{category.nativeLabel}</span>
            <span className="mt-3 block text-[10px] text-[#92978d]">{category.sections.length} starter lessons · open access</span>
          </button>
        );
      })}
    </div>
  );
}
