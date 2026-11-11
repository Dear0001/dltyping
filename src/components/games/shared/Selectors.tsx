"use client";

import { useLocale } from "@/components/shared/LocaleProvider";
import { useGameText } from "@/hooks/useGameText";
import type { Difficulty } from "@/lib/game-engine";
import type { Language } from "@/types";

export function Segmented<T extends string | number>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string; disabled?: boolean }[]; onChange: (value: T) => void }) {
  return <div>
    <div className="mb-1.5 text-xs font-bold uppercase tracking-wider text-mute" id={`seg-${label}`}>{label}</div>
    <div role="radiogroup" aria-labelledby={`seg-${label}`} className="flex rounded-xl bg-slate-100 p-1">
      {options.map((option) => <button
        key={String(option.value)}
        type="button"
        role="radio"
        aria-checked={option.value === value}
        disabled={option.disabled}
        onClick={() => onChange(option.value)}
        className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-brand ${option.value === value ? "bg-white text-brand shadow-sm" : "text-mute hover:text-navy"} disabled:opacity-40`}
      >{option.label}</button>)}
    </div>
  </div>;
}

export function DifficultySelector({ value, onChange }: { value: Difficulty; onChange: (value: Difficulty) => void }) {
  const { t } = useLocale();
  const gt = useGameText();
  return <Segmented label={t("gamehub.difficulty")} value={value} onChange={onChange} options={(["easy", "medium", "hard"] as const).map((d) => ({ value: d, label: gt.difficulty(d) }))} />;
}

export function LanguageSelector({ value, onChange, options = ["english", "khmer"] }: { value: Language; onChange: (value: Language) => void; options?: Language[] }) {
  const { t } = useLocale();
  return <Segmented label={t("gamehub.language")} value={value} onChange={onChange} options={options.map((l) => ({ value: l, label: t(l === "khmer" ? "category.khmer" : "category.english") }))} />;
}
