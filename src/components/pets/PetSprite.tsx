"use client";

import { forwardRef, useEffect, useState } from "react";
import { loadPetArt } from "@/lib/pets/pet-art";
import type { PetAnim, PetDefinition } from "@/lib/pets/pet-catalog";
import type { MotionMode } from "@/lib/pets/pet-brain";
import "./pets.css";

type Props = {
  def: PetDefinition;
  anim?: PetAnim;
  motion?: MotionMode;
  /** Draw as a flat dark silhouette (locked pets). */
  silhouette?: boolean;
  className?: string;
};

const MAGIC_SPARKLES = [
  { glyph: "✦", left: "6%", delay: "0s", drift: "-6px" }, { glyph: "✧", left: "30%", delay: "-.7s", drift: "5px" },
  { glyph: "✦", left: "55%", delay: "-1.4s", drift: "-4px" }, { glyph: "✧", left: "78%", delay: "-2.1s", drift: "6px" },
  { glyph: "✨", left: "92%", delay: "-2.8s", drift: "-5px" }, { glyph: "✦", left: "44%", delay: "-3.5s", drift: "4px" },
];

/**
 * A pet drawn as inline SVG so CSS can animate its parts (tail, ears, wings, eyes...).
 * Animation state is plain data attributes, which the companion updates directly on the DOM node
 * every frame without re-rendering React. Falls back to the plain image if inline loading fails.
 */
const PetSprite = forwardRef<HTMLDivElement, Props>(function PetSprite({ def, anim = "idle", motion = "full", silhouette = false, className = "" }, ref) {
  const [markup, setMarkup] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    loadPetArt(def).then((svg) => {
      if (!live) return;
      if (svg) setMarkup(svg);
    });
    return () => { live = false; };
  }, [def]);

  return (
    <div
      ref={ref}
      className={`pet-sprite ${silhouette ? "is-silhouette" : ""} ${className}`}
      data-pet={def.id} data-anim={anim} data-move={def.locomotion} data-view={def.view ?? "front"} data-motion={motion} data-aura={def.aura}
      aria-hidden="true"
    >
      {!silhouette && (
        // Every pet gets a soft halo; legendary and special pets also get rising sparkles.
        <div className="pet-magic" data-rarity={def.rarity} aria-hidden="true">
          <i className="pet-magic-halo" />
          {(def.rarity === "legendary" || def.rarity === "special") && MAGIC_SPARKLES.map((sp, i) => <b key={i} style={{ "--md": sp.delay, "--mx": sp.drift, left: sp.left } as React.CSSProperties}>{sp.glyph}</b>)}
        </div>
      )}
      {markup ? (
        <div className="pet-art" dangerouslySetInnerHTML={{ __html: markup }} />
      ) : (
        // Shown while the SVG loads, and if it can't be inlined: still a pet, just not part-animated.
        <div className="pet-art">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/images/${def.file}`} alt="" draggable={false} />
        </div>
      )}
    </div>
  );
});

export default PetSprite;
