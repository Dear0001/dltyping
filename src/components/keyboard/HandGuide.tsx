"use client";

import FingerIndicator, { type Badge, type FingerState } from "./FingerIndicator";
import { FINGER_IDS, fingerNameOf, handOf, HOME_ROW, type FingerId, type FingerName, type Hand } from "@/lib/keyboard/finger-mapping";
import { keyName } from "@/lib/keyboard/typing-guidance";

type Props = {
  /** Finger that must press the expected key, or null to show the resting (home-row) position. */
  target: FingerId | null;
  /** Text on the target fingertip: the key (F, ;) or the Khmer character. */
  targetBadge: string | null;
  khmer: boolean;
  /** Finger holding Shift, when the character needs it. */
  shift: FingerId | null;
  /** Finger that just pressed a wrong key. */
  wrong: FingerId | null;
  names: { hand: Record<Hand, string>; finger: Record<FingerName, string> };
  ariaLabel: string;
};

// Geometry in viewBox units, for the LEFT hand seen from above, relative to the hand's origin.
// The right hand is its mirror image, so both stay consistent.
const LW = 212;
type Shape = { x: number; y: number; w: number; h: number; rotate?: number; badge: { x: number; y: number } };
const LEFT: Record<FingerName, Shape> = {
  pinky: { x: 6, y: 92, w: 30, h: 72, badge: { x: 21, y: 74 } },
  ring: { x: 42, y: 68, w: 32, h: 96, badge: { x: 58, y: 50 } },
  middle: { x: 80, y: 58, w: 34, h: 106, badge: { x: 97, y: 40 } },
  index: { x: 120, y: 72, w: 32, h: 92, badge: { x: 136, y: 54 } },
  thumb: { x: 160, y: 162, w: 30, h: 64, rotate: 32, badge: { x: 200, y: 150 } },
};
const ORIGIN: Record<Hand, number> = { left: 8, right: 262 };
export const HAND_VIEW = { width: 482, height: 262 };

function place(hand: Hand, s: Shape) {
  if (hand === "left") return { x: ORIGIN.left + s.x, y: s.y, w: s.w, h: s.h, rotate: s.rotate, bx: ORIGIN.left + s.badge.x, by: s.badge.y };
  // Mirror across the hand's own width.
  return { x: ORIGIN.right + (LW - s.x - s.w), y: s.y, w: s.w, h: s.h, rotate: s.rotate ? -s.rotate : undefined, bx: ORIGIN.right + (LW - s.badge.x), by: s.badge.y };
}

const PALM_X = 0, PALM_Y = 136, PALM_W = 160, PALM_H = 86;

/** Both hands, all ten fingers. The target finger lights up in its colour; the home-row key sits on each idle fingertip. */
export default function HandGuide({ target, targetBadge, khmer, shift, wrong, names, ariaLabel }: Props) {
  const stateOf = (id: FingerId): FingerState => (id === wrong ? "wrong" : id === target ? "target" : id === shift ? "shift" : "idle");
  return (
    <svg className="vg-hands" viewBox={`0 0 ${HAND_VIEW.width} ${HAND_VIEW.height}`} role="img" aria-label={ariaLabel} preserveAspectRatio="xMidYMid meet">
      {(["left", "right"] as const).map((hand) => {
        const palmX = hand === "left" ? ORIGIN.left + PALM_X : ORIGIN.right + (LW - PALM_X - PALM_W - 2);
        return (
          <g key={hand} data-hand={hand}>
            {FINGER_IDS.filter((id) => handOf(id) === hand).map((id) => {
              const name = fingerNameOf(id);
              const p = place(hand, LEFT[name]);
              const state = stateOf(id);
              let badge: Badge | undefined;
              if (state === "target" && targetBadge) badge = { x: p.bx, y: p.by, text: targetBadge, khmer };
              else if (state === "shift") badge = { x: p.bx, y: p.by, text: "⇧" };
              else if (state === "wrong") badge = { x: p.bx, y: p.by, text: "✕" };
              else if (!target && HOME_ROW[id]) badge = { x: p.bx, y: p.by, text: HOME_ROW[id] === "Space" ? "␣" : keyName(HOME_ROW[id] as string) };
              return <FingerIndicator key={id} id={id} label={`${names.hand[hand]} ${names.finger[name]}`} x={p.x} y={p.y} w={p.w} h={p.h} rotate={p.rotate} state={state} badge={badge} />;
            })}
            {/* Palm drawn after the fingers so their bases tuck under it. */}
            <rect x={palmX} y={PALM_Y} width={PALM_W + 2} height={PALM_H} rx={38} fill="#fde7d2" stroke="#c9a583" strokeWidth={1.5} />
            <text x={palmX + PALM_W / 2} y={PALM_Y + PALM_H / 2 + 4} textAnchor="middle" fontSize={13} fontWeight={600} fill="#7c6a58">{names.hand[hand]}</text>
          </g>
        );
      })}
    </svg>
  );
}
