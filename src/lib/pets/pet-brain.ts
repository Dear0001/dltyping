import { resolveAnim, type PetAnim, type PetDefinition } from "@/lib/pets/pet-catalog";
import type { PetEvent } from "@/lib/pets/pet-events";

/**
 * Pet behaviour engine: a small state machine with no React or DOM in it, so it is
 * cheap to run every animation frame and easy to test. The component feeds it the
 * pointer and the clock; it returns where the pet is and which animation to play.
 * Everything pet-specific comes from the PetDefinition (traits, supported animations).
 */
export type Rand = () => number;
export type MotionMode = "full" | "reduced" | "off";
export type PointerInput = { x: number; y: number; active: boolean } | null;

export type StepInput = {
  /** Seconds since the last frame, already clamped. */
  dt: number;
  pointer: PointerInput;
  /** Viewport y of the pet's centre (the pet walks along a fixed ground line). */
  centerY: number;
  size: number;
  minX: number;
  maxX: number;
  motion: MotionMode;
  /** The learner is typing: stay calm and out of the way. */
  quiet: boolean;
  /** Cursor interactions allowed (setting). */
  cursor: boolean;
  speech: boolean;
  events: readonly PetEvent[];
};

type Goal = { kind: "wander" | "follow" | "flee"; x: number } | null;

export type BrainState = {
  /** Left edge of the pet, in viewport px. */
  x: number;
  vx: number;
  face: 1 | -1;
  anim: PetAnim;
  animT: number;
  /** 0 = stays until something changes it. */
  animDur: number;
  goal: Goal;
  idleFor: number;
  nextIdle: number;
  sinceInput: number;
  /** Where the eyes/head point, -1 (left) to 1 (right) and -1 (up) to 1 (down). */
  look: number;
  lookY: number;
  lookGoal: number;
  lookHold: number;
  noticeCd: number;
  noticed: boolean;
  closeFlag: boolean;
  outT: number;
  followT: number;
  arrived: boolean;
  blinkT: number;
  blinking: number;
  speechCd: number;
  say: { text: string; ttl: number; id: number } | null;
  fx: { emoji: string; id: number } | null;
  lastReaction: number;
  counter: number;
  /** A celebration or encouragement is playing: quiet mode must not cut it short. */
  protect: boolean;
};

const TRANSIENT: Partial<Record<PetAnim, number>> = { jump: 0.85, stretch: 1.5, startled: 0.7, happy: 1.25, excited: 1.9, celebrate: 2.9 };
const NOTICE_BASE = 190;
const NOTICE_CURIOSITY = 140;
/** Cursors are usually far above the pet's ground line, so vertical distance counts for less than sideways distance. */
const VERTICAL_WEIGHT = 0.4;
/** Friendly, curious pets notice the cursor from further away. */
export const noticeRadius = (def: PetDefinition) => (NOTICE_BASE + NOTICE_CURIOSITY * def.traits.curiosity) * (0.6 + 1.2 * def.traits.friendliness * def.traits.curiosity);
const SLEEP_AFTER = 28;
const range = (rand: Rand, lo: number, hi: number) => lo + rand() * (hi - lo);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function createBrain(def: PetDefinition, x: number, rand: Rand): BrainState {
  return {
    x, vx: 0, face: 1, anim: "idle", animT: 0, animDur: 0, goal: null, idleFor: 0, nextIdle: range(rand, def.idle[0], def.idle[1]),
    sinceInput: 0, look: 0, lookY: 0, lookGoal: 0, lookHold: 0, noticeCd: 0, noticed: false, closeFlag: false, outT: 0, followT: 0,
    arrived: false, blinkT: range(rand, 1.5, 4), blinking: 0, speechCd: 0, say: null, fx: null, lastReaction: -1, counter: 0, protect: false,
  };
}

const isLocomotion = (a: PetAnim) => a === "walk" || a === "run" || a === "follow";

