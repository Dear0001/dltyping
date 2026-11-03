"use client";

import { memo } from "react";
import type { KeySpec } from "./layouts/types";

export type KeyLegend = { main: string; alt?: string; hint?: string; upper?: boolean };
/** Mastery colouring for the dashboard heatmap. */
export type KeyMastery = "excellent" | "good" | "weak" | "learning" | "none";
export type KeyState = {
  pressed?: boolean; next?: boolean; correct?: boolean; wrong?: boolean; active?: boolean; heat?: number;
  mastery?: KeyMastery; selected?: boolean; tip?: string;
  /** Colour of the finger that presses this key (CSS colour). */
  finger?: string;
  /** Draw the finger colour on the key even when it is not the target (Learning mode). */
  zone?: boolean;
};

type Props = {
  spec: KeySpec;
  legend?: KeyLegend;
  state: KeyState;
  khmer: boolean;
  interactive: boolean;
  onTap?: (code: string) => void;
};

function KeyboardKeyBase({ spec, legend, state, khmer, interactive, onTap }: Props) {
  const cls = [
    "vk-key", `vk-${spec.kind}`, spec.align ? `vk-${spec.align}` : "",
    legend && khmer ? "vk-khmer" : "", spec.code === "CapsLock" ? "vk-caps" : "",
    state.pressed ? "is-pressed" : "", state.next ? "is-next" : "", state.correct ? "is-correct" : "",
    state.wrong ? "is-wrong" : "", state.active ? "is-active" : "", state.heat ? "has-heat" : "",
    state.mastery ? `m-${state.mastery}` : "", state.selected ? "is-selected" : "", state.finger ? "has-finger" : "", state.finger && state.zone ? "is-zone" : "",
  ].filter(Boolean).join(" ");

  const content = legend ? (
    <>
      {legend.alt && <span className="vk-alt" aria-hidden>{legend.alt}</span>}
      <span className="vk-main">{legend.main}</span>
      {legend.hint && <span className="vk-hint" aria-hidden>{legend.hint}</span>}
    </>
  ) : spec.label ? (
    <>
      {spec.label[1] !== undefined && spec.label[0] && <span className="vk-sym">{spec.label[0]}</span>}
      <span className="vk-name">{spec.label[1] ?? spec.label[0]}</span>
    </>
  ) : null;

  const Tag = interactive ? "button" : "div";
  return (
    <Tag
      className={cls}
      data-code={spec.code}
      title={state.tip}
      style={state.heat || state.finger ? ({ ...(state.heat ? { "--heat": state.heat } : {}), ...(state.finger ? { "--finger": state.finger } : {}) } as React.CSSProperties) : undefined}
      {...(interactive
        ? { type: "button" as const, tabIndex: state.mastery ? 0 : -1, onMouseDown: (e: React.MouseEvent) => e.preventDefault(), onClick: () => onTap?.(spec.code), "aria-label": state.tip ?? legend?.main ?? spec.label?.[1] ?? spec.label?.[0] ?? spec.code, ...(state.mastery ? { "aria-pressed": Boolean(state.selected) } : {}) }
        : { "aria-hidden": true })}
    >
      {content}
    </Tag>
  );
}

export default memo(KeyboardKeyBase);
