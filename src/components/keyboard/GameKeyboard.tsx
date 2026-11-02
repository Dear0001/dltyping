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

  return <div className={`keyboard-card game-keyboard-card ${khmer ? "khmer-keyboard-card" : ""}`} role="group" aria-label={khmer ? "Khmer NiDA keyboard" : "English QWERTY keyboard"}>
    <div className="keyboard-topline">
      <span>{khmer ? "ក្តារចុច Khmer NiDA" : "QWERTY keyboard"}</span>
      <span className="layout-chip">{khmer ? "NiDA" : "QWERTY"}</span>
    </div>
    <div className="keyboard">
      {KEY_ROWS.map((row, r) => <div key={r} className={`key-row row-${r}`}>
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
            className={`key ${khmer ? "font-khmer" : ""} ${isTarget ? "next-key" : ""} ${isDown ? "pressed-key" : ""}`}
          >
            {label}
            {(khmer || /\d/.test(base)) && !shift && <span className="absolute right-1 top-0.5 text-[9px] font-normal opacity-50">{shifted}</span>}
          </button>;
        })}
      </div>)}
      <div className="key-row modifier-row">
        <button type="button" tabIndex={-1} disabled={disabled} aria-pressed={shift} onMouseDown={(e) => e.preventDefault()} onClick={() => setShift((s) => !s)} className={`key special-key shift-key ${shift ? "pressed-key" : ""} ${target?.shift && !shift ? "next-key" : ""}`}>⇧ Shift</button>
        <button type="button" tabIndex={-1} disabled={disabled} onMouseDown={(e) => e.preventDefault()} onClick={() => tap("Space")} className={`key space-key ${target?.code === "Space" ? "next-key" : ""} ${down === "Space" ? "pressed-key" : ""}`}>space</button>
        {onBackspace && <button type="button" tabIndex={-1} disabled={disabled} aria-label="Backspace" onMouseDown={(e) => e.preventDefault()} onClick={onBackspace} className="key special-key shift-key">⌫</button>}
      </div>
    </div>
  </div>;
}
