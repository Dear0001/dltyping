"use client";

import { charMapFor } from "@/lib/keyboard/keyboard-mapping";
import { isLetterKey, legendGlyph } from "@/lib/keyboard/keyboard-utils";
import type { Language } from "@/types";
import type { KeyFlash } from "@/hooks/useKeyboardInput";
import KeyboardKey, { type KeyLegend } from "./KeyboardKey";
import type { KeySpec, PhysicalLayout } from "./layouts/types";

type Props = {
  layout: PhysicalLayout;
  language: Language;
  shift: boolean;
  caps: boolean;
  pressed: ReadonlySet<string>;
  flash: KeyFlash | null;
  /** Codes to emphasise as "next": the key and, if needed, a Shift key. */
  next: ReadonlySet<string>;
  /** Modifier keys that are currently on (ctrl/alt/meta from the physical keyboard). */
  mods: { ctrl: boolean; alt: boolean; meta: boolean };
  interactive: boolean;
  onTap?: (code: string) => void;
};

function legendFor(spec: KeySpec, language: Language, shift: boolean, caps: boolean): KeyLegend | undefined {
  const pair = charMapFor(language)[spec.code];
  if (!pair) return undefined;
  const khmer = language === "khmer";
  const letter = !khmer && isLetterKey(spec.code);
  const upper = letter ? shift !== caps : shift;
  const [base, shifted] = pair;
  const show = upper ? shifted : base;
  const other = upper ? base : shifted;
  const latin = charMapFor("english")[spec.code];
  if (khmer) return { main: legendGlyph(show), alt: legendGlyph(other), hint: latin?.[0]?.toUpperCase() };
  return { main: show, alt: letter ? undefined : other };
}

export default function KeyboardLayout({ layout, language, shift, caps, pressed, flash, next, mods, interactive, onTap }: Props) {
  const khmer = language === "khmer";

  function renderKey(spec: KeySpec) {
    const legend = spec.kind === "char" ? legendFor(spec, language, shift, caps) : undefined;
    const flashed = flash?.code === spec.code;
    const modOn = spec.mod === "shift" ? shift : spec.mod === "caps" ? caps : spec.mod ? mods[spec.mod] : false;
    return (
      <KeyboardKey
        key={spec.code}
        spec={spec}
        legend={legend}
        khmer={khmer}
        interactive={interactive && spec.kind !== "fn"}
        onTap={onTap}
        state={{
          pressed: pressed.has(spec.code),
          next: next.has(spec.code),
          correct: flashed && flash.ok,
          wrong: flashed && !flash.ok,
          active: modOn,
        }}
      />
    );
  }

  return (
    <div className="vk-board" data-lang={language}>
      {layout.rows.map((row, r) => (
        <div key={r} className={`vk-row ${r === 0 ? "vk-fn-row" : ""}`}>
          {row.map((spec) => (
            <div key={spec.code} className="vk-cell" style={{ gridColumn: `span ${Math.round(spec.w * 4)}` }}>
              {spec.stack ? <div className="vk-stack">{spec.stack.map(renderKey)}</div> : renderKey(spec)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
