import { codepoints } from "@/lib/khmer-unicode";
import { getCharStates } from "@/lib/typing-engine";
import type { Language } from "@/types";
import Hero, { type HeroVariant } from "./Hero";

const SPACING = 148;
const PLAT_W = 104;
const PLAT_H = 50;
const BASE = 84;
const ANCHOR = 56;
const Y_OFFSETS = [0, 34, 10, 46, 22];
const yOf = (i: number) => Y_OFFSETS[i % Y_OFFSETS.length];

export type SceneTheme = "sky" | "temple";

type Props = {
  theme: SceneTheme;
  units: readonly string[];
  /** Index of the platform the hero stands on (the target is on this platform). */
  index: number;
  /** Code points of the current unit already typed. */
  typed: number;
  /** Number of target platforms; a finish gate is drawn after the last one. Omit for endless play. */
  total?: number;
  jumpKey: number;
  errorKey: number;
  language: Language;
  hero: HeroVariant;
  stumble?: boolean;
};

/** Side-scrolling scene shared by Letter Jump and Mario Khmer Quest. */
export default function GameScene({ theme, units, index, typed, total, jumpKey, errorKey, language, hero }: Props) {
  const temple = theme === "temple";
  const from = Math.max(0, index - 1);
  const to = total !== undefined ? Math.min(total, index + 5) : index + 5;
  const slots: number[] = [];
  for (let i = from; i <= to; i++) slots.push(i);
  const khmer = language === "khmer";

  return <div className={`gm-scene relative h-[330px] overflow-hidden rounded-3xl border border-slate-200 shadow-sm sm:h-[380px] ${temple ? "gm-scene-temple" : "gm-scene-sky"}`} role="img" aria-label={`Game scene. Current target: ${units[index] ?? ""}`}>
    {temple ? <>
      <div className="gm-sun" />
      <svg className="gm-parallax absolute bottom-16 left-0 h-48 w-[1600px] text-teal-900/40" style={{ transform: `translateX(${-index * 14}px)` }} viewBox="0 0 1600 190" preserveAspectRatio="none" aria-hidden="true">
        {[60, 520, 980, 1400].map((x, n) => <g key={x} fill="currentColor"><path d={`M${x} 190v-50h30l8-40h14l8-40h14l8 40h14l8 40h30v50z`} /><path d={`M${x + 40} 100v-40h4v-30h6v30h4v40z`} opacity=".8" /><rect x={x + 100 + n} y="150" width="6" height="40" /></g>)}
      </svg>
      <div className="gm-water absolute inset-x-0 bottom-0 h-16" />
    </> : <>
      <div className="gm-sun" />
      <div className="gm-cloud gm-cloud-a" /><div className="gm-cloud gm-cloud-b" /><div className="gm-cloud gm-cloud-c" />
    </>}

    <div className="gm-world absolute bottom-0 left-0 top-0" style={{ transform: `translateX(${ANCHOR - index * SPACING}px)` }}>
      {slots.map((i) => {
        const isFinish = total !== undefined && i === total;
        const left = i * SPACING;
        const bottom = BASE + yOf(i);
        if (isFinish) {
          return <div key={i} className="absolute flex flex-col items-center" style={{ left, bottom, width: PLAT_W }}>
            <svg viewBox="0 0 80 90" className="h-24 w-20" aria-label="Finish gate"><path d="M6 88V44h68v44z" fill="#475569" /><path d="M14 44c0-24 12-34 26-34s26 10 26 34z" fill="#64748B" /><path d="M40 4v14M34 10h12" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" /><rect x="30" y="56" width="20" height="32" rx="10" fill="#0F172A" /><path d="M14 44h52" stroke="#F59E0B" strokeWidth="3" /></svg>
            <div className={`h-3 rounded-full ${temple ? "bg-stone-500" : "bg-white"}`} style={{ width: PLAT_W }} />
          </div>;
        }
        const unit = units[i];
        const passed = i < index;
        const current = i === index;
        const states = unit === undefined ? [] : getCharStates(unit, current ? codepoints(unit).slice(0, typed) : [], language);
        return <div key={i}>
          {i > 0 && temple && <svg className="absolute" style={{ left: left - SPACING + PLAT_W + 6, bottom: 8, width: SPACING - PLAT_W - 12, height: 34 }} viewBox="0 0 40 34" preserveAspectRatio="none" aria-hidden="true"><path d="M0 34l5-24 5 24 5-24 5 24 5-24 5 24 5-24 5 24z" fill="#475569" /></svg>}
          {!passed && temple && <span className="gm-coin absolute" style={{ left: left + PLAT_W / 2 - 9, bottom: bottom + PLAT_H + 70 }} aria-hidden="true" />}
          <div
            className={`absolute flex items-center justify-center rounded-2xl border-b-[6px] text-center font-bold transition-all duration-300 ${passed ? "opacity-50" : ""} ${temple ? "border-stone-600 bg-stone-300 text-stone-800 shadow-[inset_0_6px_0_#86EFAC]" : "border-blue-200 bg-white text-navy"} ${current ? "scale-110 ring-4 ring-accent" : ""}`}
            style={{ left, bottom, width: PLAT_W, height: PLAT_H }}
          >
            <span className={`${khmer ? "font-khmer text-[26px]" : "text-[28px]"} leading-none`}>
              {states.map((s, n) => <span key={n} className={s.state === "correct" ? "text-good" : s.state === "partial" ? "text-brand" : ""}>{s.text}</span>)}
            </span>
          </div>
        </div>;
      })}
      <div className="absolute z-10 transition-[left,bottom] duration-300 ease-out" style={{ left: index * SPACING + PLAT_W / 2 - 28, bottom: heroBottom(index) }}>
        <div key={`s${errorKey}`} className={errorKey > 0 ? "gm-shake" : ""}>
          <div key={`j${jumpKey}`} className={jumpKey > 0 ? "gm-hop" : ""}><Hero variant={hero} className="h-16 w-14" /></div>
        </div>
      </div>
    </div>
    {errorKey > 0 && <div key={`f${errorKey}`} className="gm-flash pointer-events-none absolute inset-0 rounded-3xl ring-4 ring-inset ring-bad" aria-hidden="true" />}
  </div>;
}

function heroBottom(index: number) {
  return BASE + yOf(index) + PLAT_H - 2;
}
