"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useNow, useTypingProgress } from "@/hooks/useTypingProgress";
import { currentStreak, dayKey, practiceDays } from "@/lib/progress/progress-analytics";
import PetSprite from "@/components/pets/PetSprite";
import PetAbility, { type AbilityRun } from "@/components/pets/PetAbility";
import PetUltimate, { type UltimateRun } from "@/components/pets/PetUltimate";
import { usePetState } from "@/hooks/usePets";
import { createBrain, stepBrain, ULTIMATE_SECONDS, type MotionMode } from "@/lib/pets/pet-brain";
import { PETS, type Ability, type PetDefinition } from "@/lib/pets/pet-catalog";
import { emitPetEvent, subscribePetEvents, ultimateCooldown, type PetEvent } from "@/lib/pets/pet-events";
import { ACTION_SELECTOR, INTERACTIVE_SELECTOR, isPetHiddenRoute, isTypingRoute, MOBILE_MAX_SIZE, PET_SIZES, TYPING_GRACE_MS } from "@/lib/pets/pet-policy";
import { setPetEnabled, type PetSettings } from "@/lib/pets/pet-storage";

const subscribeMotion = (cb: () => void) => {
  const q = window.matchMedia("(prefers-reduced-motion: reduce)");
  q.addEventListener("change", cb);
  return () => q.removeEventListener("change", cb);
};
/** The learner's system "reduce motion" preference. */
const useSystemReducedMotion = () => useSyncExternalStore(subscribeMotion, () => window.matchMedia("(prefers-reduced-motion: reduce)").matches, () => false);

/** The motion level actually used: the pet setting, never exceeding the system preference. */
export function effectiveMotion(setting: PetSettings["animations"], systemReduced: boolean): MotionMode {
  if (setting === "off") return "off";
  if (systemReduced) return "reduced";
  return setting;
}

export default function PetCompanion() {
  const { state, hydrated, active, actives } = usePetState();
  const pathname = usePathname();
  const systemReduced = useSystemReducedMotion();
  if (!hydrated) return null;
  // No pet earned yet: still show the control, in its locked form, so everyone can see what the streak unlocks.
  if (!active) return <PetControls locked name="" enabled />;
  const typingRoute = isTypingRoute(pathname);
  const show = state.enabled && !isPetHiddenRoute(pathname);
  return (
    <>
      {show && actives.map((pet, index) => <PetStage key={pet.id} def={pet} index={index} settings={state.settings} motion={effectiveMotion(state.settings.animations, systemReduced)} typingRoute={typingRoute} />)}
      <PetControls name={actives.length > 1 ? `${actives.length} pets are` : `${active.name} is`} enabled={state.enabled} ultimates={actives.filter((p) => p.ultimate && !p.keyCast)} abilities={actives.filter((p) => !p.keyCast).flatMap((p) => (p.abilities ?? []).map((ab) => ({ pet: p, ab })))} keyCasters={actives.filter((p) => p.keyCast)} canCast={state.enabled && !isPetHiddenRoute(pathname) && effectiveMotion(state.settings.animations, systemReduced) === "full"} />
    </>
  );
}

type StageProps = { def: PetDefinition; /** Position in the active team: spreads the pets out when they first appear. */ index: number; settings: PetSettings; motion: MotionMode; typingRoute: boolean };

