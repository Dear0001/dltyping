// Small drawing helpers shared by the three arcade renderers.
import type { CharView } from "@/lib/typing-engine";

export type Particle = { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; color: string; gravity: number };
export type Floater = { x: number; y: number; text: string; color: string; life: number; max: number; size: number };
export type Ring = { x: number; y: number; life: number; max: number; radius: number; color: string };
export type Shot = { kind: string; life: number; max: number; x0: number; y0: number; x1: number; y1: number; color: string };

/** Short-lived visual effects. Positions are in the renderer's own units. */
export type Fx = {
  particles: Particle[];
  floaters: Floater[];
  rings: Ring[];
  shots: Shot[];
  /** Named countdowns in ms (screen shake, hit flashes…). */
  timers: Record<string, number>;
  banner: { text: string; sub?: string; life: number; max: number } | null;
  reduced: boolean;
};

export const createFx = (): Fx => ({ particles: [], floaters: [], rings: [], shots: [], timers: {}, banner: null, reduced: false });

export function burst(fx: Fx, x: number, y: number, color: string, count: number, speed: number, gravity = 0) {
  if (fx.reduced) count = Math.min(count, 4);
  if (fx.particles.length > 260) return;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2, v = speed * (0.35 + Math.random() * 0.65);
    const max = 350 + Math.random() * 350;
    fx.particles.push({ x, y, vx: Math.cos(angle) * v, vy: Math.sin(angle) * v, life: max, max, size: 2 + Math.random() * 3, color, gravity });
  }
}
export const floatText = (fx: Fx, x: number, y: number, text: string, color: string, size = 18) => void fx.floaters.push({ x, y, text, color, life: 900, max: 900, size });
export const ring = (fx: Fx, x: number, y: number, radius: number, color: string, ms = 500) => void fx.rings.push({ x, y, life: ms, max: ms, radius, color });
export const shoot = (fx: Fx, kind: string, x0: number, y0: number, x1: number, y1: number, color: string, ms = 260) => void fx.shots.push({ kind, life: ms, max: ms, x0, y0, x1, y1, color });
export const setTimer = (fx: Fx, name: string, ms: number) => void (fx.timers[name] = ms);
export const timer = (fx: Fx, name: string) => fx.timers[name] ?? 0;
export const showBanner = (fx: Fx, text: string, sub?: string, ms = 1800) => void (fx.banner = { text, sub, life: ms, max: ms });

export function stepFx(fx: Fx, dtMs: number) {
  const dt = dtMs / 1000;
  for (const p of fx.particles) {
    p.life -= dtMs;
    p.vy += p.gravity * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
  for (const f of fx.floaters) {
    f.life -= dtMs;
    f.y -= 34 * dt;
  }
  for (const r of fx.rings) r.life -= dtMs;
  for (const s of fx.shots) s.life -= dtMs;
  fx.particles = fx.particles.filter((p) => p.life > 0);
  fx.floaters = fx.floaters.filter((f) => f.life > 0);
  fx.rings = fx.rings.filter((r) => r.life > 0);
  fx.shots = fx.shots.filter((s) => s.life > 0);
  for (const key of Object.keys(fx.timers)) fx.timers[key] = Math.max(0, fx.timers[key] - dtMs);
  if (fx.banner && (fx.banner.life -= dtMs) <= 0) fx.banner = null;
}

/** Draws particles, rings and floating numbers. `scale` converts effect units to pixels. */
export function drawFx(ctx: CanvasRenderingContext2D, fx: Fx, scale: number, font: string) {
  for (const r of fx.rings) {
    const k = 1 - r.life / r.max;
    ctx.globalAlpha = 1 - k;
    ctx.strokeStyle = r.color;
    ctx.lineWidth = 4 * scale * (1 - k) + 1;
    ctx.beginPath();
    ctx.arc(r.x * scale, r.y * scale, r.radius * k * scale, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (const p of fx.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.max);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x * scale - p.size / 2, p.y * scale - p.size / 2, p.size, p.size);
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const f of fx.floaters) {
    ctx.globalAlpha = Math.min(1, (f.life / f.max) * 1.6);
    ctx.font = `800 ${Math.max(12, f.size * scale)}px ${font}`;
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(15,23,42,.75)";
    ctx.strokeText(f.text, f.x * scale, f.y * scale);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x * scale, f.y * scale);
  }
  ctx.globalAlpha = 1;
}

