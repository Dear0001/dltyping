/**
 * Generated (Web Audio) sound effects for the legendary pets' skills: the click bolt ("magic"), every ability and every
 * ultimate. Nothing is downloaded. Each recipe is a few oscillators and noise bursts timed to the skill's animation.
 * Browsers only allow audio after a click or key press, so `unlockAudio()` is called once on the first interaction.
 */

let ctx: AudioContext | null = null;
let bus: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;
let active: GainNode[] = [];
const MAX_ACTIVE = 4;

function context(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    try { ctx = new Ctor(); } catch { return null; }
    const limiter = ctx.createDynamicsCompressor(); // keeps layered skills from clipping
    bus = ctx.createGain();
    bus.gain.value = 0.55;
    bus.connect(limiter);
    limiter.connect(ctx.destination);
  }
  return ctx;
}

/** Call from a user gesture (pointer/key). Safe to call repeatedly. */
export function unlockAudio() {
  const c = context();
  if (c && c.state === "suspended") void c.resume().catch(() => undefined);
}

/** Cuts every skill sound that is still playing (used when sound is switched off). */
export function stopPetSounds() {
  if (!ctx) return;
  const t = ctx.currentTime;
  for (const g of active) { try { g.gain.cancelScheduledValues(t); g.gain.setTargetAtTime(0, t, 0.05); } catch { /* already gone */ } }
  active = [];
}

type Out = { c: AudioContext; out: GainNode };

function noise(c: AudioContext) {
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuf;
}

/** Pitched sound: a sweep from f0 to f1 with a soft attack and fade. */
function tone({ c, out }: Out, t: number, dur: number, f0: number, f1: number, vol = 0.3, type: OscillatorType = "sine", attack = 0.02) {
  const o = c.createOscillator(), g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(Math.max(20, f0), c.currentTime + t);
  o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), c.currentTime + t + dur);
  g.gain.setValueAtTime(0.0001, c.currentTime + t);
  g.gain.linearRampToValueAtTime(vol, c.currentTime + t + Math.min(attack, dur / 2));
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + t + dur);
  o.connect(g); g.connect(out);
  o.start(c.currentTime + t); o.stop(c.currentTime + t + dur + 0.05);
}

/** Filtered noise: wind, fire, breath, crackle. The filter sweeps from f0 to f1. */
function hiss({ c, out }: Out, t: number, dur: number, f0: number, f1: number, vol = 0.25, type: BiquadFilterType = "bandpass", q = 1, attack = 0.05) {
  const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  s.buffer = noise(c); s.loop = true;
  f.type = type; f.Q.value = q;
  f.frequency.setValueAtTime(Math.max(20, f0), c.currentTime + t);
  f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), c.currentTime + t + dur);
  g.gain.setValueAtTime(0.0001, c.currentTime + t);
  g.gain.linearRampToValueAtTime(vol, c.currentTime + t + Math.min(attack, dur / 2));
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + t + dur);
  s.connect(f); f.connect(g); g.connect(out);
  s.start(c.currentTime + t, Math.random()); s.stop(c.currentTime + t + dur + 0.05);
}

