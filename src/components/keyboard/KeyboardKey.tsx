"use client";

import { memo } from "react";
import type { KeySpec } from "./layouts/types";

export type KeyLegend = { main: string; alt?: string; hint?: string; upper?: boolean };
export type KeyState = { pressed?: boolean; next?: boolean; correct?: boolean; wrong?: boolean; active?: boolean };

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
    state.wrong ? "is-wrong" : "", state.active ? "is-active" : "",
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
      {...(interactive
        ? { type: "button" as const, tabIndex: -1, onMouseDown: (e: React.MouseEvent) => e.preventDefault(), onClick: () => onTap?.(spec.code), "aria-label": legend?.main ?? spec.label?.[1] ?? spec.label?.[0] ?? spec.code }
        : { "aria-hidden": true })}
    >
      {content}
    </Tag>
  );
}

export default memo(KeyboardKeyBase);
