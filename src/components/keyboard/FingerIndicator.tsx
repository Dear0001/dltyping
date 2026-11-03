import { memo } from "react";
import { colorOfFinger, type FingerId } from "@/lib/keyboard/finger-mapping";

/** idle: resting. target: press with this finger. shift: hold Shift with this finger. wrong: this finger hit a wrong key. */
export type FingerState = "idle" | "target" | "shift" | "wrong";

export type Badge = { x: number; y: number; text: string; khmer?: boolean };

type Props = {
  id: FingerId;
  /** Accessible name, e.g. "Left index finger". */
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Rotation in degrees around the rectangle's centre (thumbs). */
  rotate?: number;
  state: FingerState;
  badge?: Badge;
};

const SKIN = "#fde7d2";
const SKIN_LINE = "#c9a583";
const WRONG = "#dc2626";

/** One finger: a rounded SVG shape plus a badge above the fingertip. Colour, outline and the badge text together show its state. */
function FingerIndicatorBase({ id, label, x, y, w, h, rotate = 0, state, badge }: Props) {
  const color = colorOfFinger(id);
  const active = state !== "idle";
  const transform = rotate ? `rotate(${rotate} ${x + w / 2} ${y + h / 2})` : undefined;
  const fill = state === "target" ? color : state === "shift" ? color : state === "wrong" ? "#fee2e2" : SKIN;
  const stroke = state === "wrong" ? WRONG : active ? "#0f172a" : SKIN_LINE;
  return (
    <g className={`vg-finger vg-${state}`} data-finger={id} data-state={state}>
      <title>{label}</title>
      {active && <rect className="vg-glow" x={x - 4} y={y - 4} width={w + 8} height={h + 8} rx={(w + 8) / 2} fill="none" stroke={state === "wrong" ? WRONG : color} strokeWidth={5} transform={transform} />}
      <rect x={x} y={y} width={w} height={h} rx={w / 2} fill={fill} fillOpacity={state === "shift" ? 0.88 : 1} stroke={stroke} strokeWidth={active ? 2.5 : 1.5} strokeDasharray={state === "shift" ? "5 3" : undefined} transform={transform} />
      {badge && (
        <g aria-hidden="true">
          <circle cx={badge.x} cy={badge.y} r={active ? 17 : 14} fill={state === "wrong" ? WRONG : active ? color : "#fff"} stroke={active ? "#fff" : "#cbd5e1"} strokeWidth={active ? 2 : 1} />
          <text x={badge.x} y={badge.y} textAnchor="middle" dominantBaseline="central" fontSize={badge.khmer ? 18 : 16} fontWeight={700} fill={active ? "#fff" : "#475569"} className={badge.khmer ? "font-khmer" : undefined}>{badge.text}</text>
        </g>
      )}
    </g>
  );
}

export default memo(FingerIndicatorBase);
