// Canvas renderer for Typing Space Shooter. The fixed-size playfield is scaled
// to fit the canvas; the starfield fills the whole canvas around it. Every ship
// is drawn with code (original shapes, no image assets).
import type { CanvasView } from "@/hooks/use-arcade";
import { DEFENSE_Y, ENEMY_KINDS, findBoss, findTarget, isCloaked, isDoomed, PLAYER, WORLD, type Enemy, type SpaceSim } from "@/lib/arcade/space";
import { bufferView } from "@/lib/arcade/typing-core";
import { bar, drawBanner, drawFx, drawWordLabel, hash, roundRect, timer, type Fx } from "../arcade/canvas-utils";

const COLORS: Record<Enemy["kind"], { body: string; trim: string; glow: string }> = {
  scout: { body: "#34d399", trim: "#065f46", glow: "rgba(52,211,153,.35)" },
  speed: { body: "#f87171", trim: "#7f1d1d", glow: "rgba(248,113,113,.35)" },
  armored: { body: "#94a3b8", trim: "#334155", glow: "rgba(148,163,184,.3)" },
  bomber: { body: "#fb923c", trim: "#7c2d12", glow: "rgba(251,146,60,.4)" },
  elite: { body: "#c084fc", trim: "#581c87", glow: "rgba(192,132,252,.55)" },
  stealth: { body: "#67e8f9", trim: "#155e75", glow: "rgba(103,232,249,.3)" },
  boss: { body: "#a855f7", trim: "#3b0764", glow: "rgba(168,85,247,.45)" },
};

/** Where the playfield sits on the canvas. */
export function layout(view: Pick<CanvasView, "w" | "h">) {
  const s = Math.min(view.w / WORLD.w, view.h / WORLD.h);
  return { s, ox: (view.w - WORLD.w * s) / 2, oy: (view.h - WORLD.h * s) / 2 };
}