function setAnim(s: BrainState, def: PetDefinition, anim: PetAnim, motion: MotionMode, duration?: number) {
  // Reduced motion keeps calm poses only; off keeps the pet still.
  let want = anim;
  if (motion === "off") want = "idle";
  else if (motion === "reduced" && anim !== "sit" && anim !== "sleep") want = "idle";
  const resolved = resolveAnim(def, want);
  if (resolved === s.anim && duration === undefined) return;
  s.anim = resolved;
  s.animT = 0;
  s.animDur = duration ?? TRANSIENT[resolved] ?? 0;
  s.protect = false; // handleEvent re-sets it right after for the animations that need it
}

function speak(s: BrainState, lines: readonly string[], rand: Rand, speechOn: boolean, force = false) {
  if (!speechOn || !lines.length || (!force && s.speechCd > 0)) return;
  s.counter += 1;
  s.say = { text: lines[Math.floor(rand() * lines.length)], ttl: 2.6, id: s.counter };
  s.speechCd = 5;
}

function emoji(s: BrainState, symbol: string) {
  s.counter += 1;
  s.fx = { emoji: symbol, id: s.counter };
}

function settle(s: BrainState, def: PetDefinition, rand: Rand) {
  s.anim = "idle";
  s.animT = 0;
  s.animDur = 0;
  s.idleFor = 0;
  s.nextIdle = range(rand, def.idle[0], def.idle[1]);
}

function handleEvent(s: BrainState, def: PetDefinition, ev: PetEvent, inp: StepInput, rand: Rand) {
  s.sinceInput = 0;
  const wasAsleep = s.anim === "sleep";
  switch (ev.type) {
    case "click": {
      if (wasAsleep) { setAnim(s, def, "stretch", inp.motion); speak(s, def.speech.wake, rand, inp.speech, true); emoji(s, "💤"); break; }
      // Rotate through the pet's reactions so repeated clicks feel varied.
      let i = Math.floor(rand() * def.clickReactions.length);
      if (def.clickReactions.length > 1 && i === s.lastReaction) i = (i + 1) % def.clickReactions.length;
      s.lastReaction = i;
      const r = def.clickReactions[i];
      s.goal = s.goal?.kind === "follow" ? s.goal : null;
      setAnim(s, def, r.anim, inp.motion, TRANSIENT[r.anim] ?? 1.2);
      emoji(s, r.emoji);
      if (inp.speech && r.say) { s.counter += 1; s.say = { text: r.say, ttl: 2.4, id: s.counter }; s.speechCd = 2; }
      break;
    }
    case "celebrate":
      s.goal = null;
      setAnim(s, def, "celebrate", inp.motion);
      s.protect = true;
      emoji(s, "🎉");
      speak(s, def.speech.celebrate, rand, inp.speech, true);
      break;
    case "encourage":
      s.goal = null;
      setAnim(s, def, ev.good ? "excited" : "happy", inp.motion);
      s.protect = true;
      emoji(s, ev.good ? "👏" : "💪");
      speak(s, def.speech.encourage, rand, inp.speech, true);
      break;
    case "unlock":
      setAnim(s, def, "excited", inp.motion, 2.5);
      s.protect = true;
      emoji(s, "🎁");
      break;
    case "wake":
      if (wasAsleep) setAnim(s, def, "stretch", inp.motion);
      break;
  }
}