function PetStage({ def, index, settings, motion, typingRoute }: StageProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const spriteRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const fxRef = useRef<HTMLDivElement>(null);
  const [ult, setUlt] = useState<UltimateRun | null>(null);
  const [abil, setAbil] = useState<AbilityRun | null>(null);
  const startIndex = useRef(index); // only used for the first position, so reordering the team never moves a pet
  const live = useRef({ settings, motion, typingRoute });
  useEffect(() => {
    live.current = { settings, motion, typingRoute };
  });

  useEffect(() => {
    const root = rootRef.current, body = bodyRef.current, sprite = spriteRef.current, bubble = bubbleRef.current, fx = fxRef.current;
    if (!root || !body || !sprite || !bubble || !fx) return;
    const rand = Math.random;
    const sizeNow = () => Math.min(PET_SIZES[live.current.settings.size], window.innerWidth < 520 ? MOBILE_MAX_SIZE : 999);
    const brain = createBrain(def, Math.max(8, window.innerWidth * Math.min(0.9, 0.2 + 0.17 * startIndex.current)), rand);
    const pointer = { x: 0, y: 0, active: false, at: 0 };
    const queue: PetEvent[] = [];
    let typingUntil = 0;
    let raf = 0, last = 0, hoverOn = false;
    // Height above the ground line (0 = standing on the bottom edge). Dragging changes it; roaming keeps it.
    let lift = 0;
    const drag = { on: false, offX: 0, offY: 0, moved: false, lastX: 0, tilt: 0 };
    let justDragged = 0;
    const applied = { tf: "", air: NaN, x: NaN, anim: "", blink: false, face: 0, look: NaN, lookY: NaN, size: 0, quiet: false, hidden: false, trick: "" };
    let sayId = 0, fxId = 0, boltId = 0, ultId = 0, abilId = 0, ambientAt = 0;
    const ultTimers: number[] = [];
    const endUltimate = () => {
      ultTimers.forEach((id) => window.clearTimeout(id));
      ultTimers.length = 0;
      delete sprite.dataset.ult;
      sprite.style.removeProperty("--ult-grow");
      sprite.style.removeProperty("--ult-lift");
      document.body.classList.remove("pet-shake", "pet-shake-big");
      setUlt(null);
    };
    /** Where things happen on screen: the pet, its mouth (mirrored with the art), the beam direction and how far it can reach. */
    const locate = (mouth: { x: number; y: number }, aim: "room" | "face" | "right", face: 1 | -1, k = 1) => {
      const rect = sprite.getBoundingClientRect();
      const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
      const dir: 1 | -1 = aim === "face" ? face : aim === "right" ? 1 : window.innerWidth - cx >= cx ? 1 : -1;
      const mirrored = (def.view === "side" && face === -1) || (aim === "room" && dir === -1);
      // A transformed pet grows from its feet, so the mouth moves up and out with it.
      const mx0 = rect.left + (rect.width * (mirrored ? 100 - mouth.x : mouth.x)) / 100;
      const my0 = rect.top + (rect.height * mouth.y) / 100;
      const mx = cx + (mx0 - cx) * k;
      const my = rect.bottom - (rect.bottom - my0) * k;
      const room = dir > 0 ? window.innerWidth - mx : mx;
      const length = Math.max(220, Math.min(room - 30, Math.max(420, window.innerWidth * 0.72)));
      return { rect, cx, cy, dir, mx, my, length };
    };
    const abilTimers: number[] = [];
    const endAbility = () => {
      abilTimers.forEach((id) => window.clearTimeout(id));
      abilTimers.length = 0;
      delete sprite.dataset.abil;
      document.body.classList.remove("pet-sight");
      setAbil(null);
    };
    /** Plays an ability's cinematic. The pet's own pose comes from the brain; this adds the effects around it. */
    const startAbility = (key: string, face: 1 | -1, tx: number) => {
      const ab = def.abilities?.find((a) => a.id === key);
      if (!ab) return;
      endAbility();
      const { cx, cy, dir, mx, my, length, rect } = locate(def.ultimate?.mouth ?? { x: 50, y: 50 }, def.ultimate?.aim ?? "right", face);
      sprite.dataset.abil = key;
      setAbil({ id: Date.now(), key, seconds: ab.seconds, cx, cy, size: rect.width, mx, my, dir, length, tx, color: def.ultimate?.color ?? "#a78bfa", color2: def.ultimate?.color2 ?? "#fde68a", file: def.file });
      if (key === "astral_sight") {
        abilTimers.push(window.setTimeout(() => document.body.classList.add("pet-sight"), 1100));
        abilTimers.push(window.setTimeout(() => document.body.classList.remove("pet-sight"), 3400));
      }
      abilTimers.push(window.setTimeout(endAbility, ab.seconds * 1000 + 150));
    };
    /** Starts the cinematic: works out where the mouth is on screen and how far the beam can go, then runs its phases. */
    const startUltimate = (face: 1 | -1) => {
      const cfg = def.ultimate;
      if (!cfg) return;
      const k = cfg.grow ?? 1;
      const { rect, cx, cy, dir, mx, my, length } = locate(cfg.mouth, cfg.aim, face, k);
      ultimateCooldown.readyAt = Date.now() + (ULTIMATE_SECONDS + (def.keyCast ? 0 : ultimateCooldown.seconds)) * 1000;
      sprite.style.setProperty("--ult", cfg.color);
      sprite.style.setProperty("--dir", String(dir));
      sprite.style.setProperty("--ult-grow", String(k));
      sprite.style.setProperty("--ult-lift", `${(cfg.lift ?? 0) * rect.width}px`);
      sprite.dataset.ult = "charge";
      setUlt({ id: Date.now(), cfg, cx, cy, size: rect.width, mx, my, dir, length });
      const at = (ms: number, fn: () => void) => ultTimers.push(window.setTimeout(fn, ms));
      // The big moment: the beam (2.6s), or the supernova blast for casters with no beam (4.4s).
      const fireAt = cfg.beam === "none" ? 4400 : 2600;
      at(fireAt, () => { sprite.dataset.ult = "fire"; document.body.classList.add("pet-shake"); });
      at(fireAt + 1000, () => { document.body.classList.remove("pet-shake"); document.body.classList.add("pet-shake-big"); });
      at(fireAt + 1700, () => { sprite.dataset.ult = cfg.lift ? "land" : "rest"; });
      at(fireAt + 2200, () => { document.body.classList.remove("pet-shake-big"); document.body.classList.add("pet-shake"); });
      at(fireAt + 2700, () => document.body.classList.remove("pet-shake"));
      at(ULTIMATE_SECONDS * 1000 + 100, endUltimate);
    };

    // Key-to-cast: a letter key casts its skill. Never while typing in a field, on the typing pages, or during another cast.
    let comboEl: HTMLSpanElement | null = null, comboTimer = 0;
    const readyAt: Record<string, number> = {}; // per-skill cooldowns (ms timestamps)
    const skillName = (id: string) => (id === "ultimate" ? def.ultimate?.name : def.abilities?.find((a) => a.id === id)?.name) ?? "";
    const casting = () => ultTimers.length > 0 || abilTimers.length > 0 || brain.ultT > 0;
    const clearCombo = () => { window.clearTimeout(comboTimer); comboEl?.remove(); comboEl = null; };
    const castKey = (e: KeyboardEvent) => {
      const map = def.keyCast;
      if (!map || e.repeat || e.metaKey || e.ctrlKey || e.altKey || live.current.typingRoute || casting()) return;
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (target?.closest('input,textarea,select,[contenteditable=""],[contenteditable="true"]')) return;
      const id = map[e.key.toLowerCase()];
      if (!id) return;
      const wait = (readyAt[id] ?? 0) - Date.now();
      clearCombo();
      comboEl = document.createElement("span");
      comboEl.className = "pet-combo";
      if (wait > 0) {
        comboEl.textContent = `${skillName(id)} · ${Math.ceil(wait / 1000)}s`;
      } else {
        const ab = def.abilities?.find((a) => a.id === id);
        const seconds = id === "ultimate" ? ULTIMATE_SECONDS : ab?.seconds ?? 0;
        readyAt[id] = Date.now() + (seconds + ((id === "ultimate" ? def.ultimate?.cooldown : ab?.cooldown) ?? 0)) * 1000;
        queue.push(id === "ultimate" ? { type: "ultimate", pet: def.id } : { type: "ability", pet: def.id, id });
        // A short label so the key press visibly means something.
        comboEl.textContent = `${e.key.toUpperCase()} · ${skillName(id)}`;
      }
      fx.appendChild(comboEl);
      comboTimer = window.setTimeout(clearCombo, 1200);
    };
    window.addEventListener("keydown", castKey);

    const rectPad = (touch: boolean) => (touch ? 16 : 6);
    const insidePet = (cx: number, cy: number, pad: number) => {
      const size = sizeNow();
      const bottom = window.innerHeight - 10 - lift - brain.air;
      return cx >= brain.x - pad && cx <= brain.x + size + pad && cy >= bottom - size - pad && cy <= bottom + pad;
    };
    const setHover = (on: boolean) => {
      if (on === hoverOn) return;
      hoverOn = on;
      if (on) document.documentElement.setAttribute("data-pet-hover", "");
      else document.documentElement.removeAttribute("data-pet-hover");
    };

    // Passive listeners only: the pet never blocks, delays or cancels the page's own input.
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      if (drag.on) { pointer.x = e.clientX; pointer.y = e.clientY; pointer.active = false; pointer.at = performance.now(); drag.moved = true; return; }
      pointer.x = e.clientX; pointer.y = e.clientY; pointer.active = true; pointer.at = performance.now();
      const target = e.target instanceof Element ? e.target : null;
      setHover(insidePet(e.clientX, e.clientY, rectPad(false)) && !(target?.closest(INTERACTIVE_SELECTOR)));
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "touch" || e.button !== 0) return;
      const target = e.target instanceof Element ? e.target : null;
      if (target?.closest(INTERACTIVE_SELECTOR) || !insidePet(e.clientX, e.clientY, rectPad(false))) return;
      const size = sizeNow();
      drag.on = true; drag.moved = false; drag.tilt = 0; drag.lastX = e.clientX;
      drag.offX = e.clientX - brain.x;
      drag.offY = e.clientY - (window.innerHeight - 10 - lift - size);
      pointer.x = e.clientX; pointer.y = e.clientY; pointer.active = false;
      brain.goal = null; brain.vx = 0;
      e.preventDefault(); // no text selection while carrying the pet
      document.documentElement.setAttribute("data-pet-drag", "");
    };
    const onUp = () => {
      if (!drag.on) return;
      const moved = drag.moved;
      drag.on = false;
      document.documentElement.removeAttribute("data-pet-drag");
      if (moved) { justDragged = performance.now(); queue.push({ type: "click" }); } // a happy reaction on being put down
    };
    const onLeave = () => { pointer.active = false; setHover(false); };
    const onClick = (e: MouseEvent) => {
      if (performance.now() - justDragged < 250) return; // the release of a drag is not a click on the pet
      const target = e.target instanceof Element ? e.target : null;
      // A button or link under the pet was clicked: that click belongs to it. Text areas are fine, since the click still reaches them.
      if (target?.closest(ACTION_SELECTOR)) return;
      // Touch screens have no hover, so give fingers a bigger target.
      if (insidePet(e.clientX, e.clientY, rectPad(window.matchMedia("(hover: none)").matches))) {
        queue.push({ type: "click" });
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (!live.current.typingRoute || ["Shift", "Control", "Alt", "Meta", "CapsLock", "Tab"].includes(e.key)) return;
      typingUntil = performance.now() + TYPING_GRACE_MS;
    };
    const unsubscribe = subscribePetEvents((ev) => {
      if (ev.type === "ability" && (!def.abilities || (ev.pet && ev.pet !== def.id))) return;
      if (ev.type === "ultimate" && (!def.ultimate || (ev.pet && ev.pet !== def.id) || Date.now() < ultimateCooldown.readyAt)) return;
      queue.push(ev);
    });

    const frame = (t: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      if (dt <= 0) return;
      const cfg = live.current;
      const size = sizeNow();
      if (pointer.active && t - pointer.at > 4000) pointer.active = false; // a still cursor stops counting as attention
      lift = Math.min(lift, Math.max(0, window.innerHeight - 10 - size)); // keep it on screen after a resize
      if (drag.on) {
        brain.x = Math.min(Math.max(pointer.x - drag.offX, 0), Math.max(0, window.innerWidth - size));
        lift = Math.min(Math.max(window.innerHeight - 10 - size - (pointer.y - drag.offY), 0), Math.max(0, window.innerHeight - 10 - size));
        const want = Math.max(-28, Math.min(28, (pointer.x - drag.lastX) * 1.6 + Math.sin(t / 130) * 5));
        drag.lastX = pointer.x;
        drag.tilt += (want - drag.tilt) * Math.min(1, dt * 10);
        brain.vx = 0; brain.goal = null; brain.air = 0;
        brain.anim = "idle"; brain.animT = 0; brain.animDur = 0;
      } else if (Math.abs(drag.tilt) > 0.2) drag.tilt *= Math.max(0, 1 - 10 * dt);
      else drag.tilt = 0;
      const typing = cfg.typingRoute && cfg.settings.whileTyping !== "stay" && t < typingUntil;
      const quiet = typing && cfg.settings.whileTyping === "quiet";
      const hidden = typing && cfg.settings.whileTyping === "hide";
      if (!drag.on) stepBrain(brain, def, {
        dt, pointer: pointer.active ? { x: pointer.x, y: pointer.y, active: true } : null, centerY: window.innerHeight - 10 - lift - size / 2, size,
        minX: 8, maxX: Math.max(8, window.innerWidth - size - 8), motion: cfg.motion, quiet, cursor: cfg.settings.cursor, speech: cfg.settings.speech, events: queue.splice(0),
      }, rand);

      brain.air = Math.min(brain.air, Math.max(0, window.innerHeight - 10 - size - lift)); // never fly off the top of the screen
      // ---- Apply to the DOM only what changed ----
      const x = Math.round(brain.x * 10) / 10;
      const air = Math.round(brain.air * 10) / 10;
      if (air !== applied.air) { root.style.setProperty("--air", String(air)); sprite.toggleAttribute("data-air", air > 4); applied.air = air; }
      const tf = `translate3d(${x}px,${-Math.round((lift + air) * 10) / 10}px,0) rotate(${Math.round(drag.tilt * 10) / 10}deg)`;
      if (tf !== applied.tf) { body.style.transform = tf; applied.tf = tf; }
      if (size !== applied.size) { root.style.setProperty("--pet-size", `${size}px`); applied.size = size; }
      if (brain.anim !== applied.anim) { sprite.dataset.anim = brain.anim; applied.anim = brain.anim; }
      const trick = brain.trick ?? "";
      if (trick !== applied.trick) { if (trick) sprite.dataset.trick = trick; else delete sprite.dataset.trick; applied.trick = trick; }
      const blink = brain.blinking > 0;
      if (blink !== applied.blink) { if (blink) sprite.dataset.blink = "1"; else delete sprite.dataset.blink; applied.blink = blink; }
      if (brain.face !== applied.face) { sprite.style.setProperty("--face", String(brain.face)); applied.face = brain.face; }
      const look = Math.round(brain.look * 100) / 100, lookY = Math.round(brain.lookY * 100) / 100;
      if (look !== applied.look) { sprite.style.setProperty("--look", String(look)); applied.look = look; }
      if (lookY !== applied.lookY) { sprite.style.setProperty("--lookY", String(lookY)); applied.lookY = lookY; }
      const dim = quiet && !brain.protect; // a celebration is never dimmed
      if (dim !== applied.quiet) { root.classList.toggle("is-quiet", dim); applied.quiet = dim; }
      if (hidden !== applied.hidden) { root.classList.toggle("is-hidden", hidden); applied.hidden = hidden; }

      if (brain.say && brain.say.id !== sayId) {
        sayId = brain.say.id;
        bubble.textContent = brain.say.text;
        const cx = brain.x + size / 2, margin = 100;
        bubble.style.setProperty("--bshift", `${cx < margin ? margin - cx : cx > window.innerWidth - margin ? window.innerWidth - margin - cx : 0}px`);
        bubble.classList.add("show");
      } else if (!brain.say && bubble.classList.contains("show")) {
        bubble.classList.remove("show");
      }
      if (brain.ult && brain.ult.id !== ultId) { ultId = brain.ult.id; startUltimate(brain.ult.face); }
      if (brain.abil && brain.abil.id !== abilId) { abilId = brain.abil.id; startAbility(brain.abil.key, brain.abil.face, brain.abil.tx); }
      // Movement and mood particles: star dust behind footsteps and wings, stars over a sleeper...
      if (def.ambient && cfg.motion === "full" && t > ambientAt && !hidden) {
        const rule = def.ambient[brain.air > 4 ? "fly" : brain.anim] ?? (brain.anim === "follow" ? def.ambient.walk : undefined);
        if (rule) {
          ambientAt = t + rule.every * (0.8 + rand() * 0.5);
          const span = document.createElement("span");
          span.className = rule.world ? "pet-dust pet-dust-world" : "pet-emoji pet-dust";
          span.textContent = rule.glyphs[Math.floor(rand() * rule.glyphs.length)];
          span.style.setProperty("--dy", `${Math.round(size * (0.25 + rand() * 0.55))}px`);
          if (rule.world) {
            // A trail: dropped in the page at the pet's tail end, so it stays behind as the pet moves on.
            const r = sprite.getBoundingClientRect();
            span.style.left = `${Math.round(r.left + r.width * (0.5 - brain.face * 0.28) + (rand() - 0.5) * r.width * 0.3)}px`;
            span.style.top = `${Math.round(r.top + r.height * (0.45 + rand() * 0.4))}px`;
            span.style.setProperty("--fs", `${Math.round(size * (0.14 + rand() * 0.1))}px`);
            document.body.appendChild(span);
          } else {
            span.style.setProperty("--dx", `${Math.round((rand() - 0.5) * size * 0.9) - brain.face * Math.round(size * 0.18)}px`);
            fx.appendChild(span);
          }
          span.addEventListener("animationend", () => span.remove(), { once: true });
          window.setTimeout(() => span.remove(), 2400);
        }
      }
      if (brain.bolt && brain.bolt.id !== boltId && def.magic) {
        boltId = brain.bolt.id;
        const b = document.createElement("span");
        b.className = "pet-bolt";
        b.textContent = def.magic.emoji;
        b.style.setProperty("--dir", String(brain.bolt.face));
        b.style.setProperty("--bolt", def.magic.color);
        b.addEventListener("animationend", () => b.remove(), { once: true });
        fx.appendChild(b);
        window.setTimeout(() => b.remove(), 2000);
      }
      if (brain.fx && brain.fx.id !== fxId) {
        fxId = brain.fx.id;
        const span = document.createElement("span");
        span.className = "pet-emoji";
        span.textContent = brain.fx.emoji;
        span.style.setProperty("--dx", `${Math.round((rand() - 0.5) * 36)}px`);
        span.addEventListener("animationend", () => span.remove(), { once: true });
        fx.appendChild(span);
        window.setTimeout(() => span.remove(), 2000); // reduced-motion fallback
      }
    };

    const start = () => { cancelAnimationFrame(raf); last = performance.now(); raf = requestAnimationFrame(frame); };
    const onVisibility = () => { if (document.hidden) cancelAnimationFrame(raf); else start(); };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("click", onClick, { passive: true });
    window.addEventListener("pointerdown", onDown); // not passive: it cancels text selection when the pet is grabbed
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    // Capture phase: still sees keys if a page handler stops propagation.
    window.addEventListener("keydown", onKey, { passive: true, capture: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    window.addEventListener("blur", onLeave);
    document.addEventListener("visibilitychange", onVisibility);
    start();
    return () => {
      cancelAnimationFrame(raf);
      unsubscribe();
      endUltimate();
      endAbility();
      clearCombo();
      window.removeEventListener("keydown", castKey);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("click", onClick);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      document.documentElement.removeAttribute("data-pet-drag");
      window.removeEventListener("keydown", onKey, { capture: true });
      document.documentElement.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("blur", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      setHover(false);
    };
  }, [def]);

  return (
    <>
      {ult && <PetUltimate run={ult} />}
      {abil && <PetAbility run={abil} />}
      <div ref={rootRef} className="pet-root" aria-hidden="true">
        <div ref={bodyRef} className="pet-body">
          <div ref={bubbleRef} className="pet-bubble" />
          <div ref={fxRef} className="pet-fx" />
          <div className="pet-shadow" />
          <PetSprite ref={spriteRef} def={def} motion={motion} />
        </div>
      </div>
    </>
  );
}

/** Small always-available control: hide or show the companion, or open the collection. */
function PetControls({ name, enabled, locked = false, ultimates = [], abilities = [], keyCasters = [], canCast = false }: { name: string; enabled: boolean; locked?: boolean; ultimates?: PetDefinition[]; abilities?: { pet: PetDefinition; ab: Ability }[]; keyCasters?: PetDefinition[]; canCast?: boolean }) {
  const [open, setOpen] = useState(false);
  const [wait, setWait] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("pointerdown", onDown); window.removeEventListener("keydown", onKey); };
  }, [open]);
  const { store } = useTypingProgress();
  const now = useNow();
  const streak = now ? currentStreak(store.sessions, now) : 0;
  const doneToday = now ? practiceDays(store.sessions).has(dayKey(now)) : false;
  const nextGoal = PETS.map((p) => p.unlockStreak).sort((a, b) => a - b).find((d) => d > streak);
  return (
    <div ref={ref} className="pet-ctl">
      {open && (
        <div className="pet-ctl-menu" role="menu" aria-label="Pet companion">
          {locked ? <small>Locked · reach a {nextGoal ?? 3}-day streak to unlock your first pet</small> : <>
            <small>{name} {enabled ? "keeping you company" : "resting"}</small>
            <button type="button" role="menuitem" onClick={() => { setPetEnabled(!enabled); setOpen(false); }}>{enabled ? "🙈 Hide companion" : "👀 Show companion"}</button>
          </>}
          {ultimates.map((p) => (
            <button key={p.id} type="button" role="menuitem" disabled={!canCast || wait > 0} onClick={() => { emitPetEvent({ type: "ultimate", pet: p.id }); setOpen(false); }}>
              ⚡ {p.ultimate?.name}{wait > 0 ? ` · ${wait}s` : !canCast ? " · needs animations" : ""}
            </button>
          ))}
          {abilities.map(({ pet, ab }) => (
            <button key={`${pet.id}-${ab.id}`} type="button" role="menuitem" disabled={!canCast} title={ab.blurb} onClick={() => { emitPetEvent({ type: "ability", pet: pet.id, id: ab.id }); setOpen(false); }}>✨ {ab.name}</button>
          ))}
          {keyCasters.map((p) => <small key={p.id}>⌨️ Press {Object.keys(p.keyCast ?? {}).join(" ").toUpperCase()} to cast {p.name.split(" ")[0]}&apos;s skills (not while typing).</small>)}
          {ultimates.length > 0 && <small>Or click your pet five times, fast.</small>}
          <small>🔥 {streak}-day streak{nextGoal ? ` · next pet at ${nextGoal} days` : ""}</small>
          <small>{doneToday ? "✅ Today counted. Come back tomorrow to keep it going." : "Finish a lesson or game with 10+ correct characters to add streak points."}</small>
          {!doneToday && <>
            <Link href="/learn/english" role="menuitem" onClick={() => setOpen(false)}>⌨️ Practice English</Link>
            <Link href="/learn/khmer" role="menuitem" onClick={() => setOpen(false)}>⌨️ Practice Khmer</Link>
          </>}
          <Link href="/pets" role="menuitem" onClick={() => setOpen(false)}>🐾 Pet collection</Link>
        </div>
      )}
      <button type="button" className="pet-ctl-btn" aria-haspopup="menu" aria-expanded={open} aria-label={locked ? "Pet companion (locked)" : "Pet companion menu"} title={locked ? "Locked: build a streak to unlock" : "Pet companion"} onClick={() => { setWait(Math.max(0, Math.ceil((ultimateCooldown.readyAt - Date.now()) / 1000))); setOpen((v) => !v); }}>{locked ? "🔒" : "🐾"}</button>
    </div>
  );
}
