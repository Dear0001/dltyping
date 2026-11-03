"use client";

import { useKeyStatBook } from "@/hooks/useKeyStatBook";
import { makeDrill, weakKeys } from "@/lib/keyboard/key-stats";
import { legendGlyph } from "@/lib/keyboard/keyboard-utils";
import type { Language } from "@/types";

type Props = { language: Language; km: boolean; onDrill: (text: string) => void };

/** Lists the keys you miss or hesitate on most, with a one-click drill. Data comes from this device's history. */
export default function WeakKeysReport({ language, km, onDrill }: Props) {
  const book = useKeyStatBook();
  const weak = weakKeys(book[language]);
  const tracked = Object.values(book[language]).reduce((a, s) => a + s.n, 0);

  return (
    <div className="mx-auto mt-4 max-w-xl rounded-2xl border border-blue-100 bg-white p-4 text-left shadow-sm" aria-live="polite">
      <h3 className="text-sm font-extrabold text-navy">{km ? "គ្រាប់ចុចដែលត្រូវហាត់" : "Your weak keys"}</h3>
      {weak.length === 0 ? (
        <p className="mt-1 text-xs text-mute">
          {tracked < 30 ? (km ? "វាយបន្តិចទៀត ដើម្បីឱ្យយើងរកឃើញគ្រាប់ចុចដែលអ្នកច្រឡំ។" : "Type a little more and we'll find the keys you miss or hesitate on.") : (km ? "មិនទាន់មានគ្រាប់ចុចខ្សោយទេ។ ល្អណាស់!" : "No weak keys right now. Nice work!")}
        </p>
      ) : (
        <>
          <ul className="mt-2 flex flex-wrap gap-2">
            {weak.map((k) => (
              <li key={k.char} className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-2 py-1">
                <span className={`grid h-8 min-w-8 place-items-center rounded-lg border border-slate-200 bg-white px-1 text-base font-bold text-navy ${language === "khmer" ? "font-khmer" : ""}`}>{legendGlyph(k.char)}</span>
                <span className="text-[11px] leading-tight text-slate-600">
                  <strong className="text-red-600">{Math.round(k.errorRate * 100)}%</strong> {km ? "ខុស" : "missed"}
                  {k.avgMs > 0 && <><br />{Math.round(k.avgMs)} ms</>}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-mute">{km ? "ក្តារចុចខាងលើបង្ហាញពណ៌ក្រហមលើគ្រាប់ដែលអ្នកច្រឡំច្រើន។" : "The keyboard above is shaded red where you struggle most."}</p>
          <button type="button" className="mt-3 rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white" onClick={() => onDrill(makeDrill(weak.map((k) => k.char)))}>
            🎯 {km ? "ហាត់គ្រាប់ចុចខ្សោយ" : "Practice weak keys"}
          </button>
        </>
      )}
    </div>
  );
}
