"use client";

import { useEffect, useState } from "react";
import { KEY_ROWS, charForCode, findKeyFor } from "@/lib/keyboard-layouts";
import type { Language } from "@/types";

type Props = {
  language: Language;
  /** The next code point the player must type; its key (and Shift) is highlighted. */
  expected?: string | null;
  disabled?: boolean;
  onChar: (char: string) => void;
  onBackspace?: () => void;
};

const keyBase = "relative flex h-10 min-w-0 flex-1 select-none items-center justify-center rounded-lg border-b-[3px] border-slate-300 bg-white text-sm font-semibold text-navy transition-colors sm:h-11 focus-visible:outline-2 focus-visible:outline-brand";

/** On-screen English QWERTY / Khmer NiDA keyboard for the games. Works with touch and mirrors physical key presses. */
export default function GameKeyboard({ language, expected, disabled, onChar, onBackspace }: Props) {
  const [shift, setShift] = useState(false);
  const [down, setDown] = useState<string | null>(null);
  const khmer = language === "khmer";
  const target = expected ? findKeyFor(language, expected) : null;

  useEffect(() => {
    const press = (e: KeyboardEvent) => setDown(e.code);
    const release = () => setDown(null);
    window.addEventListener("keydown", press);
    window.addEventListener("keyup", release);
    return () => {
      window.removeEventListener("keydown", press);
      window.removeEventListener("keyup", release);
    };
  }, []);

  function tap(code: string) {
    const char = code === "Space" ? " " : charForCode(language, code, shift);
    setShift(false);
    if (char) onChar(char);
  }

  return <div className="rounded-2xl border border-slate-200 bg-slate-100 p-2 sm:p-3" role="group" aria-label={khmer ? "Khmer NiDA keyboard" : "English QWERTY keyboard"}>
    <div className="mb-1.5 flex items-center justify-between px-1 text-[11px] font-semibold text-mute">
      <span>{khmer ? "ក្តារចុច Khmer NiDA" : "QWERTY keyboard"}</span>
      <span>{khmer ? "Shift = hold or tap ⇧" : "Tap keys on touch devices"}</span>
    </div>
    <div className="space-y-1.5">
      {KEY_ROWS.map((row, r) => <div key={r} className="flex gap-1 sm:gap-1.5" style={{ paddingLeft: r === 1 ? "2%" : r === 2 ? "4%" : r === 3 ? "7%" : 0, paddingRight: r === 3 ? "7%" : 0 }}>
        {row.map((key) => {
          const [base, shifted] = khmer ? key.km : key.en;
          const label = shift ? shifted : base;
          const isTarget = target?.code === key.code;
          const isDown = down === key.code;
          return <button
            key={key.code}
            type="button"
            tabIndex={-1}
            disabled={disabled}
            aria-label={label}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => tap(key.code)}
            className={`${keyBase} ${isTarget ? "!border-blue-700 !bg-brand !text-white ring-2 ring-accent" : ""} ${isDown ? "translate-y-0.5 !bg-sky-100" : ""} ${khmer ? "font-khmer text-base" : ""}`}
          >
            {label}
            {(khmer || /\d/.test(base)) && !shift && <span className="absolute right-1 top-0.5 text-[9px] font-normal opacity-50">{shifted}</span>}
          </button>;
        })}
      </div>)}
      <div className="flex gap-1 sm:gap-1.5">
        <button type="button" tabIndex={-1} disabled={disabled} aria-pressed={shift} onMouseDown={(e) => e.preventDefault()} onClick={() => setShift((s) => !s)} className={`${keyBase} !flex-[1.6] ${shift || target?.shift ? "!border-blue-700 !bg-brand !text-white" : ""} ${target?.shift && !shift ? "ring-2 ring-accent" : ""}`}>⇧ Shift</button>
        <button type="button" tabIndex={-1} disabled={disabled} onMouseDown={(e) => e.preventDefault()} onClick={() => tap("Space")} className={`${keyBase} !flex-[6] ${target?.code === "Space" ? "!border-blue-700 !bg-brand !text-white ring-2 ring-accent" : ""} ${down === "Space" ? "!bg-sky-100" : ""}`}>space</button>
        {onBackspace && <button type="button" tabIndex={-1} disabled={disabled} aria-label="Backspace" onMouseDown={(e) => e.preventDefault()} onClick={onBackspace} className={`${keyBase} !flex-[1.6]`}>⌫</button>}
      </div>
    </div>
  </div>;
}
