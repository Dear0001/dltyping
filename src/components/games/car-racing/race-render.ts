// Canvas renderer for Typing Car Racing: a side-on road with parallax scenery.
// All artwork is drawn with code (original shapes, no image assets).
import type { CanvasView } from "@/hooks/use-arcade";
import { PAINTS, type CarId, type RaceSim, type TrackId } from "@/lib/arcade/racing";
import { drawBanner, drawFx, hash, roundRect, shade, timer, type Fx } from "../arcade/canvas-utils";

type Scene = { sky: [string, string]; ground: string; road: string; far: string; mid: string; orb: string; night: boolean };
const SCENES: Record<TrackId, Scene> = {
  coast: { sky: ["#38bdf8", "#e0f2fe"], ground: "#fde68a", road: "#334155", far: "#0ea5e9", mid: "#15803d", orb: "#fde047", night: false },
  desert: { sky: ["#fb923c", "#fde68a"], ground: "#d97706", road: "#44403c", far: "#b45309", mid: "#3f6212", orb: "#fff7ed", night: false },
  city: { sky: ["#0f172a", "#312e81"], ground: "#1e293b", road: "#111827", far: "#1e1b4b", mid: "#0f172a", orb: "#e2e8f0", night: true },
};

type CarShape = { height: number; body: [number, number][]; cabin: [number, number][]; wheel: number; wheels: [number, number]; spoiler?: boolean };
// Outlines from the rear (x = 0) to the nose (x = 1); y runs from the roof (0) to the floor (1).
const SHAPES: Record<CarId, CarShape> = {
  comet: { height: 0.34, wheel: 0.105, wheels: [0.2, 0.79], body: [[0, 0.55], [0.06, 0.42], [0.2, 0.38], [0.3, 0.08], [0.62, 0.08], [0.78, 0.4], [0.97, 0.5], [1, 0.72], [1, 0.9], [0, 0.9]], cabin: [[0.25, 0.4], [0.33, 0.15], [0.6, 0.15], [0.72, 0.4]] },
  falcon: { height: 0.27, wheel: 0.1, wheels: [0.19, 0.8], spoiler: true, body: [[0, 0.5], [0.1, 0.4], [0.3, 0.3], [0.42, 0.06], [0.62, 0.06], [0.82, 0.42], [1, 0.62], [1, 0.9], [0, 0.9]], cabin: [[0.36, 0.34], [0.45, 0.13], [0.6, 0.13], [0.74, 0.38]] },
  viper: { height: 0.32, wheel: 0.11, wheels: [0.2, 0.8], spoiler: true, body: [[0, 0.42], [0.14, 0.36], [0.22, 0.1], [0.5, 0.1], [0.62, 0.4], [0.96, 0.46], [1, 0.62], [1, 0.9], [0, 0.9]], cabin: [[0.2, 0.36], [0.26, 0.17], [0.48, 0.17], [0.57, 0.38]] },
  titan: { height: 0.42, wheel: 0.13, wheels: [0.2, 0.78], body: [[0, 0.34], [0.4, 0.34], [0.44, 0.05], [0.7, 0.05], [0.8, 0.38], [0.98, 0.44], [1, 0.6], [1, 0.86], [0, 0.86]], cabin: [[0.47, 0.34], [0.49, 0.13], [0.67, 0.13], [0.75, 0.36]] },
};

function path(ctx: CanvasRenderingContext2D, points: [number, number][], x: number, y: number, w: number, h: number) {
  ctx.beginPath();
  points.forEach(([px, py], i) => (i ? ctx.lineTo(x + px * w, y + py * h) : ctx.moveTo(x + px * w, y + py * h)));
  ctx.closePath();
}

