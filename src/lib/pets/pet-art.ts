import type { PetDefinition } from "@/lib/pets/pet-catalog";

/** Swaps hex colours (case-insensitive). Used to make a variant, like the Starlight Dragon, from existing art. */
export function recolor(svg: string, palette?: Record<string, string>): string {
  if (!palette) return svg;
  let out = svg;
  for (const [from, to] of Object.entries(palette)) out = out.replace(new RegExp(from, "gi"), to);
  return out;
}

/**
 * Prepares SVG text for inline use. The art is ours, but it is still parsed and stripped of
 * anything executable (scripts, event handlers, external references) before it touches the DOM.
 * Fixed width/height are removed so CSS controls the size.
 */
export function sanitizeSvg(text: string): string | null {
  if (typeof DOMParser === "undefined") return null;
  const doc = new DOMParser().parseFromString(text, "image/svg+xml");
  const svg = doc.documentElement;
  if (!svg || svg.nodeName.toLowerCase() !== "svg" || doc.querySelector("parsererror")) return null;
  svg.querySelectorAll("script, foreignObject, iframe, object, embed, use, image").forEach((n) => n.remove());
  for (const el of [svg, ...Array.from(svg.querySelectorAll("*"))]) {
    for (const attr of Array.from(el.attributes)) {
      if (/^on/i.test(attr.name) || /javascript:/i.test(attr.value) || /^(xlink:)?href$/i.test(attr.name)) el.removeAttribute(attr.name);
    }
  }
  svg.removeAttribute("width");
  svg.removeAttribute("height");
  svg.setAttribute("focusable", "false");
  svg.setAttribute("aria-hidden", "true");
  return svg.outerHTML;
}

const cache = new Map<string, Promise<string | null>>();

/** Loads and caches a pet's inline SVG. Resolves null on any failure so callers can show the plain image instead. */
export function loadPetArt(def: PetDefinition): Promise<string | null> {
  const key = `${def.file}|${JSON.stringify(def.palette ?? {})}`;
  let hit = cache.get(key);
  if (!hit) {
    hit = fetch(`/images/${def.file}`)
      .then((r) => (r.ok ? r.text() : null))
      .then((text) => (text ? sanitizeSvg(recolor(text, def.palette)) : null))
      .catch(() => null);
    cache.set(key, hit);
  }
  return hit;
}
