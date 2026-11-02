import { codepoints } from "@/lib/khmer-unicode";
import { getCharStates } from "@/lib/typing-engine";
import type { Language } from "@/types";

/** The prominent "type this next" card. Progress is shown per grapheme cluster. */
export default function TargetCard({ unit, typed, language, label = "Type this" }: { unit: string; typed: number; language: Language; label?: string }) {
  const states = getCharStates(unit, codepoints(unit).slice(0, typed), language);
  return <div className="flex items-center justify-center gap-4 rounded-2xl border border-blue-100 bg-white px-6 py-2 shadow-sm" aria-live="polite">
    <span className="text-[11px] font-bold uppercase tracking-widest text-mute">{label} →</span>
    <span className={`leading-tight ${language === "khmer" ? "font-khmer text-5xl" : "text-5xl font-extrabold"}`} lang={language === "khmer" ? "km" : "en"}>
      {states.map((s, i) => <span key={i} className={s.state === "correct" ? "text-good" : s.state === "partial" ? "text-brand underline decoration-4 underline-offset-8" : "text-navy"}>{s.text}</span>)}
    </span>
  </div>;
}