function backdrop(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, reduced: boolean) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#020617");
  sky.addColorStop(0.55, "#0b1033");
  sky.addColorStop(1, "#111a4a");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  // Nebula clouds.
  for (const [x, y, r, c] of [[0.22, 0.28, 0.42, "rgba(124,58,237,.22)"], [0.78, 0.18, 0.36, "rgba(37,99,235,.2)"], [0.62, 0.7, 0.5, "rgba(219,39,119,.12)"]] as const) {
    const g = ctx.createRadialGradient(x * w, y * h, 0, x * w, y * h, r * Math.max(w, h));
    g.addColorStop(0, c);
    g.addColorStop(1, "rgba(2,6,23,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
  // Distant ringed planet.
  const px = w * 0.86, py = h * 0.72, pr = Math.min(w, h) * 0.09;
  const planet = ctx.createRadialGradient(px - pr * 0.4, py - pr * 0.4, pr * 0.1, px, py, pr);
  planet.addColorStop(0, "#818cf8");
  planet.addColorStop(1, "#1e1b4b");
  ctx.fillStyle = planet;
  ctx.beginPath();
  ctx.arc(px, py, pr, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(196,181,253,.45)";
  ctx.lineWidth = Math.max(2, pr * 0.08);
  ctx.beginPath();
  ctx.ellipse(px, py, pr * 1.7, pr * 0.42, -0.35, 0, Math.PI * 2);
  ctx.stroke();
  // Three layers of stars drifting down at different speeds.
  for (let layer = 0; layer < 3; layer++) {
    const speed = reduced ? 0 : [8, 18, 36][layer];
    ctx.fillStyle = ["rgba(226,232,240,.45)", "rgba(226,232,240,.7)", "#ffffff"][layer];
    const size = [1, 1.5, 2.2][layer];
    for (let i = 0; i < 60 - layer * 15; i++) {
      const x = hash(i * 3 + layer * 101) * w;
      const y = (hash(i * 7 + layer * 53) * h + time * speed) % h;
      ctx.fillRect(x, y, size, size);
    }
  }
}

function ship(ctx: CanvasRenderingContext2D, enemy: Enemy, time: number) {
  const c = COLORS[enemy.kind];
  const r = ENEMY_KINDS[enemy.kind].radius;
  const flash = enemy.flashMs > 0;
  const body = flash ? "#ffffff" : c.body;
  ctx.fillStyle = c.glow;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = body;
  ctx.strokeStyle = c.trim;
  ctx.lineWidth = 2;
  ctx.beginPath();
  switch (enemy.kind) {
    case "scout":
      // Saucer.
      ctx.ellipse(0, 0, r, r * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#a7f3d0";
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.25, r * 0.45, r * 0.38, 0, Math.PI, 0);
      ctx.fill();
      break;
    case "speed":
      // Dart pointing down.
      ctx.moveTo(0, r * 1.2);
      ctx.lineTo(r * 0.9, -r * 0.8);
      ctx.lineTo(0, -r * 0.35);
      ctx.lineTo(-r * 0.9, -r * 0.8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    case "armored":
    case "boss": {
      // Hexagonal hull.
      const n = 6;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + Math.PI / 6;
        const k = enemy.kind === "boss" ? [1, 0.7, 1, 1, 0.7, 1][i] : 1;
        ctx.lineTo(Math.cos(a) * r * k * (enemy.kind === "boss" ? 1.5 : 1), Math.sin(a) * r * k * 0.8);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = flash ? "#fff" : c.trim;
      ctx.fillRect(-r * 0.5, -r * 0.12, r, r * 0.24);
      if (enemy.kind === "boss") {
        // Glowing core and cannons.
        const core = ctx.createRadialGradient(0, 0, 2, 0, 0, r * 0.45);
        core.addColorStop(0, "#fde68a");
        core.addColorStop(1, "rgba(244,63,94,0)");
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(0, r * 0.1, r * 0.45, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = c.trim;
        for (const side of [-1, 1]) ctx.fillRect(side * r * 0.95 - 7, r * 0.45, 14, r * 0.45);
      }
      break;
    }
    case "bomber":
      // Wide body with a bomb bay.
      roundRect(ctx, -r * 1.1, -r * 0.55, r * 2.2, r * 1.1, r * 0.4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = flash ? "#fff" : c.trim;
      ctx.beginPath();
      ctx.arc(0, r * 0.15, r * 0.35, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "elite":
      // Crescent wings.
      ctx.moveTo(0, r * 1.1);
      ctx.quadraticCurveTo(r * 1.5, 0, r * 1.1, -r * 0.9);
      ctx.quadraticCurveTo(r * 0.4, -r * 0.2, 0, -r * 0.6);
      ctx.quadraticCurveTo(-r * 0.4, -r * 0.2, -r * 1.1, -r * 0.9);
      ctx.quadraticCurveTo(-r * 1.5, 0, 0, r * 1.1);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#fdf4ff";
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.22 + Math.sin(time * 6) * 1.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "stealth":
      ctx.moveTo(0, r);
      ctx.lineTo(r * 1.1, -r * 0.4);
      ctx.lineTo(r * 0.3, -r * 0.2);
      ctx.lineTo(0, -r * 0.9);
      ctx.lineTo(-r * 0.3, -r * 0.2);
      ctx.lineTo(-r * 1.1, -r * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
  }
}

function playerShip(ctx: CanvasRenderingContext2D, angle: number, time: number, sim: SpaceSim, fx: Fx) {
  ctx.save();
  ctx.translate(PLAYER.x, PLAYER.y);
  ctx.rotate(angle);
  const hurt = timer(fx, "hurt") > 0;
  const rapid = sim.rapidMs > 0;
  // Engine flame.
  const flicker = fx.reduced ? 1 : 0.8 + 0.2 * Math.sin(time * 40);
  const flame = ctx.createLinearGradient(0, 18, 0, 18 + 30 * flicker);
  flame.addColorStop(0, rapid ? "#fde047" : "#7dd3fc");
  flame.addColorStop(1, "rgba(59,130,246,0)");
  ctx.fillStyle = flame;
  ctx.beginPath();
  ctx.moveTo(-9, 16);
  ctx.lineTo(9, 16);
  ctx.lineTo(0, 16 + 34 * flicker);
  ctx.closePath();
  ctx.fill();
  // Hull.
  ctx.fillStyle = hurt ? "#fecaca" : "#e2e8f0";
  ctx.strokeStyle = "#1e3a8a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -34);
  ctx.lineTo(10, -8);
  ctx.lineTo(30, 14);
  ctx.lineTo(10, 12);
  ctx.lineTo(6, 20);
  ctx.lineTo(-6, 20);
  ctx.lineTo(-10, 12);
  ctx.lineTo(-30, 14);
  ctx.lineTo(-10, -8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = rapid ? "#f59e0b" : "#2563eb";
  ctx.fillRect(-26, 8, 10, 4);
  ctx.fillRect(16, 8, 10, 4);
  ctx.fillStyle = "#38bdf8";
  ctx.beginPath();
  ctx.ellipse(0, -10, 5, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  if (timer(fx, "muzzle") > 0) {
    ctx.fillStyle = rapid ? "#fde047" : "#bae6fd";
    ctx.beginPath();
    ctx.arc(0, -38, 7, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  if (sim.shieldMs > 0) {
    ctx.globalAlpha = sim.shieldMs < 1500 && Math.floor(time * 6) % 2 ? 0.35 : 0.85;
    ctx.strokeStyle = "#a5f3fc";
    ctx.fillStyle = "rgba(103,232,249,.14)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(PLAYER.x, PLAYER.y - 4, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

export function drawSpace(view: CanvasView, sim: SpaceSim, fx: Fx, timeMs: number) {
  const { ctx, w, h } = view;
  const time = timeMs / 1000;
  const { s, ox, oy } = layout(view);
  const shake = !fx.reduced && timer(fx, "shake") > 0 ? Math.sin(time * 70) * 6 * (timer(fx, "shake") / 300) : 0;
  backdrop(ctx, w, h, time, fx.reduced);

  ctx.save();
  ctx.translate(ox + shake, oy);
  ctx.scale(s, s);
  // Playfield edge on wide or tall screens.
  ctx.strokeStyle = "rgba(148,163,184,.12)";
  ctx.lineWidth = 1 / s;
  ctx.strokeRect(0, 0, WORLD.w, WORLD.h);

  // Defence line.
  const breach = timer(fx, "breach");
  ctx.strokeStyle = breach > 0 ? `rgba(248,113,113,${0.5 + breach / 800})` : "rgba(56,189,248,.55)";
  ctx.lineWidth = breach > 0 ? 4 : 2;
  ctx.setLineDash([14, 10]);
  ctx.lineDashOffset = fx.reduced ? 0 : -time * 20;
  ctx.beginPath();
  ctx.moveTo(0, DEFENSE_Y);
  ctx.lineTo(WORLD.w, DEFENSE_Y);
  ctx.stroke();
  ctx.setLineDash([]);
  const zone = ctx.createLinearGradient(0, DEFENSE_Y, 0, WORLD.h);
  zone.addColorStop(0, "rgba(56,189,248,.12)");
  zone.addColorStop(1, "rgba(56,189,248,0)");
  ctx.fillStyle = zone;
  ctx.fillRect(0, DEFENSE_Y, WORLD.w, WORLD.h - DEFENSE_Y);

  const target = findTarget(sim);
  // Aiming line to the target.
  if (target) {
    ctx.strokeStyle = timer(fx, "wrong") > 0 ? "rgba(248,113,113,.7)" : "rgba(250,204,21,.45)";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.moveTo(PLAYER.x, PLAYER.y - 30);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  for (const enemy of sim.enemies) {
    const r = ENEMY_KINDS[enemy.kind].radius;
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.globalAlpha = isCloaked(enemy) ? 0.16 : 1;
    if (enemy.kind === "boss" && enemy.introMs > 0 && !fx.reduced) ctx.globalAlpha = 0.6 + 0.4 * Math.abs(Math.sin(time * 6));
    ship(ctx, enemy, time);
    ctx.globalAlpha = 1;
    // Armored ships keep their shield until the first word lands.
    if (enemy.kind === "armored" && enemy.hp === enemy.maxHp) {
      ctx.strokeStyle = "rgba(125,211,252,.85)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.35, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (enemy.kind === "bomber" && enemy.hovering && !isDoomed(enemy)) {
      // Countdown ring to the next bomb, with a warning when it is close.
      const left = enemy.fuseMs / enemy.fuseMax;
      ctx.strokeStyle = left < 0.25 ? "#ef4444" : "#fbbf24";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.55, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * left);
      ctx.stroke();
      if (left < 0.25) {
        ctx.fillStyle = "#ef4444";
        ctx.font = `800 22px ${view.fontLatin}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("!", r * 1.9, 0);
      }
    }
    if (enemy === target) {
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 2.5;
      const k = r * 1.6;
      for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        ctx.beginPath();
        ctx.moveTo(sx * k, sy * k * 0.55);
        ctx.lineTo(sx * k, sy * k);
        ctx.lineTo(sx * k * 0.55, sy * k);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // Bombs and boss shots.
  for (const hazard of sim.hazards) {
    const g = ctx.createRadialGradient(hazard.x, hazard.y, 1, hazard.x, hazard.y, 13);
    g.addColorStop(0, "#fff7ed");
    g.addColorStop(0.4, hazard.boss ? "#e879f9" : "#f97316");
    g.addColorStop(1, "rgba(239,68,68,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(hazard.x, hazard.y, 13, 0, Math.PI * 2);
    ctx.fill();
  }

  // Player shots with short trails.
  for (const shot of sim.shots) {
    const enemy = sim.enemies.find((e) => e.id === shot.targetId);
    const dx = enemy ? enemy.x - shot.x : 0, dy = enemy ? enemy.y - shot.y : -1;
    const d = Math.hypot(dx, dy) || 1;
    ctx.strokeStyle = shot.kind === "missile" ? "#fb923c" : sim.rapidMs > 0 ? "#fde047" : "#67e8f9";
    ctx.lineWidth = shot.kind === "missile" ? 5 : 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(shot.x - (dx / d) * 26, shot.y - (dy / d) * 26);
    ctx.lineTo(shot.x, shot.y);
    ctx.stroke();
    ctx.lineCap = "butt";
  }
  // Laser beam power-up.
  for (const beam of fx.shots) {
    ctx.globalAlpha = beam.life / beam.max;
    ctx.strokeStyle = beam.color;
    ctx.lineWidth = 9 * (beam.life / beam.max) + 2;
    ctx.beginPath();
    ctx.moveTo(beam.x0, beam.y0);
    ctx.lineTo(beam.x1, beam.y1);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  if (sim.result !== "lost") playerShip(ctx, target ? Math.atan2(target.x - PLAYER.x, PLAYER.y - target.y) : 0, time, sim, fx);
  drawFx(ctx, fx, 1, view.fontLatin);
  ctx.restore();

  if (sim.slowMs > 0) {
    ctx.fillStyle = "rgba(56,189,248,.08)";
    ctx.fillRect(0, 0, w, h);
  }

  // Word labels in screen pixels, so they stay readable on small screens. The target is drawn last, on top.
  const khmer = sim.cfg.language === "khmer";
  const font = khmer ? view.fontKhmer : view.fontLatin;
  const base = Math.max(khmer ? 15 : 13, (khmer ? 19 : 17) * s);
  const bounds = { w, h };
  const label = (enemy: Enemy, active: boolean) => {
    const r = ENEMY_KINDS[enemy.kind].radius;
    const size = base * (active ? 1.28 : enemy.kind === "boss" ? 1.15 : 1);
    const wobble = active && timer(fx, "wrong") > 0 && !fx.reduced ? Math.sin(time * 90) * 4 : 0;
    const above = oy + (enemy.y - r * (enemy.kind === "boss" ? 0.9 : 1.2)) * s - size * 1.3;
    // Near the top edge the word goes under the ship instead of covering it.
    const cy = above < size * 1.1 ? oy + (enemy.y + r * 1.2) * s + size * 1.1 : above;
    const box = drawWordLabel(ctx, bufferView(enemy.buf), ox + enemy.x * s + wobble, cy, size, font, {
      active, bounds, accent: active && timer(fx, "wrong") > 0 ? "#f87171" : "#facc15", alpha: isCloaked(enemy) && !active ? 0.75 : 1,
    });
    if (enemy.maxHp > 1 && enemy.kind !== "boss") {
      // One dot per word still to beat.
      for (let i = 0; i < enemy.maxHp; i++) {
        ctx.fillStyle = i < enemy.words.length ? "#fca5a5" : "rgba(255,255,255,.25)";
        ctx.beginPath();
        ctx.arc(box.x + box.w / 2 + (i - (enemy.maxHp - 1) / 2) * 12, box.y - 7, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };
  for (const enemy of sim.enemies) if (enemy !== target && !isDoomed(enemy) && enemy.introMs <= 0 && enemy.y > -10) label(enemy, false);
  if (target) label(target, true);

  // Mothership health bar across the top.
  const boss = findBoss(sim);
  if (boss) {
    const bw = Math.min(w * 0.6, 520), bx = (w - bw) / 2, by = oy + 12;
    bar(ctx, bx, by, bw, 12, boss.hp / boss.maxHp, boss.hp <= boss.maxHp / 3 ? "#f43f5e" : "#a855f7");
    ctx.strokeStyle = "rgba(15,23,42,.8)";
    ctx.lineWidth = 2;
    for (let i = 1; i < boss.maxHp; i++) {
      ctx.beginPath();
      ctx.moveTo(bx + (bw * i) / boss.maxHp, by);
      ctx.lineTo(bx + (bw * i) / boss.maxHp, by + 12);
      ctx.stroke();
    }
  }

  const hurt = timer(fx, "hurt");
  if (hurt > 0) {
    // Gentle red edge glow (no full-screen flash).
    const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.7);
    g.addColorStop(0, "rgba(220,38,38,0)");
    g.addColorStop(1, `rgba(220,38,38,${0.35 * (hurt / 400)})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
  drawBanner(ctx, fx, w, h, font);
}