const boom = (o: Out, t: number, vol = 0.5, f = 110) => { tone(o, t, 0.9, f, 30, vol, "sine", 0.005); hiss(o, t, 0.7, 900, 60, vol * 0.7, "lowpass", 0.7, 0.005); };
const ping = (o: Out, t: number, f: number, vol = 0.18, dur = 0.7) => { tone(o, t, dur, f, f * 0.995, vol, "sine", 0.004); tone(o, t, dur * 0.6, f * 2.01, f * 2, vol * 0.4, "sine", 0.004); };
const zap = (o: Out, t: number, f0: number, f1: number, dur = 0.3, vol = 0.22) => tone(o, t, dur, f0, f1, vol, "sawtooth", 0.005);
const riser = (o: Out, t: number, dur: number, f0: number, f1: number, vol = 0.22) => { tone(o, t, dur, f0, f1, vol, "sawtooth", dur * 0.6); hiss(o, t, dur, f0 * 2, f1 * 3, vol * 0.8, "bandpass", 2, dur * 0.7); };
const sparkle = (o: Out, t: number, dur: number, base: number, count = 10, vol = 0.1) => { for (let i = 0; i < count; i++) ping(o, t + (i / count) * dur + Math.random() * 0.05, base * (1 + (i % 5) * 0.25 + Math.random() * 0.1), vol, 0.35); };
const arpeggio = (o: Out, t: number, notes: number[], gap = 0.12, vol = 0.16) => notes.forEach((f, i) => ping(o, t + i * gap, f, vol, 0.9));
const pad = (o: Out, t: number, dur: number, notes: number[], vol = 0.09) => notes.forEach((f) => { tone(o, t, dur, f, f, vol, "triangle", dur * 0.4); tone(o, t, dur, f * 1.004, f * 1.004, vol * 0.7, "sine", dur * 0.4); });
const crackle = (o: Out, t: number, dur: number, vol = 0.12, density = 14) => { for (let i = 0; i < density; i++) hiss(o, t + Math.random() * dur, 0.04, 2500 + Math.random() * 3000, 1200, vol, "bandpass", 3, 0.002); };
const C5 = 523.25, E5 = 659.25, G5 = 783.99, C6 = 1046.5;

type Recipe = (o: Out) => void;

/** Click bolt, per legendary pet. */
const MAGIC: Record<string, Recipe> = {
  leo: (o) => { tone(o, 0, 0.55, 240, 80, 0.3, "sawtooth", 0.03); hiss(o, 0, 0.5, 500, 150, 0.25, "lowpass", 1); },
  cosmo: (o) => { hiss(o, 0, 0.7, 1800, 300, 0.3, "bandpass", 0.8, 0.08); tone(o, 0, 0.6, 90, 55, 0.25, "sawtooth"); },
  griff: (o) => hiss(o, 0, 0.4, 600, 6000, 0.3, "bandpass", 3, 0.03),
  kira: (o) => { tone(o, 0, 0.5, 520, 980, 0.2); sparkle(o, 0.05, 0.4, 900, 5, 0.08); },
  aurora: (o) => arpeggio(o, 0, [C5, E5, G5, C6], 0.07, 0.14),
  frostbite: (o) => { ping(o, 0, 1760, 0.2, 0.5); hiss(o, 0, 0.3, 7000, 3000, 0.18, "highpass", 1, 0.01); },
  nova: (o) => { tone(o, 0, 0.6, 1400, 180, 0.22, "triangle", 0.01); sparkle(o, 0.1, 0.4, 1200, 5, 0.08); },
  default: (o) => { zap(o, 0, 600, 200, 0.3); },
};

