// Canvas renderer for Zombie Survival: a top-down field with the survivor in
// the middle. All characters are drawn with code (original shapes, no image assets).
import type { CanvasView } from "@/hooks/use-arcade";
import { bufferView } from "@/lib/arcade/typing-core";
import { findTarget, PLAYER_RADIUS, ZOMBIE_RULES, type PowerKind, type Zombie, type ZombieSim, type ZombieStage } from "@/lib/arcade/zombie";
import { drawBanner, drawFx, drawWordLabel, hash, roundRect, timer, type Fx } from "../arcade/canvas-utils";

const SKIN = ["#7fb069", "#93a85a", "#6ea58a"];
const SHIRT = ["#64748b", "#92400e", "#6d28d9"];
const POWER: Record<PowerKind, { icon: string; color: string }> = { freeze: { icon: "❄️", color: "#38bdf8" }, heal: { icon: "💚", color: "#22c55e" }, blast: { icon: "💥", color: "#f97316" } };

function drawGround(ctx: CanvasRenderingContext2D, stage: ZombieStage, fw: number, fh: number) {
  const cx = fw / 2, cy = fh / 2;
  const clear = (x: number, y: number) => Math.hypot(x - cx, y - cy) > 120;
  if (stage === "graveyard") {
    ctx.fillStyle = "#2a3d2f";
    ctx.fillRect(0, 0, fw, fh);
    for (let i = 0; i < 26; i++) {
      ctx.fillStyle = i % 2 ? "#314836" : "#243529";
      ctx.beginPath();
      ctx.ellipse(hash(i) * fw, hash(i + 70) * fh, 50 + hash(i + 3) * 70, 22 + hash(i + 5) * 30, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < 12; i++) {
      const x = hash(i + 200) * fw, y = hash(i + 300) * fh;
      if (!clear(x, y)) continue;
      ctx.fillStyle = "rgba(0,0,0,.3)";
      ctx.fillRect(x - 15, y + 12, 30, 7);
      ctx.fillStyle = "#6b7280";
      roundRect(ctx, x - 12, y - 18, 24, 34, 11);
      ctx.fill();
      ctx.fillStyle = "#4b5563";
      ctx.fillRect(x - 6, y - 6, 12, 2.5);
      ctx.fillRect(x - 1.5, y - 11, 3, 13);
    }
  } else if (stage === "street") {
    ctx.fillStyle = "#2b2f36";
    ctx.fillRect(0, 0, fw, fh);
    ctx.fillStyle = "#3f4651";
    ctx.fillRect(0, 0, fw, 70);
    ctx.fillRect(0, fh - 70, fw, 70);
    ctx.fillStyle = "#facc15";
    for (let x = 20; x < fw; x += 90) ctx.fillRect(x, fh / 2 - 3, 50, 6);
    ctx.fillStyle = "rgba(248,250,252,.5)";
    for (let i = 0; i < 7; i++) ctx.fillRect(fw * 0.12 + i * 16, 78, 9, 60);
    for (let i = 0; i < 5; i++) {
      // Abandoned cars.
      const x = hash(i + 410) * fw, y = i % 2 ? 110 + hash(i) * 60 : fh - 170 + hash(i) * 60;
      if (!clear(x, y)) continue;
      ctx.fillStyle = ["#7f1d1d", "#1e3a8a", "#365314", "#78350f", "#374151"][i];
      roundRect(ctx, x - 44, y - 22, 88, 44, 10);
      ctx.fill();
      ctx.fillStyle = "rgba(15,23,42,.6)";
      roundRect(ctx, x - 20, y - 16, 40, 32, 6);
      ctx.fill();
    }
  } else {
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, fw, fh);
    ctx.strokeStyle = "rgba(148,163,184,.14)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x <= fw; x += 60) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, fh);
    }
    for (let y = 0; y <= fh; y += 60) {
      ctx.moveTo(0, y);
      ctx.lineTo(fw, y);
    }
    ctx.stroke();
    for (let i = 0; i < 9; i++) {
      // Specimen tanks.
      const x = hash(i + 510) * fw, y = hash(i + 610) * fh;
      if (!clear(x, y)) continue;
      ctx.fillStyle = "rgba(74,222,128,.14)";
      ctx.beginPath();
      ctx.arc(x, y, 40, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#334155";
      ctx.beginPath();
      ctx.arc(x, y, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#4ade80";
      ctx.beginPath();
      ctx.arc(x, y, 17, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** A zombie seen from above, facing +x (the caller rotates it towards the survivor). */
function drawZombie(ctx: CanvasRenderingContext2D, zombie: Zombie, time: number, reduced: boolean) {
  const r = ZOMBIE_RULES[zombie.type].radius;
  const sway = reduced ? 0 : Math.sin(time * (zombie.type === "fast" ? 14 : 6) + zombie.id) * 0.18;
  const skin = zombie.type === "fast" ? "#d9f99d" : zombie.type === "armored" ? "#a8a29e" : zombie.type === "boss" ? "#a855f7" : SKIN[zombie.look];
  const shirt = zombie.type === "fast" ? "#b91c1c" : zombie.type === "armored" ? "#475569" : zombie.type === "boss" ? "#581c87" : SHIRT[zombie.look];
  ctx.fillStyle = "rgba(0,0,0,.3)";
  ctx.beginPath();
  ctx.ellipse(-2, 4, r * 1.05, r * 1.15, 0, 0, Math.PI * 2);
  ctx.fill();
  if (zombie.type === "boss") {
    // Spikes along the back.
    ctx.fillStyle = "#3b0764";
    for (let i = 0; i < 7; i++) {
      const a = Math.PI / 2 + (i / 6) * Math.PI;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a - 0.14) * r * 0.8, Math.sin(a - 0.14) * r);
      ctx.lineTo(Math.cos(a) * r * 1.3, Math.sin(a) * r * 1.45);
      ctx.lineTo(Math.cos(a + 0.14) * r * 0.8, Math.sin(a + 0.14) * r);
      ctx.fill();
    }
  }
  // Arms reaching forward.
  ctx.strokeStyle = skin;
  ctx.lineCap = "round";
  ctx.lineWidth = r * 0.34;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(r * 0.1, side * r * 0.78);
    ctx.lineTo(r * (1.15 + side * sway), side * r * (0.5 + sway * 0.4));
    ctx.stroke();
  }
  ctx.lineCap = "butt";
  ctx.fillStyle = shirt;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.72, r, 0, 0, Math.PI * 2);
  ctx.fill();
  if (zombie.type === "armored") {
    ctx.fillStyle = "#1f2937";
    ctx.fillRect(-r * 0.45, -r * 1.02, r * 0.9, r * 0.4);
    ctx.fillRect(-r * 0.45, r * 0.62, r * 0.9, r * 0.4);
  }
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(r * 0.18, 0, r * 0.55, 0, Math.PI * 2);
  ctx.fill();
  if (zombie.type === "armored") {
    // Helmet with a visor slit.
    ctx.fillStyle = "#334155";
    ctx.beginPath();
    ctx.arc(r * 0.12, 0, r * 0.58, Math.PI * 0.42, Math.PI * 1.58);
    ctx.fill();
  } else if (zombie.type === "boss") {
    ctx.fillStyle = "#fde047";
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(r * 0.05, side * r * 0.4);
      ctx.lineTo(r * 0.35, side * r * 0.95);
      ctx.lineTo(r * 0.45, side * r * 0.4);
      ctx.fill();
    }
  } else if (zombie.look === 1) {
    ctx.fillStyle = "#3f2a14";
    ctx.beginPath();
    ctx.arc(r * 0.05, 0, r * 0.5, Math.PI * 0.5, Math.PI * 1.5);
    ctx.fill();
  }
  ctx.fillStyle = zombie.type === "boss" ? "#fde047" : zombie.type === "fast" ? "#dc2626" : "#fef08a";
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(r * 0.5, side * r * 0.22, r * 0.11, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSurvivor(ctx: CanvasRenderingContext2D, aim: number, firing: boolean) {
  const r = PLAYER_RADIUS;
  ctx.save();
  ctx.rotate(aim);
  ctx.fillStyle = "rgba(0,0,0,.35)";
  ctx.beginPath();
  ctx.ellipse(-2, 4, r, r * 1.1, 0, 0, Math.PI * 2);
  ctx.fill();
  // Blaster.
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(r * 0.3, -r * 0.14, r * 1.25, r * 0.28);
  ctx.fillStyle = "#38bdf8";
  ctx.fillRect(r * 1.35, -r * 0.1, r * 0.2, r * 0.2);
  if (firing) {
    ctx.fillStyle = "#fef08a";
    ctx.beginPath();
    ctx.arc(r * 1.7, 0, r * 0.32, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#2563eb";
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.7, r * 0.95, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#f5c99b";
  ctx.lineCap = "round";
  ctx.lineWidth = r * 0.3;
  ctx.beginPath();
  ctx.moveTo(r * 0.1, r * 0.7);
  ctx.lineTo(r * 0.75, r * 0.12);
  ctx.moveTo(r * 0.1, -r * 0.7);
  ctx.lineTo(r * 0.6, -r * 0.1);
  ctx.stroke();
  ctx.lineCap = "butt";
  ctx.fillStyle = "#f5c99b";
  ctx.beginPath();
  ctx.arc(r * 0.1, 0, r * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#b45309";
  ctx.beginPath();
  ctx.arc(r * 0.02, 0, r * 0.5, Math.PI * 0.5, Math.PI * 1.5);
  ctx.fill();
  ctx.restore();
}

export function drawZombies(view: CanvasView, sim: ZombieSim, fx: Fx, timeMs: number) {
  const { ctx, w, h } = view;
  const s = h / sim.h;
  const time = timeMs / 1000;
  const cx = sim.w / 2, cy = sim.h / 2;
  const target = findTarget(sim);
  const aim = target ? Math.atan2(target.y - cy, target.x - cx) : -Math.PI / 2 + Math.sin(time * 0.6) * 0.5;
  const shake = !fx.reduced && timer(fx, "shake") > 0 ? Math.sin(time * 80) * 5 * (timer(fx, "shake") / 300) : 0;

  ctx.save();
  ctx.translate(shake, shake * 0.6);
  ctx.scale(s, s);
  drawGround(ctx, sim.cfg.stage, sim.w, sim.h);

  // Flashlight beam.
  const beam = ctx.createRadialGradient(cx, cy, 20, cx, cy, 460);
  beam.addColorStop(0, "rgba(254,249,195,.22)");
  beam.addColorStop(1, "rgba(254,249,195,0)");
  ctx.fillStyle = beam;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, 460, aim - 0.38, aim + 0.38);
  ctx.fill();

  if (target) {
    // Aiming line and target ring.
    ctx.strokeStyle = timer(fx, "shot") > 0 ? "rgba(254,240,138,.95)" : "rgba(250,204,21,.4)";
    ctx.lineWidth = timer(fx, "shot") > 0 ? 4 : 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(aim) * PLAYER_RADIUS * 1.6, cy + Math.sin(aim) * PLAYER_RADIUS * 1.6);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();
    const tr = "kind" in target ? 30 : ZOMBIE_RULES[target.type].radius + 9;
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 7]);
    ctx.lineDashOffset = fx.reduced ? 0 : -time * 30;
    ctx.beginPath();
    ctx.arc(target.x, target.y, tr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  for (const power of sim.powerups) {
    const look = POWER[power.kind];
    const pulse = fx.reduced ? 1 : 1 + Math.sin(time * 5) * 0.08;
    ctx.globalAlpha = power.ttlMs < 2000 && Math.floor(time * 6) % 2 ? 0.45 : 1;
    ctx.fillStyle = look.color;
    ctx.beginPath();
    ctx.arc(power.x, power.y, 24 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.arc(power.x, power.y, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = `22px ${view.fontLatin}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(look.icon, power.x, power.y + 1);
    ctx.globalAlpha = 1;
  }

  const zombies = [...sim.zombies].sort((a, b) => a.y - b.y);
  for (const zombie of zombies) {
    ctx.save();
    ctx.translate(zombie.x, zombie.y);
    ctx.globalAlpha = Math.min(1, zombie.ageMs / 400);
    ctx.rotate(Math.atan2(cy - zombie.y, cx - zombie.x));
    drawZombie(ctx, zombie, time, fx.reduced);
    ctx.restore();
    if (zombie.stunMs > 0) {
      ctx.font = `18px ${view.fontLatin}`;
      ctx.textAlign = "center";
      ctx.fillText("💫", zombie.x, zombie.y - ZOMBIE_RULES[zombie.type].radius - 4);
    }
  }
  ctx.save();
  ctx.translate(cx, cy);
  drawSurvivor(ctx, aim, timer(fx, "shot") > 0);
  ctx.restore();

  if (sim.freezeMs > 0) {
    ctx.fillStyle = "rgba(56,189,248,.16)";
    ctx.fillRect(0, 0, sim.w, sim.h);
  }
  // Darkness around the edges.
  const dark = ctx.createRadialGradient(cx, cy, sim.h * 0.35, cx, cy, Math.max(sim.w, sim.h) * 0.75);
  dark.addColorStop(0, "rgba(2,6,23,0)");
  dark.addColorStop(1, "rgba(2,6,23,.42)");
  ctx.fillStyle = dark;
  ctx.fillRect(0, 0, sim.w, sim.h);
  ctx.restore();

  // Word labels, in screen pixels so they stay readable on small screens. The target is drawn last, on top.
  const khmer = sim.cfg.language === "khmer";
  const font = khmer ? view.fontKhmer : view.fontLatin;
  const base = Math.max(khmer ? 15 : 13, (khmer ? 19 : 17) * s);
  const bounds = { w, h };
  const label = (item: Zombie | (typeof sim.powerups)[number], active: boolean) => {
    const zombie = "kind" in item ? null : item;
    const radius = zombie ? ZOMBIE_RULES[zombie.type].radius : 26;
    const size = base * (active ? 1.3 : zombie?.type === "boss" ? 1.15 : 1);
    const above = (item.y - radius) * s - size * 1.25;
    // Near the top edge the label goes under the zombie instead of covering it.
    const box = drawWordLabel(ctx, bufferView(item.buf), item.x * s, above < size ? (item.y + radius) * s + size * 1.25 : above, size, font, { active, bounds, accent: zombie ? "#facc15" : POWER[(item as { kind: PowerKind }).kind].color });
    if (zombie && zombie.stages > 1) {
      // One dot per typing stage still to beat.
      for (let i = 0; i < zombie.stages; i++) {
        ctx.fillStyle = i < zombie.words.length ? "#f87171" : "rgba(255,255,255,.25)";
        ctx.beginPath();
        ctx.arc(box.x + box.w / 2 + (i - (zombie.stages - 1) / 2) * 13, box.y - 8, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };
  for (const item of [...zombies, ...sim.powerups]) {
    if (item === target) continue;
    if ("ageMs" in item && item.ageMs < 150) continue;
    label(item, false);
  }
  if (target) label(target, true);

  if (timer(fx, "hurt") > 0) {
    ctx.fillStyle = `rgba(220,38,38,${0.4 * (timer(fx, "hurt") / 350)})`;
    ctx.fillRect(0, 0, w, h);
  }
  drawFx(ctx, fx, s, view.fontLatin);
  drawBanner(ctx, fx, w, h, font);
}
