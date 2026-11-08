"use client";

import { useMemo } from "react";
import VirtualKeyboard from "@/components/keyboard/VirtualKeyboard";
import { keyTooltip, MASTERY_META, physicalKeyName, type KeyAnalysis, type MasteryLevel } from "@/lib/progress/keyboard-analytics";
import { msToWpm, SPEED_META, type SpeedSummary } from "@/lib/progress/key-speed";
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
  /** "speed" colours keys by how fast you press them compared with your own average. */
  mode?: "accuracy" | "speed";
  speed?: SpeedSummary;
};

const speedTip = (code: string, s: SpeedSummary["keys"][string]) =>
  s.avgMs === null ? `${physicalKeyName(code)}: no timing data` : `${physicalKeyName(code)}: ${Math.round(s.avgMs)} ms per press (~${msToWpm(s.avgMs)} WPM) · ${s.timed} timed presses`;

/**
 * The shared virtual keyboard (same layouts, Mac/Windows detection and controls as
 * practice), coloured by how accurately each physical key has been typed.
 */
export default function KeyboardHeatmap({ language, analysis, selected, onSelect, mode = "accuracy", speed }: Props) {
  const keyStatus = useMemo(
    () => mode === "speed" && speed
      ? Object.fromEntries(Object.values(speed.keys).map((k) => [k.code, { level: k.level, tip: speedTip(k.code, k) }]))
      : Object.fromEntries(Object.values(analysis).map((k) => [k.code, { level: k.level, tip: keyTooltip(k) }])),
    [analysis, mode, speed],
  );
  const meta = mode === "speed" ? SPEED_META : MASTERY_META;
  return (
    <div>
      <VirtualKeyboard language={language} guidance={false} disabled keyStatus={keyStatus} selectedKey={selected} onKeySelect={onSelect} />
      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-mute" aria-label="Colour legend">
        {LEGEND.map(({ level, swatch, mark }) => (
          <li key={level} className="flex items-center gap-2" title={meta[level].blurb}>
            <span className={`grid h-5 w-5 place-items-center rounded border text-[10px] font-extrabold ${swatch} ${level === "excellent" ? "text-white" : "text-navy"}`} aria-hidden="true">{mark}</span>
            <span><strong className="text-navy">{meta[level].label}</strong> · {meta[level].blurb}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
