"use client";

import type { CSSProperties } from "react";
import type { Ultimate } from "@/lib/pets/pet-catalog";
import "./ultimate.css";

/** Where one cast happens, in screen pixels. Worked out when the cast starts. */
export type UltimateRun = {
  id: number;
  cfg: Ultimate;
  /** Centre of the pet and its size. */
  cx: number;
  cy: number;
  size: number;
  /** Mouth position, beam direction (1 right, -1 left) and how far the beam reaches. */
  mx: number;
  my: number;
  dir: 1 | -1;
  length: number;
};

const css = (vars: Record<string, string | number>) => vars as CSSProperties;
const spread = (n: number) => Array.from({ length: n }, (_, i) => i);
/** Deterministic pseudo-random in [0,1): rendering stays pure and every cast looks the same. */
const rnd = (i: number, salt: number) => {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * The cinematic, in two layers so the pet stands between them: a magic circle behind it, and everything else in front.
 * Every element is timed by its own CSS animation against one 7.2s timeline (see ultimate.css). Nothing here takes pointer events.
 */
export default function PetUltimate({ run }: { run: UltimateRun }) {
  const { cfg, cx, cy, size, mx, my, dir, length } = run;
  const ix = mx + dir * length;
  const lift = (cfg.lift ?? 0) * size;
  // The galaxy of a supernova forms above the lifted pet; the magic circle follows the pet up.
  const gy = cfg.transform === "tails" ? cy - size * 0.2 : cy - lift - size * 1.9;
  const vars = css({
    "--u-c": cfg.color, "--u-c2": cfg.color2, "--ps": `${size}px`, "--dir": dir,
    "--cx": `${cx}px`, "--cy": `${cy}px`, "--mx": `${mx}px`, "--my": `${my}px`, "--ix": `${ix}px`, "--len": `${length}px`, "--ccy": `${cfg.transform === "tails" ? cy + size * 0.45 : cy - lift * 0.85}px`, "--gy": `${gy}px`,
  });
  const glyph = (i: number) => cfg.glyphs[i % cfg.glyphs.length];
  return (
    <>
      <div className="pet-ult pet-ult-back" style={vars} data-dir={dir} data-beam={cfg.beam} data-finale={cfg.finale} aria-hidden="true">
        {cfg.transform === "tails" && <div className="u-dark" />}
        <div className="u-aura" />
        {cfg.transform === "frost" && (
          // Frostbite's transformation: huge ice wings unfold behind it and a crown of crystals rises around it.
          <svg className="u-frost" viewBox="-100 -100 200 200">
            <defs>
              <linearGradient id={`uf-${run.id}`} x1="0" y1="0" x2="0" y2="-1">
                <stop offset="0" stopColor={cfg.color2} stopOpacity=".95" /><stop offset=".6" stopColor={cfg.color} stopOpacity=".7" /><stop offset="1" stopColor="#fff" stopOpacity=".15" />
              </linearGradient>
            </defs>
            {[-1, 1].map((side) => (
              <g key={side} className="u-iwing" style={css({ "--side": side })} transform={`translate(0,-8) scale(${side},1)`}>
                {spread(6).map((k) => (
                  <path key={k} className="u-iblade" style={css({ "--k": k })} transform={`rotate(${-52 - k * 17})`} d={`M0,0 L-${9 + k},-${60 + (k % 3) * 10} L0,-${96 - k * 3} L${10 + k},-${58 + (k % 2) * 8}Z`} fill={`url(#uf-${run.id})`} />
                ))}
              </g>
            ))}
            <g className="u-crown">
              {spread(12).map((k) => (
                <path key={k} className="u-crystal" style={css({ "--k": k })} transform={`rotate(${k * 30}) translate(0,-70)`} d="M0,0 L-6,-14 L0,-34 L6,-14Z" fill={`url(#uf-${run.id})`} />
              ))}
            </g>
          </svg>
        )}
        {cfg.transform === "tails" && (
          // Kira's transformation: nine long magic tails grow out and wrap around her, tipped with orbiting foxfire.
          <svg className="u-tails" viewBox="-100 -100 200 200">
            <defs>
              <linearGradient id={`ut-${run.id}`} x1="0" y1="0" x2="0" y2="-1" gradientUnits="objectBoundingBox">
                <stop offset="0" stopColor={cfg.color2} stopOpacity=".95" /><stop offset=".55" stopColor={cfg.color} stopOpacity=".75" /><stop offset="1" stopColor={cfg.color} stopOpacity="0" />
              </linearGradient>
            </defs>
            <g className="u-tails-spin">
              {spread(9).map((i) => (
                <g key={i} transform={`rotate(${i * 40})`}>
                  <g className="u-tail" style={css({ "--i": i })}>
                    <path d={i % 2 ? "M0,-6 C22,-36 34,-70 6,-98 C-2,-66 -12,-36 0,-6Z" : "M0,-6 C-22,-36 -34,-70 -6,-98 C2,-66 12,-36 0,-6Z"} fill={`url(#ut-${run.id})`} />
                    <circle className="u-tail-tip" cx={i % 2 ? 6 : -6} cy="-98" r="4.5" />
                  </g>
                </g>
              ))}
            </g>
          </svg>
        )}
        <div className={cfg.transform === "tails" ? "u-flat" : "u-flat0"}>
        <svg className="u-circle" viewBox="-100 -100 200 200">
          <g className="u-spin">
            <circle r="96" /><circle r="84" strokeDasharray="3 7" /><circle r="62" />
            {spread(24).map((i) => <line key={i} x1="0" y1="-84" x2="0" y2={i % 2 ? "-90" : "-96"} transform={`rotate(${i * 15})`} />)}
            <polygon points="0,-62 54,31 -54,31" /><polygon points="0,62 54,-31 -54,-31" />
          </g>
          <g className="u-spin-rev"><circle r="40" strokeDasharray="10 6" /><circle r="22" /></g>
        </svg>
        </div>
      </div>
      <div className="pet-ult pet-ult-front" style={vars} data-dir={dir} data-beam={cfg.beam} data-finale={cfg.finale} aria-hidden="true">
        {/* 1. Charging: energy gathers at the mouth. */}
        <div className="u-charge">
          {spread(14).map((i) => (
            <i key={i} style={css({ "--a": `${(i * 360) / 14 + rnd(i, 1) * 20}deg`, "--r": `${size * (0.9 + rnd(i, 2) * 0.8)}px`, "--d": `${-rnd(i, 3) * 0.6}s` })} />
          ))}
        </div>
        <div className="u-orb"><i /><i /><i /></div>
        {/* 2. Activation: glyphs and crystals swirl around the pet. */}
        <div className="u-swirl">
          {spread(18).map((i) => (
            <span key={i} style={css({ "--a": `${(i * 360) / 18}deg`, "--r": `${size * (0.65 + (i % 3) * 0.28)}px`, "--d": `${-(i % 6) * 0.23}s`, "--s": 0.7 + rnd(i, 4) * 0.8 })}><b>{glyph(i)}</b></span>
          ))}
        </div>
        {/* 3. The beam. */}
        <div className="u-beam" style={css({ "--thick": `${size * 0.6}px` })}><i className="u-beam-glow" /><i className="u-beam-core" /><i className="u-beam-flow" /></div>
        {/* 4. Impact. */}
        <div className="u-impact" style={css({ "--ix": `${ix}px` })}>
          <i className="u-boom" />
          {spread(3).map((i) => <i key={i} className="u-ring" style={css({ "--d": `${i * 0.18}s` })} />)}
          {spread(18).map((i) => (
            <span key={i} className="u-shard" style={css({ "--a": `${(i * 360) / 18 + rnd(i, 5) * 14}deg`, "--dist": `${size * (1.4 + rnd(i, 6) * 2.4)}px`, "--w": `${size * (0.08 + rnd(i, 7) * 0.1)}px`, "--h": `${size * (0.28 + rnd(i, 8) * 0.34)}px` })} />
          ))}
          {spread(8).map((i) => (
            <span key={i} className="u-chunk" style={css({ "--a": `${(i * 360) / 8 + 20}deg`, "--dist": `${size * (1 + rnd(i, 9) * 1.6)}px` })}><b>{glyph(i)}</b></span>
          ))}
        </div>
        <div className="u-flash" />
        {/* 5. Finale: the wave sweeps the screen and the weather takes over. */}
        <div className="u-wave" />
        <div className="u-tint" />
        {cfg.transform === "tails" && (
          // Kitsune Ascension: lightning strikes around her, nine spirit flames ring above, then everything detonates.
          <>
            {spread(6).map((i) => (
              <svg key={i} className="u-bolt" viewBox="0 0 20 100" style={css({ "--bx": `${[-2.3, -1.45, 1.4, 2.25, -0.5, 0.65][i]}`, "--bd": `${i * 0.37}s` })}>
                <polyline points={`10,0 ${6 + rnd(i, 60) * 8},22 ${5 + rnd(i, 61) * 10},38 ${6 + rnd(i, 62) * 8},58 ${5 + rnd(i, 63) * 10},78 10,100`} />
              </svg>
            ))}
            <div className="u-flames9">{spread(9).map((i) => <i key={i} style={css({ "--a": `${-96 + i * 24}deg`, "--fd": `${-i * 0.13}s` })} />)}</div>
            <i className="u-nova-blast" />
            {spread(3).map((i) => <i key={i} className="u-nova-ring" style={css({ "--d": `${i * 0.2}s` })} />)}
          </>
        )}
        {cfg.transform === "galaxy" && (
          // Supernova Dominion: a miniature galaxy forms above the pet, lights the page, then detonates.
          <>
            <div className="u-galaxy-light" />
            <svg className="u-galaxy" viewBox="-100 -100 200 200">
              <defs>
                <radialGradient id={`ug-${run.id}`}><stop offset="0" stopColor="#fff" /><stop offset=".25" stopColor={cfg.color2} /><stop offset=".6" stopColor={cfg.color} stopOpacity=".7" /><stop offset="1" stopColor="#2563eb" stopOpacity="0" /></radialGradient>
              </defs>
              <circle r="96" fill={`url(#ug-${run.id})`} opacity=".55" />
              <g className="u-galaxy-spin">
                {spread(3).map((arm) => (
                  <polyline key={arm} fill="none" strokeLinecap="round" stroke={["#a78bfa", "#60a5fa", cfg.color2][arm]} strokeWidth={3.2} opacity=".9"
                    points={spread(34).map((k) => { const r = 6 + k * 2.7, a = ((arm * 120 + k * 11) * Math.PI) / 180; return `${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r * 0.82).toFixed(1)}`; }).join(" ")} />
                ))}
                {spread(46).map((k) => { const r = 10 + rnd(k, 20) * 84, a = rnd(k, 21) * Math.PI * 2; return <circle key={k} cx={(Math.cos(a) * r).toFixed(1)} cy={(Math.sin(a) * r * 0.82).toFixed(1)} r={0.8 + rnd(k, 22) * 1.8} fill="#fff" className="u-galaxy-star" style={css({ "--k": k })} />; })}
              </g>
              <circle r="9" fill="#fff" />
            </svg>
            {spread(3).map((i) => <i key={i} className="u-nova-ring" style={css({ "--d": `${i * 0.2}s` })} />)}
            <i className="u-nova-blast" />
          </>
        )}
        <div className="u-extra">{spread(6).map((i) => <i key={i} style={css({ "--i": i })} />)}</div>
        <div className="u-weather">
          {spread(42).map((i) => (
            <span key={i} style={css({ "--x": `${rnd(i, 10) * 100}%`, "--dl": `${rnd(i, 11) * 2.2}s`, "--dur": `${1.5 + rnd(i, 12) * 1.6}s`, "--fs": `${10 + rnd(i, 13) * 18}px`, "--sway": `${(rnd(i, 14) - 0.5) * 160}px` })}>{i % 3 === 0 ? glyph(i) : ""}</span>
          ))}
        </div>
        <div className="u-title">{cfg.name}</div>
      </div>
    </>
  );
}
