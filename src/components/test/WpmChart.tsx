"use client";

import { useState } from "react";
import type { RunSample } from "@/lib/typing-test";

const W = 640, H = 200, PAD = { top: 16, right: 44, bottom: 26, left: 36 };
const WPM_COLOR = "#2563eb"; // brand
const RAW_COLOR = "#94a3b8"; // neutral slate; also dashed, so it never relies on colour alone
const ERROR_COLOR = "#dc2626"; // status: critical

/** Speed over the run: net WPM and raw WPM on one axis (same unit), with a marker where errors happened. */
export default function WpmChart({ samples, km = false }: { samples: readonly RunSample[]; km?: boolean }) {
  const [hover, setHover] = useState<number | null>(null);
  if (samples.length < 2) return null;
  const maxX = samples.at(-1)!.second;
  const top = Math.max(20, ...samples.map((s) => Math.max(s.wpm, s.raw)));
  const maxY = Math.ceil(top / 20) * 20;
  const x = (sec: number) => PAD.left + (sec / maxX) * (W - PAD.left - PAD.right);
  const y = (v: number) => H - PAD.bottom - (v / maxY) * (H - PAD.top - PAD.bottom);
  const line = (key: "wpm" | "raw") => samples.map((s, i) => `${i ? "L" : "M"}${x(s.second).toFixed(1)},${y(s[key]).toFixed(1)}`).join(" ");
  const errorAt = samples.flatMap((s, i) => (s.errors > (i ? samples[i - 1].errors : 0) ? [{ s, count: s.errors - (i ? samples[i - 1].errors : 0) }] : []));
  const ticks = [0, maxY / 2, maxY];
  const last = samples.at(-1)!;
  const h = hover === null ? null : samples[hover];

  function onMove(e: React.PointerEvent<SVGRectElement>) {
    const box = e.currentTarget.getBoundingClientRect();
    const sec = ((e.clientX - box.left) / box.width) * maxX;
    let best = 0;
    samples.forEach((s, i) => { if (Math.abs(s.second - sec) < Math.abs(samples[best].second - sec)) best = i; });
    setHover(best);
  }

  return (
    <figure className="m-0">
      <figcaption className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-mute">
        <span className="font-bold text-navy">{km ? "ល្បឿនតាមវិនាទី" : "Speed over time"}</span>
        <span className="flex items-center gap-1.5"><svg width="18" height="4" aria-hidden="true"><line x1="0" y1="2" x2="18" y2="2" stroke={WPM_COLOR} strokeWidth="2" /></svg>WPM</span>
        <span className="flex items-center gap-1.5"><svg width="18" height="4" aria-hidden="true"><line x1="0" y1="2" x2="18" y2="2" stroke={RAW_COLOR} strokeWidth="2" strokeDasharray="4 3" /></svg>{km ? "WPM សរុប (រាប់ទាំងកំហុស)" : "Raw WPM (incl. errors)"}</span>
        <span className="flex items-center gap-1.5"><svg width="10" height="10" aria-hidden="true"><path d="M2 2L8 8M8 2L2 8" stroke={ERROR_COLOR} strokeWidth="2" /></svg>{km ? "កំហុស" : "Error"}</span>
      </figcaption>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full overflow-visible" role="img" aria-label={`${km ? "ល្បឿន" : "Speed"}: ${last.wpm} WPM, raw ${last.raw} WPM over ${maxX}s`}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="#e2e8f0" strokeWidth="1" />
              <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#64748b">{t}</text>
            </g>
          ))}
          <text x={PAD.left} y={H - 6} fontSize="11" fill="#64748b">0s</text>
          <text x={W - PAD.right} y={H - 6} fontSize="11" fill="#64748b" textAnchor="end">{maxX}s</text>
          <path d={line("raw")} fill="none" stroke={RAW_COLOR} strokeWidth="2" strokeDasharray="5 4" strokeLinejoin="round" strokeLinecap="round" />
          <path d={line("wpm")} fill="none" stroke={WPM_COLOR} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          {errorAt.map(({ s }) => (
            <path key={s.second} d={`M${x(s.second) - 4},${H - PAD.bottom - 12} l8,8 m0,-8 l-8,8`} stroke={ERROR_COLOR} strokeWidth="2" strokeLinecap="round" />
          ))}
          {/* Direct end labels; values in ink, the line beside them carries identity. */}
          <text x={x(maxX) + 6} y={y(last.wpm) + 4} fontSize="11" fontWeight="700" fill="#0f172a">{last.wpm}</text>
          {Math.abs(y(last.raw) - y(last.wpm)) > 12 && <text x={x(maxX) + 6} y={y(last.raw) + 4} fontSize="11" fill="#64748b">{last.raw}</text>}
          {h && (
            <g pointerEvents="none">
              <line x1={x(h.second)} x2={x(h.second)} y1={PAD.top} y2={H - PAD.bottom} stroke="#94a3b8" strokeWidth="1" />
              <circle cx={x(h.second)} cy={y(h.raw)} r="4" fill={RAW_COLOR} stroke="#fff" strokeWidth="2" />
              <circle cx={x(h.second)} cy={y(h.wpm)} r="4" fill={WPM_COLOR} stroke="#fff" strokeWidth="2" />
            </g>
          )}
          <rect x={PAD.left} y={0} width={W - PAD.left - PAD.right} height={H} fill="transparent" onPointerMove={onMove} onPointerLeave={() => setHover(null)} />
        </svg>
        {h && (
          <div className="pointer-events-none absolute top-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-md" style={{ left: `${(x(h.second) / W) * 100}%`, transform: x(h.second) > W / 2 ? "translateX(calc(-100% - 8px))" : "translateX(8px)" }}>
            <div className="font-bold text-navy">{h.second}s</div>
            <div className="text-navy">WPM <b>{h.wpm}</b></div>
            <div className="text-mute">{km ? "សរុប" : "Raw"} <b>{h.raw}</b></div>
            <div className="text-mute">{km ? "កំហុស" : "Errors"} <b>{h.errors}</b></div>
          </div>
        )}
      </div>
    </figure>
  );
}