/** Reaction to the cursor first coming near. Chosen by personality, never random across pets. */
function noticePointer(s: BrainState, def: PetDefinition, inp: StepInput, rand: Rand, px: number, centerX: number) {
  const t = def.traits;
  const weights = {
    follow: t.friendliness * (1 - t.shyness) * 3,
    flee: t.shyness * 0.9,
    play: t.playfulness * 0.35,
    ignore: (1 - t.curiosity) * 0.6 + 0.05,
  };
  const total = weights.follow + weights.flee + weights.play + weights.ignore;
  let roll = rand() * total;
  const pick = (Object.keys(weights) as (keyof typeof weights)[]).find((k) => (roll -= weights[k]) < 0) ?? "ignore";
  if (pick === "follow") {
    s.goal = { kind: "follow", x: px };
    s.followT = 0;
    s.arrived = false;
    speak(s, def.speech.follow, rand, inp.speech);
  } else if (pick === "flee") {
    startFlee(s, def, inp, rand, px, centerX);
  } else if (pick === "play") {
    setAnim(s, def, rand() < 0.5 ? "jump" : "excited", inp.motion);
    emoji(s, "✨");
  }
}

function startFlee(s: BrainState, def: PetDefinition, inp: StepInput, rand: Rand, px: number, centerX: number) {
  const away = centerX >= px ? 1 : -1;
  // Run the other way, or turn around if cornered against a wall.
  let dir = away;
  if ((dir === 1 && s.x > inp.maxX - 80) || (dir === -1 && s.x < inp.minX + 80)) dir = -dir as 1 | -1;
  s.goal = { kind: "flee", x: clamp(s.x + dir * range(rand, 170, 300), inp.minX, inp.maxX) };
  setAnim(s, def, "startled", inp.motion);
  speak(s, def.speech.flee, rand, inp.speech);
}

