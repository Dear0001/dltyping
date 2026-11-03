"use client";

import { useMemo } from "react";
import VirtualKeyboard from "@/components/keyboard/VirtualKeyboard";
import { keyTooltip, MASTERY_META, type KeyAnalysis, type MasteryLevel } from "@/lib/progress/keyboard-analytics";
import type { Language } from "@/types";

const LEGEND: { level: MasteryLevel; swatch: string; mark: string }[] = [
  { level: "excellent", swatch: "bg-[#2563eb] border-[#1d4ed8]", mark: "✓" },
  { level: "good", swatch: "bg-[#bae6fd] border-[#38bdf8]", mark: "•" },
  { level: "weak", swatch: "bg-[#fee2e2] border-[#ef4444]", mark: "!" },
  { level: "learning", swatch: "bg-white border-dashed border-slate-400", mark: "" },
  { level: "none", swatch: "bg-slate-100 border-slate-200", mark: "" },
];

type Props = {
  language: Language;
  analysis: Record<string, KeyAnalysis>;
  selected: string | null;
  onSelect: (code: string) => void;
};

/**
 * The shared virtual keyboard (same layouts, Mac/Windows detection and controls as
 * practice), coloured by how accurately each physical key has been typed.
 */
export default function KeyboardHeatmap({ language, analysis, selected, onSelect }: Props) {
  const keyStatus = useMemo(
    () => Object.fromEntries(Object.values(analysis).map((k) => [k.code, { level: k.level, tip: keyTooltip(k) }])),
    [analysis],
  );
  return (
    <div>
      <VirtualKeyboard language={language} guidance={false} disabled keyStatus={keyStatus} selectedKey={selected} onKeySelect={onSelect} />
      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-mute" aria-label="Colour legend">
        {LEGEND.map(({ level, swatch, mark }) => (
          <li key={level} className="flex items-center gap-2" title={MASTERY_META[level].blurb}>
            <span className={`grid h-5 w-5 place-items-center rounded border text-[10px] font-extrabold ${swatch} ${level === "excellent" ? "text-white" : "text-navy"}`} aria-hidden="true">{mark}</span>
            <span><strong className="text-navy">{MASTERY_META[level].label}</strong> · {MASTERY_META[level].blurb}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
