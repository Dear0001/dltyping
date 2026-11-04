"use client";

import type { CSSProperties } from "react";
import "./ability.css";

/** Where an ability plays, in screen pixels (worked out when it starts). */
export type AbilityRun = {
  id: number;
  key: string;
  seconds: number;
  cx: number;
  cy: number;
  size: number;
  mx: number;
  my: number;
  dir: 1 | -1;
  length: number;
  /** Where a flight ends (x of the pet's centre). */
  tx: number;
  /** The caster's colours (glow and bright accent). */
  color: string;
  color2: string;
  /** The pet's image, for afterimages and clones. */
  file: string;
};

const css = (vars: Record<string, string | number>) => vars as CSSProperties;
const spread = (n: number) => Array.from({ length: n }, (_, i) => i);
const rnd = (i: number, salt: number) => {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const STAR = ["✦", "✧", "⭐", "✨"];

/**
 * Cinematics for a pet's abilities. Each ability is a few elements timed by CSS against one `--dur` timeline (see ability.css),
 * drawn over the page, never taking pointer events. The pet's own pose is handled by the pet brain and CSS on the sprite.
 */
export default function PetAbility({ run }: { run: AbilityRun }) {
  const { key, size, cx, cy, mx, my, dir, length, seconds, tx, file } = run;
  // Phantom Dash: a jagged spirit-lightning line from where Kira was to where she lands.
  const dashX = Math.min(cx, tx), dashW = Math.max(40, Math.abs(tx - cx));
  const zig = spread(14).map((i) => `${(i / 13) * 100},${10 + (i === 0 || i === 13 ? 0 : (rnd(i, 50) - 0.5) * 8) + 0}`).join(" ");
  const vars = css({
    "--dur": `${seconds}s`, "--ps": `${size}px`, "--dir": dir, "--cx": `${cx}px`, "--cy": `${cy}px`,
    "--mx": `${mx}px`, "--my": `${my}px`, "--len": `${Math.min(length, 560)}px`, "--tx": `${tx}px`, "--a1": run.color, "--a2": run.color2,
  });
  return (
    <div className={`pet-abil a-${key}`} style={vars} data-dir={dir} aria-hidden="true">
      {(key === "galaxy_bolt" || key === "spirit_flame") && (
        <>
          <div className="a-gather">{spread(12).map((i) => <i key={i} style={css({ "--a": `${i * 30}deg`, "--r": `${size * (0.8 + rnd(i, 1) * 0.6)}px`, "--d": `${-rnd(i, 2) * 0.4}s` })} />)}</div>
          <div className="a-orb"><i /><i /></div>
          <i className="a-trail" />
          <div className="a-bolt"><b>{key === "spirit_flame" ? "🔥" : "✦"}</b></div>
          <div className="a-boom">
            <svg viewBox="-50 -50 100 100"><g className="a-star"><polygon points="0,-48 9,-9 48,0 9,9 0,48 -9,9 -48,0 -9,-9" /><polygon points="0,-34 6,-6 34,0 6,6 0,34 -6,6 -34,0 -6,-6" transform="rotate(45)" /></g></svg>
            {spread(10).map((i) => <span key={i} style={css({ "--a": `${i * 36}deg`, "--dist": `${size * (0.9 + rnd(i, 3) * 1.1)}px` })}>{STAR[i % 4]}</span>)}
          </div>
        </>
      )}
      {key === "foxfire_storm" && (
        <>
          <i className="k-ring k-ring1" /><i className="k-ring k-ring2" />
          <div className="k-storm">{spread(9).map((i) => <i key={i} className="k-flame" style={css({ "--a": `${i * 40}deg`, "--r": `${size * (0.95 + (i % 3) * 0.3)}px`, "--d": `${-i * 0.14}s`, "--dir2": i % 2 ? 1 : -1 })} />)}</div>
          <div className="k-sparks">{spread(18).map((i) => <span key={i} style={css({ "--a": `${i * 20}deg`, "--r": `${size * (0.8 + rnd(i, 51) * 0.9)}px`, "--d": `${-rnd(i, 52) * 1.6}s`, "--fs": `${size * (0.1 + rnd(i, 53) * 0.1)}px` })}>{["✦", "✧", "•"][i % 3]}</span>)}</div>
        </>
      )}
      {key === "phantom_dash" && (
        <>
          <i className="k-flash k-flash-a" />
          <i className="k-flash k-flash-b" />
          <svg className="k-streak" viewBox="0 0 100 20" preserveAspectRatio="none" style={css({ left: `${dashX}px`, width: `${dashW}px` })}>
            <polyline points={zig} /><polyline points={zig} className="k-streak2" />
          </svg>
          {[0.18, 0.4, 0.64, 0.86].map((f, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} className="k-ghost" src={`/images/${file}`} alt="" draggable={false} style={css({ left: `${cx + (tx - cx) * f - size / 2}px`, "--gd": `${(0.18 + i * 0.07) * seconds}s` })} />
          ))}
          <div className="k-trail">{spread(14).map((i) => <span key={i} style={css({ left: `${cx + (tx - cx) * (i / 13)}px`, "--d": `${(0.25 + (i / 13) * 0.2) * seconds}s`, "--y": `${(rnd(i, 54) - 0.5) * size * 0.9}px` })}>{["✦", "⚡", "✧"][i % 3]}</span>)}</div>
        </>
      )}
      {key === "nine_tail_illusion" && (
        <>
          <i className="k-ring k-ring1" />
          <div className="k-clones">
            {spread(9).map((i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} className="k-clone" src={`/images/${file}`} alt="" draggable={false} style={css({ "--a": `${i * 40}deg`, "--r": `${size * (1.5 + (i % 3) * 0.25)}px`, "--turn": `${i % 2 ? 80 : -80}deg`, "--d": `${i * 0.05}s` })} />
            ))}
          </div>
          <div className="k-motes">{spread(36).map((i) => <span key={i} style={css({ "--a": `${i * 10}deg`, "--dist": `${size * (1.4 + rnd(i, 55) * 1.8)}px`, "--fs": `${size * (0.08 + rnd(i, 56) * 0.1)}px` })}>{["✦", "✧", "•"][i % 3]}</span>)}</div>
        </>
      )}
      {key === "frost_breath" && (
        <>
          <div className="a-gather">{spread(12).map((i) => <i key={i} style={css({ "--a": `${i * 30}deg`, "--r": `${size * (0.8 + rnd(i, 1) * 0.6)}px`, "--d": `${-rnd(i, 2) * 0.4}s` })} />)}</div>
          <div className="a-orb"><i /><i /></div>
          <i className="f-cone" />
          <div className="f-flakes">{spread(26).map((i) => <span key={i} style={css({ "--y": `${(rnd(i, 30) - 0.5) * size * 1.5}px`, "--d": `${rnd(i, 31) * 0.7}s`, "--fs": `${size * (0.12 + rnd(i, 32) * 0.14)}px` })}>{["❄", "❅", "✦"][i % 3]}</span>)}</div>
          <div className="a-boom">
            <svg viewBox="-50 -50 100 100"><g className="a-star"><polygon points="0,-48 9,-9 48,0 9,9 0,48 -9,9 -48,0 -9,-9" /><polygon points="0,-34 6,-6 34,0 6,6 0,34 -6,6 -34,0 -6,-6" transform="rotate(45)" /></g></svg>
            {spread(10).map((i) => <span key={i} style={css({ "--a": `${i * 36}deg`, "--dist": `${size * (0.9 + rnd(i, 3) * 1.1)}px` })}>{["❄", "❅", "✦", "◆"][i % 4]}</span>)}
          </div>
        </>
      )}
      {key === "ice_shield" && (
        <>
          <i className="a-glow" />
          <div className="a-shield">
            <div className="a-ring">{spread(8).map((i) => <span key={i} style={css({ "--a": `${i * 45}deg` })}>{i % 2 ? "❅" : "❄"}</span>)}</div>
          </div>
          {[0, 1, 2].map((i) => (
            <div key={i} className="a-hit" style={css({ "--a": `${[-38, 22, 150][i]}deg`, "--at": `${[0.42, 0.55, 0.68][i] * seconds}s` })}><b>✦</b><i /></div>
          ))}
        </>
      )}
      {key === "blizzard_storm" && (
        <>
          <i className="f-chill" />
          <div className="f-orbit">{spread(22).map((i) => <span key={i} style={css({ "--a": `${i * (360 / 22)}deg`, "--r": `${size * (1.1 + (i % 4) * 0.35)}px`, "--d": `${-(i % 7) * 0.2}s`, "--fs": `${size * (0.14 + rnd(i, 40) * 0.12)}px` })}>{["❄", "❅", "✦"][i % 3]}</span>)}</div>
          <div className="f-snow">{spread(64).map((i) => <span key={i} style={css({ "--y": `${rnd(i, 41) * 100}%`, "--dl": `${rnd(i, 42) * seconds * 0.5}s`, "--dur": `${0.9 + rnd(i, 43) * 1.1}s`, "--fs": `${8 + rnd(i, 44) * 16}px`, "--drop": `${(rnd(i, 45) - 0.3) * 160}px` })}>{i % 3 === 0 ? "❄" : ""}</span>)}</div>
          <div className="f-streaks">{spread(12).map((i) => <i key={i} style={css({ "--y": `${6 + i * 8}%`, "--dl": `${rnd(i, 46) * seconds * 0.4}s` })} />)}</div>
        </>
      )}
      {key === "frozen_prison" && (
        <>
          <i className="f-mist" />
          <div className="f-prison">
            <i className="f-captive" />
            <i className="f-block" />
            {spread(7).map((i) => <i key={i} className="f-spike" style={css({ "--k": i, "--h": `${78 + (i % 3) * 14}%` })} />)}
            {spread(14).map((i) => <span key={i} className="f-shard" style={css({ "--a": `${i * (360 / 14)}deg`, "--dist": `${size * (0.9 + rnd(i, 47) * 1.5)}px` })} />)}
          </div>
        </>
      )}
      {key === "celestial_wings" && (
        <>
          <i className="a-glow" />
          <div className="a-shield">
            <div className="a-ring">{spread(8).map((i) => <span key={i} style={css({ "--a": `${i * 45}deg` })}>{i % 2 ? "✧" : "✦"}</span>)}</div>
          </div>
          {[0, 1, 2].map((i) => (
            <div key={i} className="a-hit" style={css({ "--a": `${[-38, 22, 150][i]}deg`, "--at": `${[0.42, 0.55, 0.68][i] * seconds}s` })}><b>✦</b><i /></div>
          ))}
        </>
      )}
      {key === "cosmic_flight" && (
        <>
          <i className="a-portal" />
          <div className="a-launch">{spread(10).map((i) => <span key={i} style={css({ "--x": `${(rnd(i, 4) - 0.5) * size * 1.4}px`, "--d": `${rnd(i, 5) * 0.4}s` })}>{STAR[i % 4]}</span>)}</div>
          <i className="a-portal a-portal-exit" />
        </>
      )}
      {key === "nebula_vortex" && (
        <>
          <i className="a-mini" />
          <i className="a-wave" />
          <div className="a-vortex"><i className="a-arm" /><i className="a-arm a-arm2" /><i className="a-eye" /></div>
          <div className="a-pull">{spread(16).map((i) => <span key={i} style={css({ "--a": `${i * 22.5}deg`, "--r": `${size * (1.5 + rnd(i, 6) * 1.2)}px`, "--d": `${-rnd(i, 7) * 1.2}s` })}>{STAR[i % 4]}</span>)}</div>
          <i className="a-core" />
        </>
      )}
      {key === "starlight_blessing" && (
        <>
          <i className="a-pillar" />
          <i className="a-aura" />
          <div className="a-rain">{spread(28).map((i) => <span key={i} style={css({ "--x": `${(rnd(i, 8) - 0.5) * size * 5.5}px`, "--dl": `${rnd(i, 9) * seconds * 0.45}s`, "--fall": `${size * (1.6 + rnd(i, 10))}px`, "--fs": `${size * (0.12 + rnd(i, 11) * 0.12)}px` })}>{STAR[i % 4]}</span>)}</div>
        </>
      )}
      {key === "astral_sight" && (
        <>
          <i className="a-gaze a-gaze1" /><i className="a-gaze a-gaze2" />
          <div className="a-orbit">{spread(6).map((i) => <span key={i} style={css({ "--a": `${i * 60}deg`, "--d": `${-i * 0.3}s` })}>{STAR[i % 4]}</span>)}</div>
          {[0, 1, 2, 3].map((i) => <i key={i} className="a-scan" style={css({ "--at": `${(0.25 + i * 0.13) * seconds}s` })} />)}
        </>
      )}
    </div>
  );
}
