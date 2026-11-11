// Canvas renderer for Typing Battle Arena: the wizard on the left, the enemy on
// the right. All characters are drawn with code (original shapes, no image assets).
import type { CanvasView } from "@/hooks/use-arcade";
import type { ArenaId, ArenaSim, Enemy, EnemyKind } from "@/lib/arcade/arena";
import { bar, drawBanner, drawFx, hash, timer, type Fx } from "../arcade/canvas-utils";

type Look = { sky: [string, string]; floor: string; rim: string; prop: string; enemy: string; boss: string };
const LOOKS: Record<ArenaId, Look> = {
  forest: { sky: ["#064e3b", "#0f766e"], floor: "#365314", rim: "#84cc16", prop: "#022c22", enemy: "#65a30d", boss: "#15803d" },
  ice: { sky: ["#0c4a6e", "#7dd3fc"], floor: "#bae6fd", rim: "#f0f9ff", prop: "#075985", enemy: "#38bdf8", boss: "#6366f1" },
  volcano: { sky: ["#1c1917", "#7f1d1d"], floor: "#44403c", rim: "#f97316", prop: "#0c0a09", enemy: "#ea580c", boss: "#b91c1c" },
};
export const SPELL_COLORS = { fireball: "#f97316", ice: "#38bdf8", lightning: "#facc15", shield: "#a78bfa", ultimate: "#f472b6" } as const;

