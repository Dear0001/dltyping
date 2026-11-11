"use client";

import { useLocale } from "@/components/shared/LocaleProvider";
import { useKeyStatBook } from "@/hooks/useKeyStatBook";
import { makeDrill, weakKeys } from "@/lib/keyboard/key-stats";
import { legendGlyph } from "@/lib/keyboard/keyboard-utils";
import type { Language } from "@/types";

type Props = { language: Language; onDrill: (text: string) => void };

/** Lists the keys you miss or hesitate on most, with a one-click drill. Data comes from this device's history. */
export default function WeakKeysReport({ language, onDrill }: Props) {
  const { t } = useLocale();
  const book = useKeyStatBook();
  const weak = weakKeys(book[language]);
  const tracked = Object.values(book[language]).reduce((a, s) => a + s.n, 0);

  return (
    <div className="mx-auto mt-4 max-w-xl rounded-2xl border border-blue-100 bg-white p-4 text-left shadow-sm" aria-live="polite">
      <h3 className="text-sm font-extrabold text-navy">{t("practice.yourWeakKeys")}</h3>
      {weak.length === 0 ? (
        <p className="mt-1 text-xs text-mute">
          {tracked < 30 ? (t("practice.typeALittleMoreAnd")) : (t("practice.noWeakKeysRightNow"))}
        </p>
      ) : (
        <>
          <ul className="mt-2 flex flex-wrap gap-2">
            {weak.map((k) => (
              <li key={k.char} className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-2 py-1">
                <span className={`grid h-8 min-w-8 place-items-center rounded-lg border border-slate-200 bg-white px-1 text-base font-bold text-navy ${language === "khmer" ? "font-khmer" : ""}`}>{legendGlyph(k.char)}</span>
                <span className="text-[11px] leading-tight text-slate-600">
                  <strong className="text-red-600">{Math.round(k.errorRate * 100)}%</strong> {t("practice.missed")}
                  {k.avgMs > 0 && <><br />{Math.round(k.avgMs)} ms</>}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-mute">{t("practice.theKeyboardAboveIsShaded")}</p>
          <button type="button" className="mt-3 rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white" onClick={() => onDrill(makeDrill(weak.map((k) => k.char)))}>
            🎯 {t("practice.practiceWeakKeys")}
          </button>
        </>
      )}
    </div>
  );
}
