"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import PetSprite from "@/components/pets/PetSprite";
import { usePetState } from "@/hooks/usePets";
import { createBrain, stepBrain, type MotionMode } from "@/lib/pets/pet-brain";
import type { PetDefinition } from "@/lib/pets/pet-catalog";
import { subscribePetEvents, type PetEvent } from "@/lib/pets/pet-events";
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
  const { state, hydrated, active } = usePetState();
  const pathname = usePathname();
  const systemReduced = useSystemReducedMotion();
  if (!hydrated || !active) return null;
  const typingRoute = isTypingRoute(pathname);
  const show = state.enabled && !isPetHiddenRoute(pathname);
  return (
    <>
      {show && <PetStage key={active.id} def={active} settings={state.settings} motion={effectiveMotion(state.settings.animations, systemReduced)} typingRoute={typingRoute} />}
      <PetControls name={active.name} enabled={state.enabled} />
    </>
  );
}

type StageProps = { def: PetDefinition; settings: PetSettings; motion: MotionMode; typingRoute: boolean };

function PetStage({ def, settings, motion, typingRoute }: StageProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const spriteRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const fxRef = useRef<HTMLDivElement>(null);
  const live = useRef({ settings, motion, typingRoute });
  useEffect(() => {
    live.current = { settings, motion, typingRoute };
  });

  useEffect(() => {
    const root = rootRef.current, body = bodyRef.current, sprite = spriteRef.current, bubble = bubbleRef.current, fx = fxRef.current;
    if (!root || !body || !sprite || !bubble || !fx) return;
    const rand = Math.random;
    const sizeNow = () => Math.min(PET_SIZES[live.current.settings.size], window.innerWidth < 520 ? MOBILE_MAX_SIZE : 999);
    const brain = createBrain(def, Math.max(8, window.innerWidth * 0.25), rand);
    const pointer = { x: 0, y: 0, active: false, at: 0 };
    const queue: PetEvent[] = [];
    let typingUntil = 0;
    let raf = 0, last = 0, hoverOn = false;
    // Height above the ground line (0 = standing on the bottom edge). Dragging changes it; roaming keeps it.
    let lift = 0;
    const drag = { on: false, offX: 0, offY: 0, moved: false, lastX: 0, tilt: 0 };
    let justDragged = 0;
    const applied = { tf: "", air: NaN, x: NaN, anim: "", blink: false, face: 0, look: NaN, lookY: NaN, size: 0, quiet: false, hidden: false };
    let sayId = 0, fxId = 0;

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
      if (insidePet(e.clientX, e.clientY, rectPad(window.matchMedia("(hover: none)").matches))) queue.push({ type: "click" });
    };
    const onKey = (e: KeyboardEvent) => {
      if (!live.current.typingRoute || ["Shift", "Control", "Alt", "Meta", "CapsLock", "Tab"].includes(e.key)) return;
      typingUntil = performance.now() + TYPING_GRACE_MS;
    };
    const unsubscribe = subscribePetEvents((ev) => queue.push(ev));

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
    <div ref={rootRef} className="pet-root" aria-hidden="true">
      <div ref={bodyRef} className="pet-body">
        <div ref={bubbleRef} className="pet-bubble" />
        <div ref={fxRef} className="pet-fx" />
        <div className="pet-shadow" />
        <PetSprite ref={spriteRef} def={def} motion={motion} />
      </div>
    </div>
  );
}

/** Small always-available control: hide or show the companion, or open the collection. */
function PetControls({ name, enabled }: { name: string; enabled: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("pointerdown", onDown); window.removeEventListener("keydown", onKey); };
  }, [open]);
  return (
    <div ref={ref} className="pet-ctl">
      {open && (
        <div className="pet-ctl-menu" role="menu" aria-label="Pet companion">
          <small>{name} {enabled ? "is keeping you company" : "is resting"}</small>
          <button type="button" role="menuitem" onClick={() => { setPetEnabled(!enabled); setOpen(false); }}>{enabled ? "🙈 Hide companion" : "👀 Show companion"}</button>
          <Link href="/pets" role="menuitem" onClick={() => setOpen(false)}>🐾 Pet collection</Link>
        </div>
      )}
      <button type="button" className="pet-ctl-btn" aria-haspopup="menu" aria-expanded={open} aria-label="Pet companion menu" title="Pet companion" onClick={() => setOpen((v) => !v)}>🐾</button>
    </div>
  );
}