/** Draws a car with its rear at `x` and its wheels resting on `groundY`. */
export function drawCar(ctx: CanvasRenderingContext2D, model: CarId, color: string, x: number, groundY: number, length: number, spin: number, flame = 0) {
  const shape = SHAPES[model];
  const h = length * shape.height, r = length * shape.wheel;
  const top = groundY - h - r * 0.55;
  ctx.fillStyle = "rgba(0,0,0,.28)";
  ctx.beginPath();
  ctx.ellipse(x + length / 2, groundY + r * 0.25, length * 0.52, r * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();
  if (flame > 0) {
    // Nitro exhaust.
    const len = length * (0.45 + 0.25 * Math.sin(spin * 3)) * flame;
    const fy = top + h * 0.72;
    const grad = ctx.createLinearGradient(x, fy, x - len, fy);
    grad.addColorStop(0, "#fef08a");
    grad.addColorStop(0.4, "#fb923c");
    grad.addColorStop(1, "rgba(239,68,68,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(x, fy - h * 0.14);
    ctx.lineTo(x - len, fy);
    ctx.lineTo(x, fy + h * 0.14);
    ctx.closePath();
    ctx.fill();
  }
  if (shape.spoiler) {
    ctx.fillStyle = shade(color, -0.45);
    ctx.fillRect(x + length * 0.02, top + h * 0.14, length * 0.035, h * 0.3);
    ctx.fillRect(x - length * 0.02, top + h * 0.1, length * 0.16, h * 0.09);
  }
  path(ctx, shape.body, x, top, length, h);
  const paint = ctx.createLinearGradient(0, top, 0, top + h);
  paint.addColorStop(0, shade(color, 0.25));
  paint.addColorStop(0.55, color);
  paint.addColorStop(1, shade(color, -0.4));
  ctx.fillStyle = paint;
  ctx.fill();
  ctx.lineWidth = Math.max(1, length * 0.012);
  ctx.strokeStyle = shade(color, -0.55);
  ctx.stroke();
  path(ctx, shape.cabin, x, top, length, h);
  ctx.fillStyle = "#bae6fd";
  ctx.fill();
  ctx.strokeStyle = "rgba(15,23,42,.55)";
  ctx.stroke();
  // Lights.
  ctx.fillStyle = "#fef9c3";
  ctx.fillRect(x + length * 0.955, top + h * 0.56, length * 0.045, h * 0.1);
  ctx.fillStyle = "#dc2626";
  ctx.fillRect(x, top + h * 0.56, length * 0.03, h * 0.1);
  for (const wx of shape.wheels) {
    const cx = x + wx * length, cy = groundY - r * 0.75;
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#cbd5e1";
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = Math.max(1, r * 0.16);
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const a = spin + (i * Math.PI) / 3;
      ctx.moveTo(cx - Math.cos(a) * r * 0.5, cy - Math.sin(a) * r * 0.5);
      ctx.lineTo(cx + Math.cos(a) * r * 0.5, cy + Math.sin(a) * r * 0.5);
    }
    ctx.stroke();
  }
}

/** Scenery repeated along the road; `parallax` < 1 makes it slide slower than the road. */
function scenery(ctx: CanvasRenderingContext2D, camPx: number, parallax: number, spacing: number, w: number, draw: (x: number, index: number) => void) {
  const offset = camPx * parallax;
  const first = Math.floor(offset / spacing) - 1;
  for (let i = first; i * spacing - offset < w + spacing; i++) draw(i * spacing - offset, i);
}

function drawBackdrop(ctx: CanvasRenderingContext2D, track: TrackId, scene: Scene, w: number, horizon: number, camPx: number, time: number) {
  const sky = ctx.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, scene.sky[0]);
  sky.addColorStop(1, scene.sky[1]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, horizon);
  if (scene.night) {
    ctx.fillStyle = "#e2e8f0";
    for (let i = 0; i < 46; i++) {
      ctx.globalAlpha = 0.35 + 0.65 * hash(i + 9);
      ctx.fillRect(hash(i) * w, hash(i + 50) * horizon * 0.7, 1.6, 1.6);
    }
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = scene.orb;
  ctx.beginPath();
  ctx.arc(w * 0.82, horizon * 0.3, Math.max(14, horizon * 0.12), 0, Math.PI * 2);
  ctx.fill();

  if (track === "coast") {
    ctx.fillStyle = "#0284c7";
    ctx.fillRect(0, horizon * 0.72, w, horizon * 0.28);
    ctx.fillStyle = "rgba(255,255,255,.35)";
    for (let i = 0; i < 9; i++) ctx.fillRect(((hash(i) * w * 2 - camPx * 0.03 - time * 6) % (w + 80) + w + 80) % (w + 80) - 40, horizon * (0.76 + hash(i + 3) * 0.2), 34, 2);
    scenery(ctx, camPx, 0.06, 420, w, (x, i) => {
      ctx.fillStyle = "#0f766e";
      ctx.beginPath();
      ctx.ellipse(x + 160, horizon * 0.74, 90 + hash(i) * 60, horizon * (0.1 + hash(i + 1) * 0.08), 0, Math.PI, 0);
      ctx.fill();
    });
    scenery(ctx, camPx, 0.4, 230, w, (x, i) => {
      // Palm tree.
      const bx = x + hash(i) * 90, th = horizon * (0.34 + hash(i + 7) * 0.14);
      ctx.strokeStyle = "#78350f";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(bx, horizon);
      ctx.quadraticCurveTo(bx + 10, horizon - th / 2, bx + 4, horizon - th);
      ctx.stroke();
      ctx.strokeStyle = scene.mid;
      ctx.lineWidth = 5;
      for (let k = 0; k < 6; k++) {
        const a = Math.PI * (0.05 + k * 0.18);
        ctx.beginPath();
        ctx.moveTo(bx + 4, horizon - th);
        ctx.quadraticCurveTo(bx + 4 + Math.cos(a) * 22, horizon - th - Math.sin(a) * 26, bx + 4 + Math.cos(a) * 40, horizon - th + 8 - Math.sin(a) * 8);
        ctx.stroke();
      }
    });
  } else if (track === "desert") {
    scenery(ctx, camPx, 0.07, 380, w, (x, i) => {
      // Flat-topped mesa.
      const mw = 150 + hash(i) * 120, mh = horizon * (0.22 + hash(i + 2) * 0.2);
      ctx.fillStyle = scene.far;
      ctx.beginPath();
      ctx.moveTo(x, horizon);
      ctx.lineTo(x + mw * 0.18, horizon - mh);
      ctx.lineTo(x + mw * 0.82, horizon - mh);
      ctx.lineTo(x + mw, horizon);
      ctx.fill();
    });
    scenery(ctx, camPx, 0.42, 260, w, (x, i) => {
      // Cactus.
      const bx = x + hash(i + 4) * 120, ch = horizon * (0.16 + hash(i) * 0.1);
      ctx.strokeStyle = scene.mid;
      ctx.lineCap = "round";
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(bx, horizon);
      ctx.lineTo(bx, horizon - ch);
      ctx.moveTo(bx - 12, horizon - ch * 0.75);
      ctx.lineTo(bx - 12, horizon - ch * 0.45);
      ctx.lineTo(bx, horizon - ch * 0.45);
      ctx.moveTo(bx + 12, horizon - ch * 0.9);
      ctx.lineTo(bx + 12, horizon - ch * 0.6);
      ctx.lineTo(bx, horizon - ch * 0.6);
      ctx.stroke();
      ctx.lineCap = "butt";
    });
  } else {
    for (const [parallax, spacing, tone, tall] of [[0.06, 90, scene.far, 0.5], [0.3, 130, scene.mid, 0.72]] as const) {
      scenery(ctx, camPx, parallax, spacing, w, (x, i) => {
        // Tower with lit windows.
        const bw = spacing * (0.6 + hash(i + 11) * 0.3), bh = horizon * tall * (0.45 + hash(i) * 0.55);
        ctx.fillStyle = tone;
        ctx.fillRect(x, horizon - bh, bw, bh);
        ctx.fillStyle = hash(i + 5) > 0.5 ? "#fde68a" : "#f0abfc";
        // Window pattern keyed by tower, row and column so it stays put while the camera moves.
        for (let row = 0, wy = horizon - bh + 8; wy < horizon - 8; wy += 14, row++) for (let col = 0, wx = x + 6; wx < x + bw - 8; wx += 12, col++) if (hash(i * 31 + row * 7 + col * 13) > 0.5) ctx.fillRect(wx, wy, 5, 7);
      });
    }
  }
}

export function drawRace(view: CanvasView, sim: RaceSim, fx: Fx, timeMs: number) {
  const { ctx, w, h } = view;
  const scene = SCENES[sim.cfg.track];
  const time = timeMs / 1000;
  const horizon = h * 0.46;
  // Pixels per metre: the screen always shows about 50 m of road.
  const ppm = Math.max(8, Math.min(24, w / 50));
  const boosting = sim.nitroMs > 0;
  const shake = boosting && !fx.reduced ? Math.sin(time * 70) * 1.6 : timer(fx, "bump") > 0 && !fx.reduced ? Math.sin(time * 90) * 3 : 0;
  // The camera keeps the player's car a quarter of the way across the screen.
  const camX = sim.dist - (w * 0.25) / ppm;
  const camPx = camX * ppm;

  ctx.save();
  ctx.translate(0, shake);
  drawBackdrop(ctx, sim.cfg.track, scene, w, horizon, camPx, time);

  // Roadside ground and the road with four lanes.
  ctx.fillStyle = scene.ground;
  ctx.fillRect(0, horizon, w, h - horizon);
  const roadTop = horizon + (h - horizon) * 0.14, roadH = h - roadTop - (h - horizon) * 0.06;
  ctx.fillStyle = scene.road;
  ctx.fillRect(0, roadTop, w, roadH);
  const kerb = Math.max(4, roadH * 0.035);
  scenery(ctx, camPx, 1, 44, w, (x, i) => {
    ctx.fillStyle = i % 2 ? "#f8fafc" : "#ef4444";
    ctx.fillRect(x, roadTop - kerb, 44, kerb);
    ctx.fillRect(x, roadTop + roadH, 44, kerb);
  });
  const laneH = roadH / 4;
  ctx.fillStyle = "rgba(248,250,252,.75)";
  scenery(ctx, camPx, 1, 6 * ppm, w, (x) => {
    for (let lane = 1; lane < 4; lane++) ctx.fillRect(x, roadTop + lane * laneH - 1.5, 3 * ppm, 3);
  });

  // Start and finish lines, plus a distance board every 100 m.
  for (const [metres, finish] of [[0, false], [sim.trackLen, true]] as const) {
    const x = (metres - camX) * ppm;
    if (x < -40 || x > w + 40) continue;
    const cell = laneH / 4;
    for (let row = 0; row < 16; row++) for (let col = 0; col < 2; col++) {
      ctx.fillStyle = finish ? ((row + col) % 2 ? "#0f172a" : "#f8fafc") : "#f8fafc";
      ctx.fillRect(x + col * cell, roadTop + row * cell, cell, cell + 0.5);
    }
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${Math.max(10, h * 0.03)}px ${view.fontLatin}`;
  for (let m = Math.max(100, Math.ceil(camX / 100) * 100); m < sim.trackLen && (m - camX) * ppm < w + 40; m += 100) {
    const x = (m - camX) * ppm, by = roadTop - kerb - h * 0.075;
    roundRect(ctx, x - 22, by, 44, h * 0.05, 4);
    ctx.fillStyle = scene.night ? "#f0abfc" : "#0f766e";
    ctx.fill();
    ctx.fillRect(x - 1.5, by + h * 0.05, 3, h * 0.025);
    ctx.fillStyle = "#fff";
    ctx.fillText(`${sim.trackLen - m}m`, x, by + h * 0.027);
  }

  // Cars, back lane first. The player drives in the third lane.
  const carLen = 4.6 * ppm;
  const lanes = [0, 1, 3];
  const racers = [
    ...sim.rivals.map((r, i) => ({ lane: lanes[i], dist: r.dist, speed: r.speed, car: r.car, color: r.color, player: false })),
    { lane: 2, dist: sim.dist, speed: sim.speed, car: sim.cfg.car, color: PAINTS[sim.cfg.paint] ?? PAINTS.red, player: true },
  ].sort((a, b) => a.lane - b.lane);
  for (const racer of racers) {
    const x = (racer.dist - camX) * ppm - carLen;
    if (x > w + 20 || x < -carLen - 60) continue;
    const groundY = roadTop + (racer.lane + 0.82) * laneH;
    const bounce = fx.reduced ? 0 : Math.sin(time * 18 + racer.lane) * Math.min(1.2, racer.speed * 0.04);
    drawCar(ctx, racer.car, racer.color, x, groundY + bounce, carLen * (0.86 + racer.lane * 0.045), (racer.dist / 0.33) % (Math.PI * 2), racer.player && boosting ? 1 : 0);
    if (racer.player) {
      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.moveTo(x + carLen * 0.5 - 7, groundY - carLen * 0.5);
      ctx.lineTo(x + carLen * 0.5 + 7, groundY - carLen * 0.5);
      ctx.lineTo(x + carLen * 0.5, groundY - carLen * 0.5 + 9);
      ctx.fill();
    }
  }

  // Speed lines while boosting.
  if (boosting && !fx.reduced) {
    ctx.strokeStyle = "rgba(255,255,255,.5)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 14; i++) {
      const y = h * hash(i + Math.floor(time * 12));
      const x = w * hash(i * 7 + Math.floor(time * 12) * 3);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 60 - hash(i) * 80, y);
      ctx.stroke();
    }
  }
  ctx.restore();

  if (timer(fx, "error") > 0) {
    ctx.fillStyle = `rgba(239,68,68,${0.22 * (timer(fx, "error") / 220)})`;
    ctx.fillRect(0, 0, w, h);
  }
  drawFx(ctx, fx, 1, view.fontLatin);
  drawBanner(ctx, fx, w, h, view.fontLatin);
}