export function stepBrain(s: BrainState, def: PetDefinition, inp: StepInput, rand: Rand): BrainState {
  const { dt } = inp;
  s.animT += dt;
  s.idleFor += dt;
  s.sinceInput += dt;
  s.noticeCd = Math.max(0, s.noticeCd - dt);
  s.speechCd = Math.max(0, s.speechCd - dt);
  if (s.say && (s.say.ttl -= dt) <= 0) s.say = null;
  s.x = clamp(s.x, inp.minX, Math.max(inp.minX, inp.maxX));

  for (const ev of inp.events) handleEvent(s, def, ev, inp, rand);

  const moves = inp.motion === "full";
  const centerX = s.x + inp.size / 2;
  const p = inp.pointer;
  const cursorOn = inp.cursor && inp.motion !== "off" && !inp.quiet;

  // ---- Pointer ---------------------------------------------------------------
  let lookTarget: number | null = null;
  if (p && cursorOn) {
    const dx = p.x - centerX;
    const dy = p.y - inp.centerY;
    const d = Math.hypot(dx, dy);
    const near = Math.hypot(dx, dy * VERTICAL_WEIGHT);
    const notice = noticeRadius(def);
    if (p.active && near < 620) {
      lookTarget = clamp(dx / 170, -1, 1);
      s.lookY = clamp(s.lookY + (clamp(dy / 170, -1, 1) - s.lookY) * Math.min(1, dt * 6), -1, 1);
    }
    if (p.active && near < notice) {
      s.sinceInput = 0;
      s.outT = 0;
      if (s.anim === "sleep" && near < 190) { setAnim(s, def, "stretch", inp.motion); speak(s, def.speech.wake, rand, inp.speech, true); }
      // Still hanging around an idle pet: give it another chance to react.
      if (s.noticed && s.noticeCd <= 0 && !s.goal && s.anim === "idle") s.noticed = false;
      if (!s.noticed && s.noticeCd <= 0 && s.anim !== "sleep") {
        s.noticed = true;
        s.noticeCd = range(rand, 5, 9);
        if (moves) noticePointer(s, def, inp, rand, p.x, centerX);
      }
      // Cursor right on top of the pet.
      if (d < inp.size * 0.7 && !s.closeFlag && s.anim !== "sleep" && !(s.animDur > 0)) {
        s.closeFlag = true;
        const t = def.traits;
        if (moves && t.shyness > 0.5) startFlee(s, def, inp, rand, p.x, centerX);
        else if (t.friendliness > 0.55) { setAnim(s, def, "happy", inp.motion); emoji(s, "❤️"); }
        else if (t.playfulness > 0.5) setAnim(s, def, "jump", inp.motion);
      }
      if (d > inp.size * 1.3) s.closeFlag = false;
    } else {
      s.noticed = false;
      s.closeFlag = false;
      if (s.goal?.kind === "follow") {
        s.outT += dt;
        if (s.outT > 2.2) { s.goal = null; s.arrived = false; } // The cursor left: watch it go, then give up.
      }
    }
    if (s.goal?.kind === "follow" && p.active) {
      const side = centerX < p.x ? -1 : 1;
      // Already close enough: stay put. Backing away from a cursor that is on top of the pet would make it impossible to click.
      s.goal.x = Math.abs(p.x - centerX) <= def.followDistance + 8
        ? s.x
        : clamp(p.x - inp.size / 2 + side * def.followDistance, inp.minX, inp.maxX);
      s.followT += dt;
      if (s.followT > 22) { s.goal = null; s.arrived = false; setAnim(s, def, "sit", inp.motion, 4); }
    }
  } else if (s.goal?.kind === "follow") {
    s.goal = null;
  }

  // ---- Quiet (typing) --------------------------------------------------------
  if (inp.quiet) {
    s.goal = null;
    // Casual reactions give way at once; a celebration finishes first.
    if (!(s.protect && s.animDur > 0) && s.anim !== "sleep" && s.anim !== "sit") setAnim(s, def, "sit", inp.motion);
  }
  // Quiet ended: stand back up (a quiet-time "sit" has no timer of its own).
  else if (s.anim === "sit" && s.animDur === 0) settle(s, def, rand);

  // ---- Transient animation finished ------------------------------------------
  if (s.protect && !(s.animDur > 0)) s.protect = false;
  if (s.animDur > 0 && s.animT >= s.animDur) {
    s.protect = false;
    if (s.anim === "sit" || s.anim === "sleep") settle(s, def, rand);
    // Arrived next to the cursor: stand by it. Otherwise keep walking toward the goal.
    else if (s.goal?.kind === "follow" && s.arrived) { s.anim = "idle"; s.animT = 0; s.animDur = 0; }
    else if (s.goal) { s.anim = "walk"; s.animT = 0; s.animDur = 0; }
    else settle(s, def, rand);
  }

  // ---- Autonomy: wander, sit, stretch, look around, doze --------------------
  const free = s.goal === null && (s.anim === "idle") && !inp.quiet;
  if (free && s.idleFor >= s.nextIdle) {
    const t = def.traits;
    const can = (a: PetAnim) => def.anims.includes(a);
    const asleepOk = s.sinceInput > SLEEP_AFTER;
    const options: [string, number][] = [
      ["wander", moves ? 2.2 + 5 * t.energy : 0],
      ["sit", can("sit") ? 1.1 : 0],
      ["stretch", can("stretch") ? 0.9 : 0],
      ["look", 1.6],
      ["play", can("jump") && inp.motion !== "off" ? 0.7 * t.playfulness : 0],
      ["sleep", asleepOk && can("sleep") ? 5 * t.sleepiness : 0],
    ];
    const total = options.reduce((a, [, w]) => a + w, 0);
    let roll = rand() * total;
    const choice = options.find(([, w]) => (roll -= w) < 0)?.[0] ?? "look";
    s.idleFor = 0;
    s.nextIdle = range(rand, def.idle[0], def.idle[1]);
    if (choice === "wander") {
      const dir = rand() < 0.5 ? -1 : 1;
      s.goal = { kind: "wander", x: clamp(s.x + dir * range(rand, 110, 420), inp.minX, inp.maxX) };
    } else if (choice === "sit") setAnim(s, def, "sit", inp.motion, range(rand, 3, 7));
    else if (choice === "stretch") setAnim(s, def, "stretch", inp.motion);
    else if (choice === "play") setAnim(s, def, rand() < 0.5 ? "jump" : "excited", inp.motion);
    else if (choice === "sleep") { setAnim(s, def, "sleep", inp.motion); s.animDur = 0; emoji(s, "💤"); }
    else { s.lookGoal = range(rand, -0.9, 0.9); s.lookHold = range(rand, 1, 2.2); }
  }

  // ---- Locomotion: accelerate toward the goal, never snap --------------------
  const g = s.goal;
  if (g && moves) {
    const dx = g.x - s.x;
    const speed = def.speed * (g.kind === "flee" ? 2.2 : g.kind === "follow" ? (Math.abs(dx) > 260 ? 1.8 : 1.25) : 0.55 + 0.7 * def.traits.energy);
    const stop = g.kind === "wander" ? 5 : g.kind === "flee" ? 8 : 6;
    if (Math.abs(dx) <= stop) {
      const wasFollow = g.kind === "follow";
      if (!wasFollow) s.goal = null;
      // Ease to a halt rather than stopping dead.
      s.vx *= Math.max(0, 1 - 12 * dt);
      s.x = clamp(s.x + s.vx * dt, inp.minX, inp.maxX);
      if (wasFollow) {
        if (!s.arrived) { s.arrived = true; setAnim(s, def, def.followArrive, inp.motion, TRANSIENT[def.followArrive] ?? 4); if (s.animDur === 0) s.animDur = 4; }
      } else {
        s.idleFor = 0;
        s.nextIdle = range(rand, def.idle[0], def.idle[1]);
        if (g.kind === "flee") lookTarget = lookTarget ?? 0;
      }
    } else {
      s.arrived = false;
      // Arrive steering: slow down smoothly on approach instead of stopping dead.
      const want = Math.sign(dx) * Math.min(speed, Math.max(16, Math.abs(dx) * 3.2));
      const accel = speed * 4.5 * dt;
      s.vx += clamp(want - s.vx, -accel, accel);
      s.x += s.vx * dt;
      if (s.x <= inp.minX || s.x >= inp.maxX) { s.x = clamp(s.x, inp.minX, inp.maxX); if (g.kind !== "follow") s.goal = null; s.vx = 0; }
      // Locomotion animation, unless a one-off reaction is playing.
      const reacting = s.animDur > 0 && !isLocomotion(s.anim);
      if (!reacting || s.anim === "startled") {
        if (s.anim !== "startled") {
          const target: PetAnim = g.kind === "flee" ? "run" : g.kind === "follow" ? (speed > def.speed * 1.5 ? "run" : "follow") : "walk";
          const resolved = resolveAnim(def, target);
          if (s.anim !== resolved) { s.anim = resolved; s.animT = 0; s.animDur = 0; }
        }
      }
    }
  } else {
    s.vx *= Math.max(0, 1 - 9 * dt);
    if (Math.abs(s.vx) < 1) s.vx = 0;
    else s.x = clamp(s.x + s.vx * dt, inp.minX, inp.maxX);
    if (!g && isLocomotion(s.anim) && s.animDur === 0) settle(s, def, rand);
  }
  if (Math.abs(s.vx) > 6) s.face = s.vx > 0 ? 1 : -1;

  // ---- Look (eyes and head), smoothed ---------------------------------------
  if (lookTarget !== null) s.lookGoal = lookTarget;
  else if (s.lookHold > 0) s.lookHold -= dt;
  else s.lookGoal = 0;
  if (s.anim === "sleep") s.lookGoal = 0;
  s.look += (s.lookGoal - s.look) * Math.min(1, dt * 6);
  if (lookTarget === null) s.lookY += (0 - s.lookY) * Math.min(1, dt * 4);

  // ---- Blink -----------------------------------------------------------------
  if (s.blinking > 0) s.blinking = Math.max(0, s.blinking - dt);
  else if ((s.blinkT -= dt) <= 0 && s.anim !== "sleep") { s.blinking = 0.17; s.blinkT = range(rand, 2.2, 6); }

  return s;
}
