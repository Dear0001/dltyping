/**
 * Small illustrations for the five Space Shooter tutorial steps. Pure SVG drawn
 * to match the in-game look (dark sky, amber lock-on, green typed letters, cyan
 * defence line). Motion is a gentle CSS loop that stops under reduced motion.
 */

/** A word on a ship, with the first `typed` characters shown as typed. Khmer is drawn whole (clusters stay intact). */
function Label({ x, y, word, typed = 0, khmer, locked = false }: { x: number; y: number; word: string; typed?: number; khmer: boolean; locked?: boolean }) {
  const chars = khmer ? [word] : [...word];
  const w = khmer ? 34 : word.length * 7.4 + 10;
  return <g>
    <rect x={x - w / 2} y={y - 9} width={w} height={15} rx={7.5} fill={locked ? "#451a03" : "#0f172a"} stroke={locked ? "#fbbf24" : "#334155"} strokeWidth={1} />
    <text x={x} y={y + 2.5} textAnchor="middle" fontSize={khmer ? 10 : 10.5} fontWeight={700} fontFamily={khmer ? "var(--font-khmer), sans-serif" : "ui-monospace, monospace"}>
      {chars.map((c, i) => <tspan key={i} fill={i < typed || (khmer && typed > 0) ? "#4ade80" : locked && i === typed ? "#fde68a" : "#e2e8f0"}>{c}</tspan>)}
    </text>
  </g>;
}

const Enemy = ({ x, y, color = "#a78bfa" }: { x: number; y: number; color?: string }) => (
  <g transform={`translate(${x} ${y})`}>
    <ellipse cx={0} cy={0} rx={11} ry={4.5} fill={color} />
    <ellipse cx={0} cy={-2.5} rx={5} ry={4} fill="#e0e7ff" opacity={0.85} />
  </g>
);

const Player = ({ x, y }: { x: number; y: number }) => (
  <path transform={`translate(${x} ${y})`} d="M0 -12 L8 8 L0 4 L-8 8 Z" fill="#e2e8f0" stroke="#38bdf8" strokeWidth={1} />
);

const Key = ({ x, y, label, active = false }: { x: number; y: number; label: string; active?: boolean }) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-10} y={-10} width={20} height={20} rx={4} fill={active ? "#fbbf24" : "#1e293b"} stroke={active ? "#fde68a" : "#475569"} />
    <text x={0} y={4} textAnchor="middle" fontSize={11} fontWeight={800} fill={active ? "#0f172a" : "#e2e8f0"} fontFamily="ui-sans-serif, system-ui">{label}</text>
  </g>
);

const Stars = () => <g fill="#cbd5e1" opacity={0.6}>{[[12, 10], [44, 22], [90, 8], [130, 18], [150, 40], [20, 60], [118, 62]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={0.9} />)}</g>;

export default function SpaceTutorialArt({ step, khmer }: { step: number; khmer: boolean }) {
  const words = khmer ? ["ភព", "ផ្កាយ", "ព្រះចន្ទ"] : ["orbit", "comet", "moon"];
  const first = khmer ? "ភ" : "o";
  return <svg viewBox="0 0 160 96" className="ss-tut h-full w-full" role="presentation" aria-hidden="true">
    <rect width={160} height={96} rx={10} fill="#0b1026" />
    <Stars />
    {step === 0 && <>
      <g className="ss-tut-drift"><Enemy x={38} y={22} /><Label x={38} y={36} word={words[0]} khmer={khmer} /></g>
      <g className="ss-tut-drift ss-tut-d2"><Enemy x={84} y={14} color="#f472b6" /><Label x={84} y={28} word={words[1]} khmer={khmer} /></g>
      <g className="ss-tut-drift ss-tut-d3"><Enemy x={128} y={26} color="#fb923c" /><Label x={128} y={40} word={words[2]} khmer={khmer} /></g>
      <Player x={80} y={82} />
    </>}
    {step === 1 && <>
      <Enemy x={62} y={30} />
      <circle className="ss-tut-pulse" cx={62} cy={30} r={17} fill="none" stroke="#fbbf24" strokeWidth={1.5} strokeDasharray="4 3" />
      <Label x={62} y={52} word={words[0]} typed={0} khmer={khmer} locked />
      <Key x={128} y={44} label={first} active />
      <path d="M114 44 H88" stroke="#fbbf24" strokeWidth={1.2} strokeDasharray="3 2" markerEnd="url(#ss-arrow)" />
      <defs><marker id="ss-arrow" viewBox="0 0 6 6" refX={5} refY={3} markerWidth={6} markerHeight={6} orient="auto"><path d="M0 0 L6 3 L0 6 Z" fill="#fbbf24" /></marker></defs>
      <Player x={80} y={84} />
    </>}
    {step === 2 && <>
      <g className="ss-tut-boom"><circle cx={80} cy={24} r={10} fill="#fdba74" opacity={0.85} /><circle cx={80} cy={24} r={5} fill="#fef08a" /></g>
      <Label x={80} y={44} word={words[0]} typed={words[0].length} khmer={khmer} />
      <line className="ss-tut-laser" x1={80} y1={72} x2={80} y2={30} stroke="#f0abfc" strokeWidth={2.5} strokeLinecap="round" />
      <Player x={80} y={82} />
    </>}
    {step === 3 && <>
      <line x1={8} x2={152} y1={66} y2={66} stroke="#22d3ee" strokeWidth={2} opacity={0.9} />
      <line x1={8} x2={152} y1={66} y2={66} stroke="#22d3ee" strokeWidth={6} opacity={0.18} />
      <g className="ss-tut-fall"><Enemy x={48} y={56} color="#f87171" /></g>
      <text x={58} y={80} fontSize={10} fontWeight={800} fill="#fca5a5">−10</text>
      <Enemy x={112} y={26} color="#94a3b8" />
      <g transform="translate(112 40)"><circle r={3} fill="#f87171" className="ss-tut-pulse" /></g>
      <Player x={80} y={88} />
    </>}
    {step === 4 && <>
      <Key x={44} y={40} label="1" active /><Key x={80} y={40} label="2" /><Key x={116} y={40} label="3" />
      <text x={44} y={68} textAnchor="middle" fontSize={15}>🛡️</text>
      <text x={80} y={68} textAnchor="middle" fontSize={15}>🔥</text>
      <text x={116} y={68} textAnchor="middle" fontSize={15}>🔆</text>
      <circle className="ss-tut-pulse" cx={44} cy={62} r={13} fill="none" stroke="#7dd3fc" strokeWidth={1.4} />
    </>}
  </svg>;
}