/** Abilities by id. Lengths follow each ability's `seconds`. */
const ABILITIES: Record<string, Recipe> = {
  spirit_flame: (o) => { hiss(o, 0, 1.2, 600, 2400, 0.28, "bandpass", 1.5, 0.3); tone(o, 0.1, 1.0, 300, 700, 0.15, "triangle"); boom(o, 1.4, 0.35, 160); sparkle(o, 1.45, 0.4, 1100, 6, 0.08); },
  foxfire_storm: (o) => { crackle(o, 0, 3.4, 0.1, 30); pad(o, 0, 3.4, [220, 330, 440], 0.08); for (let i = 0; i < 6; i++) tone(o, 0.2 + i * 0.5, 0.45, 500 + i * 80, 900 + i * 80, 0.1, "sine"); },
  phantom_dash: (o) => { hiss(o, 0, 0.35, 2000, 8000, 0.3, "bandpass", 2, 0.02); zap(o, 0.05, 1500, 200, 0.4, 0.2); crackle(o, 0.4, 0.9, 0.1, 10); hiss(o, 1.2, 0.3, 8000, 1500, 0.28, "bandpass", 2, 0.02); ping(o, 1.45, 1320, 0.2); },
  nine_tail_illusion: (o) => { for (let i = 0; i < 9; i++) ping(o, i * 0.18, 440 * Math.pow(1.122, i), 0.12, 0.8); pad(o, 0.2, 3.2, [165, 247], 0.07); hiss(o, 3.0, 1.4, 1000, 7000, 0.22, "bandpass", 1.2, 0.2); sparkle(o, 3.1, 1.2, 900, 10, 0.07); },
  frost_breath: (o) => { hiss(o, 0, 1.8, 1500, 4500, 0.3, "bandpass", 0.9, 0.3); tone(o, 0, 1.6, 200, 160, 0.08, "triangle"); boom(o, 1.7, 0.25, 140); sparkle(o, 1.8, 1.2, 2200, 12, 0.07); },
  ice_shield: (o) => { arpeggio(o, 0, [C6, G5 * 2, E5 * 2, C6 * 2], 0.15, 0.1); pad(o, 0.3, 3.4, [523, 784, 1047], 0.05); for (const t of [2.4, 3.0, 3.5]) { hiss(o, t, 0.12, 6000, 3000, 0.3, "highpass", 1, 0.002); ping(o, t, 2093, 0.12, 0.4); } },
  blizzard_storm: (o) => { hiss(o, 0, 4.6, 400, 1800, 0.34, "bandpass", 1.2, 1.2); hiss(o, 0.5, 4.2, 1800, 500, 0.26, "bandpass", 2, 1.2); tone(o, 0, 4.6, 140, 220, 0.07, "sawtooth", 1.5); sparkle(o, 1, 3.5, 2200, 8, 0.05); },
  frozen_prison: (o) => { for (let i = 0; i < 5; i++) { hiss(o, i * 0.4, 0.1, 5000, 2500, 0.28, "highpass", 1, 0.002); ping(o, i * 0.4, 880 * Math.pow(1.19, i), 0.14, 0.5); } boom(o, 2.1, 0.3, 120); pad(o, 2.2, 2.2, [262, 392, 523], 0.07); sparkle(o, 2.4, 1.8, 2400, 8, 0.06); },
  galaxy_bolt: (o) => { riser(o, 0, 1.6, 200, 900, 0.16); zap(o, 1.6, 1800, 400, 0.45, 0.2); boom(o, 2.1, 0.4, 130); sparkle(o, 2.15, 1.0, 1400, 10, 0.08); },
  celestial_wings: (o) => { pad(o, 0, 4, [262, 330, 392, 523], 0.06); for (const t of [0.4, 1.2, 2.0, 2.8]) hiss(o, t, 0.5, 400, 1800, 0.18, "bandpass", 1, 0.15); for (const t of [2.2, 2.9, 3.5]) ping(o, t, 1568, 0.1, 0.9); },
  cosmic_flight: (o) => { riser(o, 0, 1.0, 150, 1400, 0.18); hiss(o, 1.0, 1.4, 900, 5000, 0.3, "bandpass", 1.5, 0.05); zap(o, 1.0, 900, 180, 1.2, 0.1); sparkle(o, 1.2, 2.2, 1300, 14, 0.07); },
  nebula_vortex: (o) => { tone(o, 0, 3.4, 400, 120, 0.12, "sine", 1.2); tone(o, 0, 3.4, 600, 150, 0.08, "triangle", 1.2); hiss(o, 0, 3.4, 300, 2200, 0.24, "bandpass", 2, 1.5); sparkle(o, 0.5, 2.8, 1000, 12, 0.06); boom(o, 3.6, 0.5, 90); sparkle(o, 3.7, 0.9, 1800, 8, 0.08); },
  starlight_blessing: (o) => { pad(o, 0, 4.4, [262, 330, 392], 0.1); pad(o, 1.2, 3.2, [523, 659], 0.05); for (let i = 0; i < 14; i++) ping(o, 0.6 + i * 0.24, 1568 - (i % 7) * 120, 0.07, 0.9); },
  astral_sight: (o) => { tone(o, 0, 1.5, 300, 1300, 0.12, "sine", 0.4); tone(o, 1.6, 1.5, 1300, 300, 0.1, "sine", 0.4); ping(o, 1.1, 1976, 0.14, 1.2); ping(o, 3.3, 2349, 0.16, 1.2); sparkle(o, 2.2, 1.4, 1700, 8, 0.05); },
};

