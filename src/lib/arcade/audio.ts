// Sound effects and background music for the arcade games, synthesised with
// WebAudio (no audio files to download). Everything is optional: a blocked or
// missing AudioContext never interrupts a game.
let context: AudioContext | null = null;
let musicGain: GainNode | null = null;
let musicTimer: number | null = null;
let musicTheme: MusicTheme | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!context || context.state === "closed") {
      const Ctor = window.AudioContext;
      if (!Ctor) return null;
      context = new Ctor();
    }
    if (context.state === "suspended") void context.resume().catch(() => undefined);
    return context;
  } catch {
    return null;
  }
}

function tone(ctx: AudioContext, out: AudioNode, freq: number, duration: number, type: OscillatorType, volume: number, delay = 0, slideTo?: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const t = ctx.currentTime + delay;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + duration);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain);
  gain.connect(out);
  osc.start(t);
  osc.stop(t + duration + 0.03);
}

function noise(ctx: AudioContext, duration: number, volume: number, lowpass: number) {
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  src.buffer = buffer;
  filter.type = "lowpass";
  filter.frequency.value = lowpass;
  gain.gain.value = volume;
  src.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  src.start();
}

export type ArcadeSound = "key" | "wrong" | "count" | "go" | "nitro" | "hit" | "kill" | "explode" | "hurt" | "powerup" | "spell" | "ice" | "zap" | "shield" | "block" | "wave" | "boss" | "win" | "lose" | "unlock";

export function playArcadeSound(kind: ArcadeSound, enabled: boolean) {
  if (!enabled) return;
  const ctx = audio();
  if (!ctx) return;
  try {
    const out = ctx.destination;
    switch (kind) {
      case "key": tone(ctx, out, 720, 0.045, "sine", 0.035); break;
      case "wrong": tone(ctx, out, 190, 0.13, "triangle", 0.06, 0, 110); break;
      case "count": tone(ctx, out, 440, 0.16, "square", 0.05); break;
      case "go": tone(ctx, out, 880, 0.35, "square", 0.06); break;
      case "nitro": tone(ctx, out, 160, 0.7, "sawtooth", 0.06, 0, 900); noise(ctx, 0.6, 0.05, 2400); break;
      case "hit": tone(ctx, out, 300, 0.08, "square", 0.04, 0, 180); break;
      case "kill": tone(ctx, out, 240, 0.16, "sawtooth", 0.05, 0, 70); noise(ctx, 0.12, 0.05, 1800); break;
      case "explode": noise(ctx, 0.55, 0.12, 900); tone(ctx, out, 110, 0.5, "sawtooth", 0.06, 0, 40); break;
      case "hurt": tone(ctx, out, 150, 0.25, "sawtooth", 0.07, 0, 60); break;
      case "powerup": [523, 784, 1046].forEach((f, i) => tone(ctx, out, f, 0.12, "sine", 0.05, i * 0.07)); break;
      case "spell": tone(ctx, out, 300, 0.3, "sawtooth", 0.05, 0, 720); break;
      case "ice": tone(ctx, out, 1400, 0.35, "sine", 0.05, 0, 500); break;
      case "zap": tone(ctx, out, 1800, 0.18, "square", 0.05, 0, 120); noise(ctx, 0.2, 0.07, 5000); break;
      case "shield": tone(ctx, out, 392, 0.4, "sine", 0.06, 0, 588); break;
      case "block": tone(ctx, out, 620, 0.12, "triangle", 0.06, 0, 420); break;
      case "wave": [392, 523].forEach((f, i) => tone(ctx, out, f, 0.2, "triangle", 0.05, i * 0.14)); break;
      case "boss": [196, 185, 147].forEach((f, i) => tone(ctx, out, f, 0.35, "sawtooth", 0.06, i * 0.22)); break;
      case "win": [523, 659, 784, 1046].forEach((f, i) => tone(ctx, out, f, 0.18, "triangle", 0.06, i * 0.11)); break;
      case "lose": [392, 330, 262, 196].forEach((f, i) => tone(ctx, out, f, 0.26, "triangle", 0.05, i * 0.16)); break;
      case "unlock": [659, 880, 1318].forEach((f, i) => tone(ctx, out, f, 0.14, "sine", 0.05, i * 0.08)); break;
    }
  } catch {
    // Audio is a nice-to-have only.
  }
}

// ---- Background music -------------------------------------------------------
export type MusicTheme = "race" | "zombie" | "arena";
type Pattern = { stepMs: number; bass: number[]; lead: number[]; bassType: OscillatorType; leadType: OscillatorType };

// Short original loops, written as note frequencies (0 = rest).
const PATTERNS: Record<MusicTheme, Pattern> = {
  race: { stepMs: 150, bassType: "sawtooth", leadType: "square", bass: [110, 0, 110, 110, 0, 110, 131, 0, 147, 0, 147, 147, 0, 147, 131, 0], lead: [440, 0, 523, 0, 659, 0, 523, 0, 587, 0, 698, 0, 880, 0, 698, 0] },
  zombie: { stepMs: 260, bassType: "triangle", leadType: "sine", bass: [82, 0, 0, 82, 0, 0, 78, 0, 82, 0, 0, 82, 0, 98, 92, 0], lead: [0, 330, 0, 0, 311, 0, 0, 0, 0, 330, 0, 392, 0, 0, 370, 0] },
  arena: { stepMs: 200, bassType: "triangle", leadType: "triangle", bass: [98, 0, 147, 0, 98, 0, 147, 0, 87, 0, 131, 0, 110, 0, 165, 0], lead: [392, 466, 587, 0, 466, 392, 0, 349, 349, 440, 523, 0, 440, 523, 659, 0] },
};

export function stopMusic() {
  if (musicTimer !== null) window.clearInterval(musicTimer);
  musicTimer = null;
  musicTheme = null;
  if (musicGain && context) {
    try {
      musicGain.gain.setTargetAtTime(0.0001, context.currentTime, 0.08);
    } catch {
      // ignore
    }
  }
}

export function startMusic(theme: MusicTheme, enabled: boolean) {
  if (!enabled) return stopMusic();
  if (musicTheme === theme && musicTimer !== null) return;
  stopMusic();
  const ctx = audio();
  if (!ctx) return;
  try {
    const gain = ctx.createGain();
    gain.gain.value = 0.35;
    gain.connect(ctx.destination);
    musicGain = gain;
    musicTheme = theme;
    const pattern = PATTERNS[theme];
    let step = 0;
    musicTimer = window.setInterval(() => {
      // Timers are throttled in hidden tabs; the game is paused there anyway, so skip the note.
      if (document.hidden || ctx.state !== "running") return;
      const i = step++ % pattern.bass.length;
      const length = (pattern.stepMs / 1000) * 0.9;
      if (pattern.bass[i]) tone(ctx, gain, pattern.bass[i], length, pattern.bassType, 0.05);
      if (pattern.lead[i]) tone(ctx, gain, pattern.lead[i], length, pattern.leadType, 0.025);
    }, pattern.stepMs);
  } catch {
    // Music is optional.
  }
}
