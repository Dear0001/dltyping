import type { GameId } from "@/data/games";

/** Small original illustrations for the game cards. */
export default function GameThumb({ id }: { id: GameId }) {
  if (id === "car-racing") {
    return <svg viewBox="0 0 320 160" className="h-full w-full" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <circle cx="262" cy="34" r="20" fill="#FEF3C7" />
      <path d="M0 96l60-34 50 22 70-40 60 30 80-26v52H0z" fill="#7C2D12" opacity=".35" />
      <rect x="0" y="96" width="320" height="64" fill="#1E293B" />
      {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={10 + i * 68} y="126" width="38" height="4" rx="2" fill="#F8FAFC" opacity=".8" />)}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <rect key={i} x={i * 40} y="92" width="20" height="5" fill={i % 2 ? "#F8FAFC" : "#EF4444"} />)}
      <g transform="translate(150 84)"><path d="M0 22l6-9 22-3 12-12h34l18 13 22 4 4 10v9H0z" fill="#EF4444" /><path d="M32 9l10-9h28l12 10z" fill="#BAE6FD" /><circle cx="26" cy="35" r="10" fill="#0F172A" /><circle cx="26" cy="35" r="4.5" fill="#CBD5E1" /><circle cx="92" cy="35" r="10" fill="#0F172A" /><circle cx="92" cy="35" r="4.5" fill="#CBD5E1" /></g>
      <path d="M150 104l-52 6 52 6z" fill="#FDE047" /><path d="M150 106l-30 4 30 4z" fill="#FB923C" />
      <g transform="translate(22 106)" opacity=".9"><path d="M0 16l4-6 14-2 8-8h22l12 9 14 2 3 7v6H0z" fill="#14B8A6" /><circle cx="17" cy="24" r="7" fill="#0F172A" /><circle cx="60" cy="24" r="7" fill="#0F172A" /></g>
      <rect x="24" y="16" width="118" height="30" rx="10" fill="#0F172A" opacity=".6" /><text x="34" y="37" fontSize="17" fontWeight="800" fill="#34D399">fast<tspan fill="#E2E8F0">er</tspan></text>
    </svg>;
  }
  if (id === "zombie-survival") {
    return <svg viewBox="0 0 320 160" className="h-full w-full" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <circle cx="262" cy="34" r="22" fill="#F1F5F9" opacity=".9" /><circle cx="254" cy="28" r="5" fill="#CBD5E1" />
      <rect x="0" y="118" width="320" height="42" fill="#0F172A" opacity=".55" />
      {[[26, 104], [292, 108]].map(([x, y]) => <path key={x} d={`M${x - 11} ${y + 22}v-20a11 11 0 0122 0v20z`} fill="#64748B" />)}
      {[[70, 96, "#7FB069", "run"], [236, 92, "#93A85A", "type"]].map(([x, y, c, w]) => <g key={String(w)} transform={`translate(${x} ${y})`}>
        <rect x="-12" y="14" width="24" height="30" rx="8" fill="#475569" /><circle cx="0" cy="2" r="13" fill={String(c)} /><circle cx="-5" cy="0" r="2.6" fill="#FEF08A" /><circle cx="5" cy="0" r="2.6" fill="#FEF08A" />
        <rect x={Number(x) < 160 ? 8 : -30} y="18" width="22" height="7" rx="3.5" fill={String(c)} />
        <rect x="-30" y="-40" width="60" height="22" rx="11" fill="#0F172A" opacity=".85" /><text x="0" y="-24" textAnchor="middle" fontSize="14" fontWeight="800" fill="#E2E8F0">{String(w)}</text>
      </g>)}
      <g transform="translate(160 96)"><rect x="-13" y="14" width="26" height="30" rx="8" fill="#2563EB" /><circle cx="0" cy="2" r="13" fill="#F5C99B" /><path d="M-13 0a13 13 0 0126 0z" fill="#B45309" /><rect x="10" y="20" width="26" height="6" rx="2" fill="#0F172A" /></g>
      <path d="M198 119h24" stroke="#FDE047" strokeWidth="3" strokeLinecap="round" strokeDasharray="6 5" />
    </svg>;
  }
  if (id === "battle-arena") {
    return <svg viewBox="0 0 320 160" className="h-full w-full" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <ellipse cx="160" cy="142" rx="190" ry="26" fill="#0F172A" opacity=".5" />
      <g transform="translate(64 60)"><path d="M-22 78q8-44 12-52h20q4 8 12 52z" fill="#4338CA" /><circle cx="0" cy="18" r="11" fill="#F5C99B" /><path d="M-9 22h18l-8 18z" fill="#E5E7EB" /><path d="M-19 12h38l-23-36z" fill="#312E81" /><rect x="-13" y="8" width="26" height="4" fill="#FBBF24" /><path d="M26 78l8-74" stroke="#78350F" strokeWidth="4" /><circle cx="34" cy="0" r="9" fill="#FDBA74" /><circle cx="34" cy="0" r="4" fill="#fff" /></g>
      <circle cx="150" cy="70" r="13" fill="#F97316" /><circle cx="150" cy="70" r="6" fill="#FEF08A" /><path d="M137 70l-34-8 30 14z" fill="#FB923C" opacity=".8" />
      <g transform="translate(236 62)"><path d="M10 26l34-44 10 26-14 4 2 22z" fill="#0F172A" opacity=".55" /><ellipse cx="14" cy="50" rx="34" ry="24" fill="#B91C1C" /><path d="M-6 34q-18-30-36-24l2 16q18-2 22 26z" fill="#B91C1C" /><ellipse cx="-46" cy="16" rx="17" ry="11" fill="#B91C1C" /><path d="M-40 6l8-16 2 16zM-32 8l8-14 1 15z" fill="#FDE68A" /><circle cx="-50" cy="13" r="3" fill="#FEF08A" /><rect x="-4" y="64" width="12" height="16" fill="#B91C1C" /><rect x="24" y="64" width="12" height="16" fill="#B91C1C" /></g>
      <rect x="196" y="20" width="96" height="9" rx="4.5" fill="#0F172A" opacity=".6" /><rect x="196" y="20" width="58" height="9" rx="4.5" fill="#EF4444" />
      <rect x="22" y="14" width="96" height="26" rx="10" fill="#0F172A" opacity=".6" /><text x="70" y="32" textAnchor="middle" fontSize="15" fontWeight="800" fill="#34D399">fla<tspan fill="#E2E8F0">me</tspan></text>
    </svg>;
  }
  if (id === "letter-jump") {
    return <svg viewBox="0 0 320 160" className="h-full w-full" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <circle cx="270" cy="34" r="20" fill="#FDE047" />
      <ellipse cx="60" cy="40" rx="34" ry="12" fill="#fff" opacity=".85" /><ellipse cx="200" cy="26" rx="26" ry="9" fill="#fff" opacity=".7" />
      {[[30, 120, "A"], [120, 92, "S"], [210, 118, "D"]].map(([x, y, c]) => <g key={String(c)}><rect x={Number(x)} y={Number(y)} width="74" height="30" rx="10" fill="#fff" /><rect x={Number(x)} y={Number(y) + 24} width="74" height="6" rx="3" fill="#BFDBFE" /><text x={Number(x) + 37} y={Number(y) + 22} textAnchor="middle" fontSize="22" fontWeight="800" fill="#0F172A">{String(c)}</text></g>)}
      <g transform="translate(134 40)"><path d="M3 30c0-14 7-24 17-24s17 10 17 24c0 8-5 15-17 15S3 38 3 30z" fill="#2563EB" /><circle cx="14" cy="28" r="5" fill="#fff" /><circle cx="26" cy="28" r="5" fill="#fff" /><circle cx="15" cy="29" r="2.4" fill="#0F172A" /><circle cx="27" cy="29" r="2.4" fill="#0F172A" /></g>
    </svg>;
  }
  if (id === "english-quest") {
    return <svg viewBox="0 0 320 160" className="h-full w-full" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <circle cx="262" cy="36" r="22" fill="#FDE047" />
      <path d="M0 150l70-70 40 40 60-80 70 90 80-60v130H0z" fill="#9A3412" opacity=".45" />
      {[[18, 104, "Q"], [104, 80, "W"], [190, 108, "E"]].map(([x, y, c]) => <g key={String(c)}><rect x={Number(x)} y={Number(y)} width="70" height="32" rx="9" fill="#fff" /><rect x={Number(x)} y={Number(y)} width="70" height="7" rx="3" fill="#FDBA74" /><text x={Number(x) + 35} y={Number(y) + 26} textAnchor="middle" fontSize="22" fontWeight="800" fill="#7C2D12">{String(c)}</text></g>)}
      <g transform="translate(112 22)"><rect x="6" y="22" width="22" height="24" rx="8" fill="#0D9488" /><circle cx="17" cy="14" r="10" fill="#F5C99B" /><path d="M2 12c2-9 9-11 15-11s13 2 15 11c-8-3-22-3-30 0z" fill="#F59E0B" /><path d="M6 22c5 5 17 5 22 0l-1 6c-6 3-14 3-20 0z" fill="#DC2626" /></g>
    </svg>;
  }
  if (id === "sentence-rush") {
    return <svg viewBox="0 0 320 160" className="h-full w-full" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <rect x="24" y="30" width="272" height="70" rx="16" fill="#0F172A" opacity=".55" />
      <text x="40" y="62" fontSize="17" fontWeight="700" fill="#34D399">The quick brown fox</text>
      <text x="40" y="86" fontSize="17" fontWeight="700" fill="#E2E8F0">jumps over the <tspan fill="#94A3B8">lazy dog.</tspan></text>
      <rect x="40" y="90" width="9" height="3" rx="1.5" fill="#F472B6" />
      {[0, 1, 2].map((i) => <rect key={i} x={40 + i * 86} y="116" width="74" height="22" rx="11" fill="#fff" opacity={0.9 - i * 0.25} />)}
    </svg>;
  }
  if (id === "word-sprint") {
    return <svg viewBox="0 0 320 160" className="h-full w-full" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <rect x="28" y="38" width="264" height="62" rx="16" fill="#0F172A" opacity=".55" />
      <text x="160" y="82" textAnchor="middle" fontSize="38" fontWeight="800" fill="#fff" letterSpacing="3"><tspan fill="#34D399">key</tspan><tspan fill="#CBD5E1">board</tspan></text>
      {["fast", "type", "win"].map((w, i) => <g key={w}><rect x={40 + i * 88} y="116" width="76" height="26" rx="13" fill="#fff" opacity={0.9 - i * 0.2} /><text x={78 + i * 88} y="134" textAnchor="middle" fontSize="14" fontWeight="700" fill="#1E3A8A">{w}</text></g>)}
      <circle cx="270" cy="20" r="11" fill="#38BDF8" /><path d="M270 13v8l5 3" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>;
  }
  return <svg viewBox="0 0 320 160" className="h-full w-full" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
    <circle cx="260" cy="40" r="24" fill="#FDE047" />
    <path d="M200 150v-46h22l6-30h12l6-30h10l6 30h12l6 30h22v46z" fill="#0F766E" opacity=".55" />
    <rect x="0" y="136" width="320" height="24" fill="#0369A1" opacity=".7" />
    {[[18, 100, "ក"], [104, 78, "ខ"], [184, 104, "គ"]].map(([x, y, c]) => <g key={String(c)}><rect x={Number(x)} y={Number(y)} width="70" height="32" rx="9" fill="#D6D3D1" /><rect x={Number(x)} y={Number(y)} width="70" height="7" rx="3" fill="#86EFAC" /><text x={Number(x) + 35} y={Number(y) + 26} textAnchor="middle" fontSize="22" fontWeight="800" fill="#44403C">{String(c)}</text></g>)}
    <g transform="translate(112 22)"><rect x="6" y="22" width="22" height="24" rx="8" fill="#0D9488" /><circle cx="17" cy="14" r="10" fill="#F5C99B" /><path d="M2 12c2-9 9-11 15-11s13 2 15 11c-8-3-22-3-30 0z" fill="#F59E0B" /><path d="M6 22c5 5 17 5 22 0l-1 6c-6 3-14 3-20 0z" fill="#DC2626" /></g>
  </svg>;
}