/** Ultimates: charge, beam, impact, finale (about 7 seconds). `root` and `air` give each pet its own colour. */
function ultimate(root: number, beam: "roar" | "fire" | "wind" | "ether" | "rainbow" | "ice" | "cosmic"): Recipe {
  return (o) => {
    riser(o, 0, 2.2, root, root * 6, 0.2);
    pad(o, 0.4, 2, [root * 2, root * 3], 0.06);
    if (beam === "roar") { tone(o, 2.2, 2.4, 180, 70, 0.3, "sawtooth", 0.05); hiss(o, 2.2, 2.4, 700, 200, 0.28, "lowpass"); }
    if (beam === "fire") { hiss(o, 2.2, 2.6, 2400, 500, 0.34, "bandpass", 0.8, 0.1); tone(o, 2.2, 2.6, 90, 60, 0.24, "sawtooth"); }
    if (beam === "wind") { hiss(o, 2.2, 2.6, 800, 7000, 0.34, "bandpass", 2, 0.1); hiss(o, 2.6, 2.2, 7000, 900, 0.22, "bandpass", 2, 0.1); }
    if (beam === "ether") { pad(o, 2.2, 3, [root * 4, root * 6, root * 8], 0.08); sparkle(o, 2.2, 2.4, root * 8, 12, 0.07); }
    if (beam === "rainbow") { arpeggio(o, 2.2, [C5, E5, G5, C6, G5, E5, C5, E5, G5, C6], 0.22, 0.14); pad(o, 2.2, 2.6, [262, 330, 392], 0.06); }
    if (beam === "ice") { hiss(o, 2.2, 2.4, 5500, 2000, 0.3, "highpass", 1, 0.1); tone(o, 2.2, 2.4, 1760, 880, 0.08, "triangle"); sparkle(o, 2.3, 2.2, 2200, 12, 0.07); }
    if (beam === "cosmic") { tone(o, 2.2, 2.6, 800, 120, 0.14, "sawtooth", 0.3); hiss(o, 2.2, 2.6, 4000, 400, 0.24, "bandpass", 1.5, 0.2); sparkle(o, 2.3, 2.2, 1300, 12, 0.07); }
    boom(o, 4.7, 0.65, root);
    hiss(o, 4.7, 0.5, 6000, 800, 0.3, "bandpass", 1, 0.01);
    pad(o, 4.9, 2.2, [root * 2, root * 3, root * 4], 0.08);
    sparkle(o, 5.0, 2.0, 1500, 14, 0.07);
  };
}

const ULTIMATES: Record<string, Recipe> = {
  leo: ultimate(110, "roar"), cosmo: ultimate(98, "fire"), griff: ultimate(147, "wind"), kira: ultimate(220, "ether"),
  aurora: ultimate(131, "rainbow"), frostbite: ultimate(174, "ice"), nova: ultimate(123, "cosmic"), default: ultimate(130, "cosmic"),
};

export type PetSoundKind = "magic" | "ultimate" | "ability";

/** Plays one skill's sound. `id` is the pet id for magic/ultimate, or the ability id. Does nothing if audio is blocked or unsupported. */
export function playPetSound(kind: PetSoundKind, id: string) {
  const c = context();
  if (!c || !bus) return;
  if (c.state === "suspended") { void c.resume().catch(() => undefined); return; } // first gesture hasn't happened yet
  const recipe = kind === "ability" ? ABILITIES[id] : kind === "ultimate" ? (ULTIMATES[id] ?? ULTIMATES.default) : (MAGIC[id] ?? MAGIC.default);
  if (!recipe) return;
  if (active.length >= MAX_ACTIVE) active.shift();
  const out = c.createGain(); // per-skill gain, so it can be faded out on its own
  out.connect(bus);
  active.push(out);
  try { recipe({ c, out }); } catch { /* audio must never break the page */ }
  window.setTimeout(() => { active = active.filter((g) => g !== out); try { out.disconnect(); } catch { /* ok */ } }, 9000);
}
