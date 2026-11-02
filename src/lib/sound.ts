// Tiny WebAudio feedback sounds. Entirely optional: every call is wrapped so a
// blocked or missing AudioContext never interrupts gameplay.
let context: AudioContext | null = null;

function tone(freq: number, duration: number, type: OscillatorType, volume: number, delay = 0, slideTo?: number) {
  const ctx = context;
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const t = ctx.currentTime + delay;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + duration);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

export type SoundKind = "key" | "jump" | "wrong" | "win" | "lose";

export function playSound(kind: SoundKind, enabled: boolean) {
  if (!enabled || typeof window === "undefined") return;
  try {
    if (!context || context.state === "closed") {
      const Ctor = window.AudioContext;
      if (!Ctor) return;
      context = new Ctor();
    }
    if (context.state === "suspended") void context.resume().catch(() => undefined);
    if (kind === "key") tone(740, 0.05, "sine", 0.04);
    else if (kind === "jump") tone(420, 0.14, "square", 0.04, 0, 840);
    else if (kind === "wrong") tone(190, 0.13, "triangle", 0.06, 0, 110);
    else if (kind === "win") [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.16, "triangle", 0.06, i * 0.1));
    else tone(330, 0.3, "sawtooth", 0.04, 0, 140);
  } catch {
    // Audio is a nice-to-have only.
  }
}
