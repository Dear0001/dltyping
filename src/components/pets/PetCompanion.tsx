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
    const applied = { x: NaN, anim: "", blink: false, face: 0, look: NaN, lookY: NaN, size: 0, quiet: false, hidden: false };
    let sayId = 0, fxId = 0;

    const rectPad = (touch: boolean) => (touch ? 16 : 6);
    const insidePet = (cx: number, cy: number, pad: number) => {
      const size = sizeNow();
      return cx >= brain.x - pad && cx <= brain.x + size + pad && cy >= window.innerHeight - 10 - size - pad && cy <= window.innerHeight - 10 + pad;
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
      pointer.x = e.clientX; pointer.y = e.clientY; pointer.active = true; pointer.at = performance.now();
      const target = e.target instanceof Element ? e.target : null;
      setHover(insidePet(e.clientX, e.clientY, rectPad(false)) && !(target?.closest(INTERACTIVE_SELECTOR)));
    };
    const onLeave = () => { pointer.active = false; setHover(false); };
    const onClick = (e: MouseEvent) => {
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
      const typing = cfg.typingRoute && cfg.settings.whileTyping !== "stay" && t < typingUntil;
      const quiet = typing && cfg.settings.whileTyping === "quiet";
      const hidden = typing && cfg.settings.whileTyping === "hide";
      stepBrain(brain, def, {
        dt, pointer: pointer.active ? { x: pointer.x, y: pointer.y, active: true } : null, centerY: window.innerHeight - 10 - size / 2, size,
        minX: 8, maxX: Math.max(8, window.innerWidth - size - 8), motion: cfg.motion, quiet, cursor: cfg.settings.cursor, speech: cfg.settings.speech, events: queue.splice(0),
      }, rand);

      // ---- Apply to the DOM only what changed ----
      const x = Math.round(brain.x * 10) / 10;
      if (x !== applied.x) { body.style.transform = `translate3d(${x}px,0,0)`; applied.x = x; }
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