function backdrop(ctx: CanvasRenderingContext2D, arena: ArenaId, look: Look, w: number, h: number, floorY: number, time: number, reduced: boolean) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, look.sky[0]);
  sky.addColorStop(1, look.sky[1]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = look.prop;
  if (arena === "forest") {
    for (let i = 0; i < 9; i++) {
      // Tree trunks and broken columns.
      const x = (i + hash(i) * 0.6) * (w / 8), tw = 14 + hash(i + 4) * 22;
      ctx.globalAlpha = 0.55 + hash(i + 9) * 0.4;
      ctx.fillRect(x, 0, tw, floorY);
      ctx.beginPath();
      ctx.arc(x + tw / 2, floorY * (0.12 + hash(i + 2) * 0.2), 46 + hash(i + 6) * 40, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (arena === "ice") {
    for (let i = 0; i < 16; i++) {
      // Icicles.
      const x = (i + hash(i) * 0.7) * (w / 15), len = h * (0.12 + hash(i + 3) * 0.26);
      ctx.globalAlpha = 0.5 + hash(i + 7) * 0.4;
      ctx.beginPath();
      ctx.moveTo(x - 16, 0);
      ctx.lineTo(x + 16, 0);
      ctx.lineTo(x, len);
      ctx.fill();
    }
  } else {
    for (let i = 0; i < 6; i++) {
      // Jagged rock.
      const x = i * (w / 5) - 30, ph = floorY * (0.35 + hash(i + 1) * 0.4);
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.moveTo(x, floorY);
      ctx.lineTo(x + 50 + hash(i) * 40, floorY - ph);
      ctx.lineTo(x + 130, floorY);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    const glow = ctx.createLinearGradient(0, h, 0, floorY * 0.8);
    glow.addColorStop(0, "rgba(249,115,22,.7)");
    glow.addColorStop(1, "rgba(249,115,22,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, floorY * 0.8, w, h - floorY * 0.8);
    if (!reduced) {
      ctx.fillStyle = "#fdba74";
      for (let i = 0; i < 18; i++) {
        const y = h - ((time * (18 + hash(i) * 30) + hash(i + 5) * h) % h);
        ctx.globalAlpha = 0.25 + hash(i + 2) * 0.5;
        ctx.fillRect(hash(i + 11) * w + Math.sin(time + i) * 8, y, 2.5, 2.5);
      }
    }
  }
  ctx.globalAlpha = 1;
  // Arena floor.
  ctx.fillStyle = look.floor;
  ctx.beginPath();
  ctx.ellipse(w / 2, floorY + h * 0.06, w * 0.62, h * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = look.rim;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.globalAlpha = 1;
}

/** The player's wizard. `u` is the drawing unit (about a twelfth of the canvas height). */
function wizard(ctx: CanvasRenderingContext2D, x: number, y: number, u: number, orb: string, time: number, casting: boolean, reduced: boolean) {
  const bob = reduced ? 0 : Math.sin(time * 2.4) * u * 0.08;
  ctx.fillStyle = "rgba(0,0,0,.3)";
  ctx.beginPath();
  ctx.ellipse(x, y, u * 1.2, u * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
  y += bob;
  // Staff with a glowing orb.
  ctx.strokeStyle = "#78350f";
  ctx.lineWidth = u * 0.16;
  ctx.beginPath();
  ctx.moveTo(x + u * 1.15, y);
  ctx.lineTo(x + u * (casting ? 1.6 : 1.3), y - u * 3.3);
  ctx.stroke();
  const ox = x + u * (casting ? 1.62 : 1.32), oy = y - u * 3.5;
  const halo = ctx.createRadialGradient(ox, oy, 0, ox, oy, u * (casting ? 1.3 : 0.8));
  halo.addColorStop(0, orb);
  halo.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(ox, oy, u * (casting ? 1.3 : 0.8), 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(ox, oy, u * 0.2, 0, Math.PI * 2);
  ctx.fill();
  // Robe.
  ctx.fillStyle = "#4338ca";
  ctx.beginPath();
  ctx.moveTo(x - u * 1.05, y);
  ctx.quadraticCurveTo(x - u * 0.5, y - u * 2.2, x - u * 0.38, y - u * 2.6);
  ctx.lineTo(x + u * 0.38, y - u * 2.6);
  ctx.quadraticCurveTo(x + u * 0.5, y - u * 2.2, x + u * 1.05, y);
  ctx.fill();
  ctx.fillStyle = "#fbbf24";
  ctx.fillRect(x - u * 0.62, y - u * 1.35, u * 1.24, u * 0.16);
  // Arm towards the staff.
  ctx.strokeStyle = "#4338ca";
  ctx.lineWidth = u * 0.34;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x + u * 0.25, y - u * 2.1);
  ctx.lineTo(x + u * (casting ? 1.35 : 1.15), y - u * (casting ? 2.3 : 1.6));
  ctx.stroke();
  ctx.lineCap = "butt";
  // Head, beard and hat.
  ctx.fillStyle = "#f5c99b";
  ctx.beginPath();
  ctx.arc(x, y - u * 3, u * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e5e7eb";
  ctx.beginPath();
  ctx.moveTo(x - u * 0.42, y - u * 2.85);
  ctx.lineTo(x + u * 0.42, y - u * 2.85);
  ctx.lineTo(x + u * 0.05, y - u * 1.95);
  ctx.fill();
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(x + u * 0.12, y - u * 3.1, u * 0.12, u * 0.12);
  ctx.fillStyle = "#312e81";
  ctx.beginPath();
  ctx.moveTo(x - u * 0.85, y - u * 3.3);
  ctx.lineTo(x + u * 0.85, y - u * 3.3);
  ctx.lineTo(x - u * 0.2, y - u * 4.9);
  ctx.fill();
  ctx.fillStyle = "#fbbf24";
  ctx.fillRect(x - u * 0.6, y - u * 3.5, u * 1.2, u * 0.16);
}

const eyes = (ctx: CanvasRenderingContext2D, x: number, y: number, gap: number, r: number, color: string) => {
  ctx.fillStyle = color;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(x + side * gap, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
};

/** Draws an enemy standing on (x, y), facing left. */
function enemyShape(ctx: CanvasRenderingContext2D, kind: EnemyKind, x: number, y: number, u: number, color: string, time: number, reduced: boolean) {
  const t = reduced ? 0 : time;
  const dark = "rgba(15,23,42,.55)";
  ctx.fillStyle = "rgba(0,0,0,.3)";
  ctx.beginPath();
  ctx.ellipse(x, y, u * (kind === "boss" ? 2.6 : 1.4), u * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  if (kind === "slime") {
    const squish = 1 + Math.sin(t * 4) * 0.08;
    ctx.beginPath();
    ctx.ellipse(x, y, u * 1.3 * squish, u * 1.5 / squish, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.35)";
    ctx.beginPath();
    ctx.ellipse(x - u * 0.5, y - u * 0.95, u * 0.3, u * 0.16, -0.5, 0, Math.PI * 2);
    ctx.fill();
    eyes(ctx, x - u * 0.15, y - u * 0.6, u * 0.35, u * 0.15, "#0f172a");
  } else if (kind === "imp") {
    const hover = Math.sin(t * 5) * u * 0.15 - u * 0.5;
    // Wings.
    ctx.fillStyle = dark;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(x, y - u * 1.6 + hover);
      ctx.lineTo(x + side * u * 1.7, y - u * (2.6 + Math.sin(t * 12) * 0.25) + hover);
      ctx.lineTo(x + side * u * 1.2, y - u * 1.2 + hover);
      ctx.fill();
    }
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y - u * 1.2 + hover, u * 0.7, u * 0.9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x - u * 0.1, y - u * 2.3 + hover, u * 0.55, 0, Math.PI * 2);
    ctx.fill();
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(x - u * 0.1 + side * u * 0.2, y - u * 2.7 + hover);
      ctx.lineTo(x - u * 0.1 + side * u * 0.6, y - u * 3.3 + hover);
      ctx.lineTo(x - u * 0.1 + side * u * 0.5, y - u * 2.5 + hover);
      ctx.fill();
    }
    eyes(ctx, x - u * 0.25, y - u * 2.35 + hover, u * 0.2, u * 0.1, "#fef08a");
  } else if (kind === "beast") {
    const step = Math.sin(t * 7) * u * 0.12;
    ctx.fillRect(x - u * 1.1, y - u * 0.9, u * 0.3, u * 0.9 + step);
    ctx.fillRect(x - u * 0.5, y - u * 0.9, u * 0.3, u * 0.9 - step);
    ctx.fillRect(x + u * 0.5, y - u * 0.9, u * 0.3, u * 0.9 + step);
    ctx.fillRect(x + u * 1.0, y - u * 0.9, u * 0.3, u * 0.9 - step);
    ctx.beginPath();
    ctx.ellipse(x + u * 0.1, y - u * 1.2, u * 1.5, u * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();
    // Head, ears and tail.
    ctx.beginPath();
    ctx.ellipse(x - u * 1.45, y - u * 1.65, u * 0.6, u * 0.5, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - u * 1.5, y - u * 2.0);
    ctx.lineTo(x - u * 1.25, y - u * 2.7);
    ctx.lineTo(x - u * 1.05, y - u * 1.95);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + u * 1.5, y - u * 1.4);
    ctx.quadraticCurveTo(x + u * 2.4, y - u * 2.2, x + u * 2.1, y - u * 2.8);
    ctx.lineTo(x + u * 1.4, y - u * 1.1);
    ctx.fill();
    eyes(ctx, x - u * 1.6, y - u * 1.75, u * 0.14, u * 0.09, "#fef08a");
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(x - u * 1.95, y - u * 1.5, u * 0.1, u * 0.22);
  } else if (kind === "golem") {
    ctx.fillRect(x - u * 0.95, y - u * 1.0, u * 0.7, u * 1.0);
    ctx.fillRect(x + u * 0.25, y - u * 1.0, u * 0.7, u * 1.0);
    ctx.fillRect(x - u * 1.25, y - u * 3.0, u * 2.5, u * 2.1);
    ctx.fillRect(x - u * 1.95, y - u * 2.9 + Math.sin(t * 2) * u * 0.08, u * 0.6, u * 1.9);
    ctx.fillRect(x + u * 1.35, y - u * 2.9 - Math.sin(t * 2) * u * 0.08, u * 0.6, u * 1.9);
    ctx.fillRect(x - u * 0.6, y - u * 3.8, u * 1.2, u * 0.9);
    ctx.fillStyle = dark;
    ctx.fillRect(x - u * 0.9, y - u * 2.3, u * 0.7, u * 0.14);
    ctx.fillRect(x + u * 0.1, y - u * 1.7, u * 0.8, u * 0.14);
    eyes(ctx, x - u * 0.1, y - u * 3.4, u * 0.25, u * 0.12, "#fde047");
  } else if (kind === "mage") {
    const bob = Math.sin(t * 2.2) * u * 0.1;
    ctx.strokeStyle = dark;
    ctx.lineWidth = u * 0.16;
    ctx.beginPath();
    ctx.moveTo(x - u * 1.1, y);
    ctx.lineTo(x - u * 1.3, y - u * 3.4 + bob);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - u * 1.0, y);
    ctx.quadraticCurveTo(x - u * 0.4, y - u * 2.4, x - u * 0.45, y - u * 3.2 + bob);
    ctx.quadraticCurveTo(x, y - u * 4.0 + bob, x + u * 0.45, y - u * 3.2 + bob);
    ctx.quadraticCurveTo(x + u * 0.4, y - u * 2.4, x + u * 1.0, y);
    ctx.fill();
    ctx.fillStyle = "#020617";
    ctx.beginPath();
    ctx.ellipse(x - u * 0.08, y - u * 3.0 + bob, u * 0.32, u * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    eyes(ctx, x - u * 0.12, y - u * 3.05 + bob, u * 0.13, u * 0.07, "#f0abfc");
    ctx.fillStyle = "#f0abfc";
    ctx.beginPath();
    ctx.arc(x - u * 1.3, y - u * 3.6 + bob, u * 0.26, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Boss: a dragon.
    const flap = Math.sin(t * 3) * 0.25, breathe = Math.sin(t * 2) * u * 0.08;
    ctx.fillStyle = dark;
    for (const side of [0.2, 1]) {
      ctx.beginPath();
      ctx.moveTo(x + u * side, y - u * 2.6);
      ctx.lineTo(x + u * (side + 2.2), y - u * (5.2 + flap * 2));
      ctx.lineTo(x + u * (side + 2.9), y - u * (3.6 + flap));
      ctx.lineTo(x + u * (side + 1.9), y - u * 3.4);
      ctx.lineTo(x + u * (side + 2.0), y - u * 2.2);
      ctx.fill();
    }
    ctx.fillStyle = color;
    // Tail, body, legs.
    ctx.beginPath();
    ctx.moveTo(x + u * 1.6, y - u * 1.6);
    ctx.quadraticCurveTo(x + u * 3.6, y - u * 1.2, x + u * 3.9, y - u * 0.2);
    ctx.lineTo(x + u * 1.4, y - u * 0.7);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + u * 0.5, y - u * 1.9 + breathe, u * 1.9, u * 1.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x - u * 0.6, y - u * 1.0, u * 0.7, u * 1.0);
    ctx.fillRect(x + u * 1.1, y - u * 1.0, u * 0.7, u * 1.0);
    // Neck and head.
    ctx.beginPath();
    ctx.moveTo(x - u * 0.4, y - u * 2.9);
    ctx.quadraticCurveTo(x - u * 1.4, y - u * 4.6, x - u * 2.3, y - u * 4.3 + breathe);
    ctx.lineTo(x - u * 2.2, y - u * 3.4 + breathe);
    ctx.quadraticCurveTo(x - u * 1.2, y - u * 3.2, x - u * 0.9, y - u * 1.7);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x - u * 2.6, y - u * 3.9 + breathe, u * 0.95, u * 0.6, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fde68a";
    for (const dx of [-2.2, -1.9]) {
      ctx.beginPath();
      ctx.moveTo(x + u * dx, y - u * 4.4 + breathe);
      ctx.lineTo(x + u * (dx + 0.5), y - u * 5.3 + breathe);
      ctx.lineTo(x + u * (dx + 0.35), y - u * 4.3 + breathe);
      ctx.fill();
    }
    ctx.fillStyle = "#fde68a";
    ctx.beginPath();
    ctx.ellipse(x + u * 0.3, y - u * 1.5 + breathe, u * 1.1, u * 0.8, 0, 0, Math.PI);
    ctx.fill();
    eyes(ctx, x - u * 2.75, y - u * 4.05 + breathe, u * 0.01, u * 0.14, "#fef08a");
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(x - u * 3.3, y - u * 3.65 + breathe, u * 0.1, u * 0.22);
    ctx.fillRect(x - u * 3.05, y - u * 3.6 + breathe, u * 0.1, u * 0.22);
  }
}

const ENEMY_HEIGHT: Record<EnemyKind, number> = { slime: 1.9, imp: 3.6, beast: 3.1, golem: 4.2, mage: 4.3, boss: 5.8 };

export function drawArena(view: CanvasView, sim: ArenaSim, fx: Fx, timeMs: number) {
  const { ctx, w, h } = view;
  const look = LOOKS[sim.cfg.arena];
  const time = timeMs / 1000;
  const floorY = h * 0.78;
  const u = Math.min(h / 11, w / 17);
  const shake = !fx.reduced && timer(fx, "shake") > 0 ? Math.sin(time * 80) * 5 * (timer(fx, "shake") / 300) : 0;
  const wx = w * 0.22, ex = w * 0.76;

  ctx.save();
  ctx.translate(shake, 0);
  backdrop(ctx, sim.cfg.arena, look, w, h, floorY, time, fx.reduced);

  const active = sim.active === null ? null : sim.slots[sim.active].spell;
  const hurt = timer(fx, "wizardHit") > 0;
  wizard(ctx, wx - (hurt && !fx.reduced ? u * 0.3 : 0), floorY, u, active ? SPELL_COLORS[active] : "#e0e7ff", time, timer(fx, "cast") > 0, fx.reduced);
  if (sim.shieldMs > 0) {
    ctx.strokeStyle = SPELL_COLORS.shield;
    ctx.fillStyle = "rgba(167,139,250,.18)";
    ctx.lineWidth = 3;
    ctx.globalAlpha = sim.shieldMs < 1200 && Math.floor(time * 8) % 2 ? 0.4 : 1;
    ctx.beginPath();
    ctx.ellipse(wx + u * 0.2, floorY - u * 2.3, u * 2.3, u * 3.1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  const wizardBar = Math.min(u * 4.4, w * 0.3);
  bar(ctx, wx - wizardBar / 2, floorY - u * 5.6, wizardBar, Math.max(7, u * 0.3), sim.hp / sim.maxHp, sim.hp > 35 ? "#22c55e" : "#ef4444");

  const enemy: Enemy | null = sim.enemy;
  if (enemy) {
    const lunge = timer(fx, "lunge") > 0 && !fx.reduced ? -Math.sin((timer(fx, "lunge") / 300) * Math.PI) * u * 1.6 : 0;
    const flash = timer(fx, "enemyHit") > 0;
    const appear = Math.min(1, 1 - timer(fx, "appear") / 500);
    ctx.globalAlpha = appear;
    if (enemy.enraged) {
      const aura = ctx.createRadialGradient(ex, floorY - u * 2.5, u, ex, floorY - u * 2.5, u * 5);
      aura.addColorStop(0, "rgba(239,68,68,.45)");
      aura.addColorStop(1, "rgba(239,68,68,0)");
      ctx.fillStyle = aura;
      ctx.fillRect(ex - u * 5, floorY - u * 7.5, u * 10, u * 8);
    }
    enemyShape(ctx, enemy.kind, ex + lunge + (flash && !fx.reduced ? u * 0.25 : 0), floorY, u, flash ? "#f8fafc" : enemy.slowMs > 0 ? "#7dd3fc" : enemy.kind === "boss" ? look.boss : look.enemy, time, fx.reduced);
    ctx.globalAlpha = 1;
    const top = floorY - u * (ENEMY_HEIGHT[enemy.kind] + 1.25);
    const barW = Math.min(u * (enemy.kind === "boss" ? 7 : 5), w * 0.36);
    bar(ctx, ex - barW / 2, top, barW, Math.max(7, u * 0.3), enemy.hp / enemy.maxHp, "#ef4444");
    // Attack timer: fills up as the next strike gets closer.
    const charge = 1 - enemy.attackMs / (enemy.intervalMs + 800);
    bar(ctx, ex - barW / 2, top + Math.max(10, u * 0.42), barW, Math.max(5, u * 0.2), charge, enemy.slowMs > 0 ? "#38bdf8" : charge > 0.75 ? "#f97316" : "#facc15");
  }

  for (const shot of fx.shots) {
    const k = 1 - shot.life / shot.max;
    const x = shot.x0 + (shot.x1 - shot.x0) * k, y = shot.y0 + (shot.y1 - shot.y0) * k - Math.sin(k * Math.PI) * u * 0.8;
    if (shot.kind === "lightning") {
      ctx.strokeStyle = shot.color;
      ctx.lineWidth = 4;
      ctx.globalAlpha = 1 - k;
      ctx.beginPath();
      ctx.moveTo(shot.x1 + u, 0);
      for (let i = 1; i <= 6; i++) ctx.lineTo(shot.x1 + (hash(i + Math.floor(time * 30)) - 0.5) * u * 1.6, (shot.y1 * i) / 6);
      ctx.stroke();
      ctx.globalAlpha = 1;
    } else if (shot.kind === "ultimate") {
      ctx.globalAlpha = 1 - k;
      const beam = ctx.createLinearGradient(shot.x0, 0, shot.x1, 0);
      beam.addColorStop(0, "#fdf4ff");
      beam.addColorStop(1, shot.color);
      ctx.fillStyle = beam;
      ctx.fillRect(shot.x0, shot.y0 - u * (0.9 - k * 0.5), shot.x1 - shot.x0, u * (1.8 - k));
      ctx.globalAlpha = 1;
    } else {
      const halo = ctx.createRadialGradient(x, y, 0, x, y, u * 0.9);
      halo.addColorStop(0, "#fff");
      halo.addColorStop(0.35, shot.color);
      halo.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(x, y, u * 0.9, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  if (hurt) {
    ctx.fillStyle = `rgba(220,38,38,${0.35 * (timer(fx, "wizardHit") / 350)})`;
    ctx.fillRect(0, 0, w, h);
  }
  drawFx(ctx, fx, 1, view.fontLatin);
  drawBanner(ctx, fx, w, h, sim.cfg.language === "khmer" ? view.fontKhmer : view.fontLatin);
}

/** Where effects start and land, matching drawArena's layout. */
export function arenaPoints(view: CanvasView) {
  const u = Math.min(view.h / 11, view.w / 17), floorY = view.h * 0.78;
  return { u, staff: { x: view.w * 0.22 + u * 1.6, y: floorY - u * 3.5 }, wizard: { x: view.w * 0.22, y: floorY - u * 2.4 }, enemy: { x: view.w * 0.76, y: floorY - u * 2 } };
}
