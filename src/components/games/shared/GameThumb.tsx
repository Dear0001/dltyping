import type { GameId } from "@/data/games";

/** Small original illustrations for the game cards. */
export default function GameThumb({ id }: { id: GameId }) {
  if (id === "letter-jump") {
    return <svg viewBox="0 0 320 160" className="h-full w-full" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <circle cx="270" cy="34" r="20" fill="#FDE047" />
      <ellipse cx="60" cy="40" rx="34" ry="12" fill="#fff" opacity=".85" /><ellipse cx="200" cy="26" rx="26" ry="9" fill="#fff" opacity=".7" />
      {[[30, 120, "A"], [120, 92, "S"], [210, 118, "D"]].map(([x, y, c]) => <g key={String(c)}><rect x={Number(x)} y={Number(y)} width="74" height="30" rx="10" fill="#fff" /><rect x={Number(x)} y={Number(y) + 24} width="74" height="6" rx="3" fill="#BFDBFE" /><text x={Number(x) + 37} y={Number(y) + 22} textAnchor="middle" fontSize="22" fontWeight="800" fill="#0F172A">{String(c)}</text></g>)}
      <g transform="translate(134 40)"><path d="M3 30c0-14 7-24 17-24s17 10 17 24c0 8-5 15-17 15S3 38 3 30z" fill="#2563EB" /><circle cx="14" cy="28" r="5" fill="#fff" /><circle cx="26" cy="28" r="5" fill="#fff" /><circle cx="15" cy="29" r="2.4" fill="#0F172A" /><circle cx="27" cy="29" r="2.4" fill="#0F172A" /></g>
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