export function drawBanner(ctx: CanvasRenderingContext2D, fx: Fx, w: number, h: number, font: string) {
  const b = fx.banner;
  if (!b) return;
  const k = b.life / b.max;
  const alpha = Math.min(1, k * 4, (1 - k) * 6);
  ctx.globalAlpha = alpha;
  const size = Math.max(22, Math.min(54, w / 14));
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `800 ${size}px ${font}`;
  ctx.lineWidth = 6;
  ctx.strokeStyle = "rgba(15,23,42,.8)";
  ctx.strokeText(b.text, w / 2, h * 0.3);
  ctx.fillStyle = "#fff";
  ctx.fillText(b.text, w / 2, h * 0.3);
  if (b.sub) {
    ctx.font = `700 ${size * 0.42}px ${font}`;
    ctx.strokeText(b.sub, w / 2, h * 0.3 + size * 0.9);
    ctx.fillStyle = "#fde68a";
    ctx.fillText(b.sub, w / 2, h * 0.3 + size * 0.9);
  }
  ctx.globalAlpha = 1;
}

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export function bar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, value: number, color: string, back = "rgba(15,23,42,.65)") {
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = back;
  ctx.fill();
  const v = Math.max(0, Math.min(1, value));
  if (v > 0) {
    roundRect(ctx, x, y, Math.max(h, w * v), h, h / 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
}

const LABEL_COLORS: Record<CharView["state"], string> = { correct: "#34d399", wrong: "#f87171", partial: "#7dd3fc", current: "#ffffff", pending: "#cbd5e1" };

/**
 * A word in a rounded label, centred on `cx`, coloured per typed character.
 * Text is drawn one grapheme cluster at a time, so Khmer syllables are never split.
 * Returns the label box so callers can keep labels on screen.
 */
export function drawWordLabel(ctx: CanvasRenderingContext2D, views: CharView[], cx: number, cy: number, size: number, font: string, opts: { active?: boolean; bounds?: { w: number; h: number }; accent?: string; alpha?: number } = {}) {
  ctx.globalAlpha = opts.alpha ?? 1;
  ctx.font = `700 ${size}px ${font}`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  const widths = views.map((v) => ctx.measureText(v.text).width);
  const total = widths.reduce((a, b) => a + b, 0);
  const padX = size * 0.55, boxH = size * 1.75, boxW = total + padX * 2;
  let x = cx - boxW / 2, y = cy - boxH / 2;
  if (opts.bounds) {
    x = Math.max(4, Math.min(opts.bounds.w - boxW - 4, x));
    y = Math.max(4, Math.min(opts.bounds.h - boxH - 4, y));
  }
  roundRect(ctx, x, y, boxW, boxH, boxH / 2.6);
  ctx.fillStyle = opts.active ? "rgba(15,23,42,.94)" : "rgba(15,23,42,.72)";
  ctx.fill();
  if (opts.active) {
    ctx.lineWidth = 2;
    ctx.strokeStyle = opts.accent ?? "#facc15";
    ctx.stroke();
  }
  let tx = x + padX;
  views.forEach((v, i) => {
    ctx.fillStyle = LABEL_COLORS[v.state];
    ctx.fillText(v.text, tx, y + boxH / 2 + 1);
    // The next letter is also underlined, so progress never depends on colour alone.
    if (opts.active && (v.state === "current" || v.state === "partial")) ctx.fillRect(tx, y + boxH - size * 0.32, widths[i], Math.max(2, size * 0.1));
    tx += widths[i];
  });
  ctx.globalAlpha = 1;
  return { x, y, w: boxW, h: boxH };
}

/** Deterministic 0-1 value for an index: stable scenery without storing it. */
export function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** Makes a hex colour darker (amount < 0) or lighter (amount > 0). */
export function shade(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number) => Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount);
  return `rgb(${mix((n >> 16) & 255)},${mix((n >> 8) & 255)},${mix(n & 255)})`;
}
