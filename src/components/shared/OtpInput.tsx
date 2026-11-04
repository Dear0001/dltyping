"use client";

import { useRef } from "react";

/** A row of single-digit boxes for a one-time code. Handles typing, backspace, arrow keys and pasting the whole code. */
export default function OtpInput({ value, onChange, length = 6, disabled, autoFocus }: { value: string; onChange: (next: string) => void; length?: number; disabled?: boolean; autoFocus?: boolean }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");
  const focus = (i: number) => refs.current[Math.max(0, Math.min(length - 1, i))]?.focus();

  function setAt(i: number, chars: string) {
    const clean = chars.replace(/\D/g, "");
    if (!clean) return;
    const next = (value.slice(0, i) + clean).slice(0, length); // typing or pasting fills from this box onward
    onChange(next);
    focus(Math.min(next.length, length - 1));
  }

  return <div role="group" aria-label="6-digit verification code" className="flex justify-center gap-2">
    {digits.map((digit, i) => <input
      key={i}
      ref={(el) => { refs.current[i] = el; }}
      data-autofocus={autoFocus && i === 0 ? true : undefined}
      type="text"
      inputMode="numeric"
      autoComplete={i === 0 ? "one-time-code" : "off"}
      aria-label={`Digit ${i + 1}`}
      maxLength={length}
      disabled={disabled}
      value={digit}
      onFocus={(e) => e.target.select()}
      onChange={(e) => setAt(i, e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Backspace") {
          e.preventDefault();
          if (digit) onChange(value.slice(0, i) + value.slice(i + 1));
          else if (i > 0) { onChange(value.slice(0, i - 1) + value.slice(i)); focus(i - 1); }
        } else if (e.key === "ArrowLeft") { e.preventDefault(); focus(i - 1); }
        else if (e.key === "ArrowRight") { e.preventDefault(); focus(i + 1); }
      }}
      className={`h-12 w-10 rounded-xl border-2 text-center text-xl font-extrabold text-navy outline-none transition-colors sm:h-14 sm:w-12 sm:text-2xl ${digit ? "border-brand bg-blue-50" : "border-slate-300"} focus:border-brand focus:ring-2 focus:ring-brand/30 disabled:opacity-60`}
    />)}
  </div>;
}
