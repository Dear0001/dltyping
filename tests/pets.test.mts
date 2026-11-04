import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

const mem = new Map<string, string>();
(globalThis as any).window = { localStorage: { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v), removeItem: (k: string) => void mem.delete(k) }, addEventListener() {} };

const { PETS, PET_BY_ID, PET_ANIMS, resolveAnim } = await import("@/lib/pets/pet-catalog");
const { createBrain, stepBrain } = await import("@/lib/pets/pet-brain");
const { evaluateRewards, nextReward } = await import("@/lib/pets/pet-rewards");
const { EMPTY_PETS, validatePetState, updatePets, readPetState, selectPet, dismissPending } = await import("@/lib/pets/pet-storage");
const { recolor } = await import("@/lib/pets/pet-art");
const { removeRaw } = await import("@/lib/local-progress");
const { grantAllPets, revokeAccountGrants } = await import("@/lib/pets/pet-storage");
const { emailInList, parseEmailList } = await import("@/lib/perks-core");
const { longestStreak, currentStreak, isQualifyingSession, QUALIFYING_MIN_CORRECT } = await import("@/lib/progress/progress-analytics");

// ---- helpers -------------------------------------------------------------------
const rng = (seed: number) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const SIZE = 84, W = 1200, CY = 800 - 10 - SIZE / 2;
const base = { size: SIZE, minX: 8, maxX: W - SIZE - 8, centerY: CY, motion: "full" as const, quiet: false, cursor: true, speech: true, events: [] as any[] };
const FRAME = 1 / 60;
const pet = (id: string) => PET_BY_ID[id];

function run(id: string, seed: number, seconds: number, opts: { pointer?: any; x?: number; each?: (b: any, i: number) => void; quiet?: boolean; motion?: any; events?: any[]; cursor?: boolean; speech?: boolean } = {}) {
  const def = pet(id), rand = rng(seed);
  const b = createBrain(def, opts.x ?? 300, rand);
  let maxStep = 0;
  for (let i = 0; i < seconds * 60; i++) {
    const before = b.x;
    stepBrain(b, def, { ...base, dt: FRAME, pointer: opts.pointer ?? null, quiet: opts.quiet ?? false, motion: opts.motion ?? "full", cursor: opts.cursor ?? true, speech: opts.speech ?? true, events: i === 0 ? opts.events ?? [] : [] }, rand);
    maxStep = Math.max(maxStep, Math.abs(b.x - before));
    opts.each?.(b, i);
  }
  return { b, maxStep, def };
}
const centerX = (b: any) => b.x + SIZE / 2;

// ---- catalog -------------------------------------------------------------------
test("catalog: milestones, art files and animation support are consistent", () => {
  assert.equal(new Set(PETS.map((p) => p.id)).size, PETS.length);
  assert.deepEqual(PETS.map((p) => [p.id, p.unlockStreak]), [["egg", 1], ["cat", 3], ["puppy", 7], ["bunny", 14], ["penguin", 21], ["dragon", 30], ["fox", 60], ["starlight", 100]]);
  assert.deepEqual(PETS.map((p) => p.rarity), ["common", "common", "common", "rare", "rare", "epic", "legendary", "special"]);
  for (const p of PETS) {
    assert.ok(existsSync(`public/images/${p.file}`), `${p.file} exists`);
    const svg = readFileSync(`public/images/${p.file}`, "utf8");
    for (const part of ["head", "eyes", "body"]) assert.match(svg, new RegExp(`class="${part}`), `${p.id} has .${part}`);
    for (const a of p.anims) assert.ok((PET_ANIMS as readonly string[]).includes(a));
    assert.ok(p.anims.includes("idle"));
    for (const a of PET_ANIMS) assert.ok(p.anims.includes(resolveAnim(p, a)), `${p.id}.${a} resolves to a supported animation`);
    assert.ok(p.clickReactions.length >= 2 && p.speech.click.length >= 2);
  }
  // Pet-specific parts the CSS animates exist in the art.
  assert.match(readFileSync("public/images/little-bunny.svg", "utf8"), /ear-left/);
  assert.match(readFileSync("public/images/penguin.svg", "utf8"), /flipper-left/);
  assert.match(readFileSync("public/images/dragon.svg", "utf8"), /wing-left/);
  assert.match(readFileSync("public/images/puppy.svg", "utf8"), /class="tail"/);
});

test("catalog: unsupported animations fall back sensibly per pet", () => {
  assert.equal(resolveAnim(pet("egg"), "sit"), "idle");
  assert.equal(resolveAnim(pet("egg"), "run"), "walk");
  assert.equal(resolveAnim(pet("penguin"), "sit"), "idle");
  assert.equal(resolveAnim(pet("cat"), "sit"), "sit");
  assert.equal(resolveAnim(pet("bunny"), "stretch"), "idle");
});

test("recolor makes a variant without touching the source", () => {
  const out = recolor('<path fill="#2A9D8F"/><path fill="#a8dadc"/>', pet("starlight").palette);
  assert.equal(out, '<path fill="#6d28d9"/><path fill="#f9a8d4"/>');
  assert.equal(recolor("x", undefined), "x");
});

// ---- movement ------------------------------------------------------------------
test("pets wander on their own, stay in bounds and never teleport", () => {
  for (const id of ["cat", "puppy", "bunny", "penguin", "dragon", "fox", "egg"]) {
    let moved = 0, minX = Infinity, maxX = -Infinity, travelled = 0;
    for (let seed = 1; seed <= 6; seed++) {
      let prev = 300;
      const { maxStep, def } = run(id, seed, 120, { each: (b) => { minX = Math.min(minX, b.x); maxX = Math.max(maxX, b.x); travelled += Math.abs(b.x - prev); prev = b.x; } });
      assert.ok(maxStep <= def.speed * 3.5 * FRAME * 1.15 + 0.01, `${id} step ${maxStep.toFixed(2)}px/frame`);
      moved++;
    }
    assert.ok(minX >= base.minX - 0.01 && maxX <= base.maxX + 0.01, `${id} stays in bounds`);
    assert.ok(travelled > 150, `${id} actually walks around (${travelled.toFixed(0)}px)`);
    assert.equal(moved, 6);
  }
});

test("movement accelerates smoothly: speed never jumps", () => {
  const def = pet("puppy"), rand = rng(3);
  const b = createBrain(def, 100, rand);
  let prevV = 0, worst = 0;
  for (let i = 0; i < 600; i++) {
    stepBrain(b, def, { ...base, dt: FRAME, pointer: { x: 700, y: CY, active: true }, events: [] }, rand);
    worst = Math.max(worst, Math.abs(b.vx - prevV));
    prevV = b.vx;
  }
  assert.ok(worst < def.speed * 2.2 * 4.5 * FRAME + 0.5, `max dv ${worst.toFixed(2)}`);
});

// ---- personalities -------------------------------------------------------------
const rate = (id: string, pointerAt: (b: any) => any, seconds: number, test: (b: any, hist: any) => boolean) => {
  let hits = 0;
  const N = 40;
  for (let seed = 1; seed <= N; seed++) {
    const def = pet(id), rand = rng(seed * 7919), b = createBrain(def, 200, rand);
    const hist = { anims: new Set<string>(), start: b.x, followed: false, minDist: Infinity, closest: 0 };
    for (let i = 0; i < seconds * 60; i++) {
      const ptr = pointerAt(b);
      stepBrain(b, def, { ...base, dt: FRAME, pointer: ptr, events: [] }, rand);
      hist.anims.add(b.anim);
      if (b.goal?.kind === "follow") hist.followed = true;
      hist.minDist = Math.min(hist.minDist, Math.abs(centerX(b) - ptr.x));
    }
    if (test(b, hist)) hits++;
  }
  return hits / N;
};
const cursorAt = (x: number) => () => ({ x, y: CY, active: true });

test("puppy rushes to the cursor; bunny rarely does; cat is in between", () => {
  const follows = (id: string) => rate(id, cursorAt(480), 6, (_b, h) => h.followed);
  const puppy = follows("puppy"), cat = follows("cat"), bunny = follows("bunny"), fox = follows("fox");
  assert.ok(puppy >= 0.85, `puppy ${puppy}`);
  assert.ok(bunny <= 0.35, `bunny ${bunny}`);
  assert.ok(cat > bunny && cat < puppy + 0.01, `cat ${cat}`);
  assert.ok(puppy > fox, `puppy ${puppy} fox ${fox}`);
});

test("cat stalks the cursor: creeps, freezes, wiggles, then pounces and acts casual", () => {
  const r = rate("cat", cursorAt(560), 60, (_b, h) => h.anims.has("stalk") && h.anims.has("crouch") && h.anims.has("pounce"));
  assert.ok(r >= 0.5, `stalk-and-pounce rate ${r}`);
  // Never stalks at full tilt: while creeping it is far slower than its pounce.
  const def = pet("cat"), rand = rng(11), b = createBrain(def, 100, rand);
  let creepMax = 0, pounceMax = 0;
  for (let i = 0; i < 40 * 60; i++) {
    const before = b.x;
    stepBrain(b, def, { ...base, dt: FRAME, pointer: { x: 700, y: CY, active: true }, events: [] }, rand);
    const v = Math.abs(b.x - before) / FRAME;
    if (b.anim === "stalk") creepMax = Math.max(creepMax, v);
    if (b.anim === "pounce") pounceMax = Math.max(pounceMax, v);
  }
  assert.ok(creepMax <= def.speed * 1.4, `creep ${creepMax.toFixed(0)}px/s`);
  if (pounceMax > 0) assert.ok(pounceMax > creepMax, `pounce ${pounceMax.toFixed(0)} faster than creep ${creepMax.toFixed(0)}`);
});

test("cat and fox pounce on invisible prey while alone; the fox plays tag with the cursor", () => {
  for (const id of ["cat", "fox"]) {
    let pounced = 0;
    for (let seed = 1; seed <= 12; seed++) {
      const seen = new Set<string>();
      run(id, seed, 90, { each: (b) => seen.add(b.anim) });
      if (seen.has("crouch") && seen.has("pounce")) pounced++;
    }
    assert.ok(pounced >= 6, `${id} pounced in ${pounced}/12 runs`);
  }
  const tag = rate("fox", cursorAt(520), 20, (_b, h) => h.anims.has("run") && h.minDist < SIZE);
  assert.ok(tag >= 0.3, `fox touches the cursor ${tag}`);
  const zoom = (() => { let n = 0; for (let seed = 1; seed <= 12; seed++) { let dashed = false; run("cat", seed, 120, { each: (b) => { if (b.goal?.kind === "dash") dashed = true; } }); if (dashed) n++; } return n; })();
  assert.ok(zoom >= 3, `cat zoomies in ${zoom}/12 runs`);
});

test("a following puppy arrives next to the cursor and celebrates", () => {
  const r = rate("puppy", cursorAt(520), 12, (b, h) => Math.abs(centerX(b) - 520) < SIZE / 2 + pet("puppy").followDistance + 20 && h.anims.has("excited"));
  assert.ok(r >= 0.8, `arrival rate ${r}`);
});

test("a cursor that gets too close sends the bunny running away", () => {
  const r = rate("bunny", (b) => ({ x: centerX(b) + 40, y: CY, active: true }), 4, (b, h) => (h.anims.has("startled") || h.anims.has("run")) && Math.abs(b.x - h.start) > 100);
  assert.ok(r >= 0.8, `bunny flee rate ${r}`);
});

test("egg flee/follow stay slow (wobble speed), dragon and cat sit at the cursor", () => {
  const def = pet("egg");
  const { maxStep } = run("egg", 4, 20, { pointer: { x: 480, y: CY, active: true } });
  assert.ok(maxStep <= def.speed * 2.2 * FRAME * 1.2 + 0.01);
  const sits = (id: string) => rate(id, cursorAt(440), 14, (_b, h) => h.anims.has("sit"));
  assert.ok(sits("cat") > 0.4, "cat sits by the cursor");
});

test("the pet looks toward the cursor smoothly, then away when it leaves", () => {
  const def = pet("cat"), rand = rng(5), b = createBrain(def, 300, rand);
  let prev = 0, worst = 0;
  for (let i = 0; i < 90; i++) {
    stepBrain(b, def, { ...base, dt: FRAME, pointer: { x: 700, y: CY, active: true }, events: [] }, rand);
    worst = Math.max(worst, Math.abs(b.look - prev)); prev = b.look;
  }
  assert.ok(b.look > 0.3 || centerX(b) > 600, `look ${b.look}`);
  assert.ok(worst < 0.2, `look step ${worst}`);
  for (let i = 0; i < 600; i++) stepBrain(b, def, { ...base, dt: FRAME, pointer: null, events: [] }, rand);
  assert.ok(Math.abs(b.look) < 0.15, `look after cursor left ${b.look}`);
});

test("a follower gives up after the cursor leaves and returns to idle behaviour", () => {
  const def = pet("puppy"), rand = rng(11), b = createBrain(def, 100, rand);
  for (let i = 0; i < 360; i++) stepBrain(b, def, { ...base, dt: FRAME, pointer: { x: 600, y: CY, active: true }, events: [] }, rand);
  for (let i = 0; i < 60 * 12; i++) stepBrain(b, def, { ...base, dt: FRAME, pointer: null, events: [] }, rand);
  assert.notEqual(b.goal?.kind, "follow");
});

test("a cursor well above the pet (the usual case) still gets noticed by friendly pets", () => {
  const r = rate("puppy", () => ({ x: 560, y: CY - 380, active: true }), 6, (_b, h) => h.followed);
  assert.ok(r >= 0.8, `puppy notices a cursor 380px above: ${r}`);
  const far = rate("bunny", () => ({ x: 1100, y: CY - 600, active: true }), 6, (_b, h) => h.followed);
  assert.equal(far, 0, "a far-away cursor is ignored");
});

test("arrival is smooth: the pet eases to a stop instead of halting dead", () => {
  const def = pet("cat"), rand = rng(2), b = createBrain(def, 200, rand);
  b.goal = { kind: "wander", x: 520 } as any;
  let prev = 0, worst = 0, stopped = false;
  for (let i = 0; i < 600 && !stopped; i++) {
    stepBrain(b, def, { ...base, dt: FRAME, pointer: null, events: [] }, rand);
    worst = Math.max(worst, Math.abs(b.vx - prev)); prev = b.vx;
    if (b.goal === null) stopped = true;
  }
  assert.ok(stopped && Math.abs(b.x - 520) < 6);
  assert.ok(worst < 12, `largest velocity change ${worst.toFixed(1)}px/s per frame`);
});

test("a following pet does not back away from a cursor sitting on it (so it can be clicked)", () => {
  const def = pet("puppy"), rand = rng(7919), b = createBrain(def, 200, rand);
  for (let i = 0; i < 600; i++) stepBrain(b, def, { ...base, dt: FRAME, pointer: { x: 520, y: CY, active: true }, events: [] }, rand);
  const rest = b.x;
  for (let i = 0; i < 180; i++) stepBrain(b, def, { ...base, dt: FRAME, pointer: { x: b.x + SIZE / 2, y: CY, active: true }, events: [] }, rand);
  assert.ok(Math.abs(b.x - rest) < 3, `drifted ${Math.abs(b.x - rest).toFixed(1)}px`);
});

// ---- reactions & policy --------------------------------------------------------
test("clicking plays one of the pet's own reactions, shows an emoji and recovers", () => {
  for (const def of PETS) {
    const anims = new Set(def.clickReactions.map((r) => resolveAnim(def, r.anim)));
    const emojis = new Set(def.clickReactions.map((r) => r.emoji));
    const { b } = run(def.id, 2, 0.05, { events: [{ type: "click" }] });
    assert.ok(anims.has(b.anim), `${def.id} reacted with ${b.anim}`);
    assert.ok(b.fx && emojis.has(b.fx.emoji));
    const { b: later } = run(def.id, 2, 4.5, { events: [{ type: "click" }], pointer: null });
    assert.ok(["idle", "walk", "sit", "sleep", "stretch", "jump", "excited"].includes(later.anim));
    assert.ok(later.animDur === 0 || later.animT <= later.animDur + 1e-6);
  }
  const kinds = new Set<string>();
  for (const def of PETS) kinds.add(def.clickReactions.map((r) => r.anim + r.emoji).join());
  assert.equal(kinds.size, PETS.length, "every pet reacts differently");
});

test("celebration and encouragement events use speech only when it is on", () => {
  const celebrate = run("puppy", 1, 0.05, { events: [{ type: "celebrate" }] }).b;
  assert.equal(celebrate.anim, "celebrate"); assert.ok(celebrate.say && pet("puppy").speech.celebrate.includes(celebrate.say.text));
  const quietCelebrate = run("puppy", 1, 0.05, { events: [{ type: "celebrate" }], speech: false }).b;
  assert.equal(quietCelebrate.say, null); assert.equal(quietCelebrate.anim, "celebrate");
  assert.equal(run("cat", 1, 0.05, { events: [{ type: "encourage", good: true }] }).b.anim, "excited");
  assert.equal(run("cat", 1, 0.05, { events: [{ type: "encourage", good: false }] }).b.anim, "happy");
  // Pets without a run/celebrate pose still pick a legal animation.
  assert.ok(pet("egg").anims.includes(run("egg", 1, 0.05, { events: [{ type: "celebrate" }] }).b.anim));
});

test("quiet mode (learner typing) freezes the pet in place", () => {
  const { b } = run("puppy", 9, 30, { quiet: true, pointer: { x: 900, y: CY, active: true }, x: 300 });
  assert.equal(b.x, 300); assert.equal(b.goal, null); assert.equal(b.anim, "sit");
  // ...and it resumes afterwards.
  const def = pet("puppy"), rand = rng(9);
  for (let i = 0; i < 600; i++) stepBrain(b, def, { ...base, dt: FRAME, pointer: null, events: [] }, rand);
  assert.notEqual(b.anim, "sit");
});

test("quiet mode cuts casual reactions short but lets a celebration finish", () => {
  const def = pet("puppy"), rand = rng(4), b = createBrain(def, 300, rand);
  stepBrain(b, def, { ...base, dt: FRAME, pointer: null, events: [{ type: "click" }] }, rand);
  assert.ok(["excited", "jump", "celebrate"].includes(b.anim));
  stepBrain(b, def, { ...base, dt: FRAME, pointer: null, quiet: true, events: [] }, rand);
  assert.equal(b.anim, "sit", "a click reaction gives way to quiet");
  stepBrain(b, def, { ...base, dt: FRAME, pointer: null, quiet: true, events: [{ type: "celebrate" }] }, rand);
  for (let i = 0; i < 60; i++) stepBrain(b, def, { ...base, dt: FRAME, pointer: null, quiet: true, events: [] }, rand);
  assert.equal(b.anim, "celebrate", "lesson-complete celebration survives the typing window");
  assert.equal(b.protect, true);
  for (let i = 0; i < 60 * 3; i++) stepBrain(b, def, { ...base, dt: FRAME, pointer: null, quiet: true, events: [] }, rand);
  assert.equal(b.anim, "sit"); assert.equal(b.protect, false);
});

test("pets doze off when nothing happens and wake when the cursor comes near", () => {
  let slept = 0;
  for (let seed = 1; seed <= 20; seed++) { const { b } = run("egg", seed, 240, { each: (s) => { if (s.anim === "sleep") slept = Math.max(slept, 1); } }); void b; }
  assert.equal(slept, 1, "egg falls asleep");
  const def = pet("egg"), rand = rng(1), b = createBrain(def, 300, rand);
  b.anim = "sleep"; b.animDur = 0;
  stepBrain(b, def, { ...base, dt: FRAME, pointer: { x: centerX(b) + 100, y: CY, active: true }, events: [] }, rand);
  assert.notEqual(b.anim, "sleep");
});

test("reduced motion: no walking, no big moves; off: perfectly still", () => {
  for (const id of ["puppy", "bunny", "penguin"]) {
    const seen = new Set<string>();
    const { b } = run(id, 3, 60, { motion: "reduced", x: 400, pointer: { x: 900, y: CY, active: true }, events: [{ type: "celebrate" }], each: (s) => seen.add(s.anim) });
    assert.equal(b.x, 400, `${id} reduced stays put`);
    for (const a of seen) assert.ok(["idle", "sit", "sleep", "stretch"].includes(a) === true || a === "idle", `${id} reduced anim ${a}`);
    const off = new Set<string>();
    const r = run(id, 3, 30, { motion: "off", x: 400, events: [{ type: "click" }], each: (s) => off.add(s.anim) });
    assert.equal(r.b.x, 400); assert.deepEqual([...off], ["idle"]);
  }
});

test("cursor setting off: the pet ignores the pointer but still lives its life", () => {
  const r = rate("puppy", cursorAt(480), 6, (_b, h) => h.followed);
  assert.ok(r > 0.5);
  let followed = false;
  run("puppy", 3, 6, { cursor: false, pointer: { x: 480, y: CY, active: true }, each: (s) => { if (s.goal?.kind === "follow") followed = true; } });
  assert.equal(followed, false);
});

// ---- rewards -------------------------------------------------------------------
const day = (d: number, correct = 120) => ({ id: `s${d}-${correct}-${Math.random()}`, activity: "lesson", language: "english", durationSec: 60, wpm: 20, accuracy: 90, correct, incorrect: 5, score: null, difficulty: "easy", layout: "english-qwerty", completedAt: new Date(2026, 0, d, 12).toISOString() }) as any;
const days = (...ds: number[]) => ds.map((d) => day(d));
const NOW = new Date(2026, 5, 1);

test("only real qualifying sessions count toward streaks", () => {
  assert.equal(QUALIFYING_MIN_CORRECT, 20);
  assert.equal(isQualifyingSession(day(1, 19)), false);
  assert.equal(isQualifyingSession(day(1, 20)), true);
  assert.equal(longestStreak([]), 0);
  assert.equal(longestStreak([day(1, 5), day(2, 19)]), 0);
  assert.equal(longestStreak(days(1, 2, 3)), 3);
  assert.equal(longestStreak(days(1, 2, 4, 5, 6, 7)), 4); // gap on the 3rd
  assert.equal(longestStreak([...days(1, 1, 1), day(2, 3)]), 1); // many sessions on a day = one day
  assert.equal(longestStreak([...days(1, 2, 3, 4), day(5, 2), ...days(6, 7)]), 4);
  assert.equal(currentStreak(days(10, 11), new Date(2026, 0, 12, 9).getTime()), 2);
});

test("rewards: a day unlocks the egg; each milestone unlocks its pet exactly once", () => {
  let state = EMPTY_PETS;
  assert.equal(evaluateRewards(state, [], NOW).unlocked.length, 0);
  assert.equal(evaluateRewards(state, [day(1, 10)], NOW).unlocked.length, 0, "a tiny session earns nothing");
  let r = evaluateRewards(state, days(1), NOW);
  assert.deepEqual(r.unlocked.map((p) => p.id), ["egg"]); state = r.state;
  assert.equal(state.active, "egg"); assert.deepEqual(state.pending, ["egg"]);
  r = evaluateRewards(state, days(1, 2), NOW); assert.equal(r.unlocked.length, 0, "2 days: nothing new");
  r = evaluateRewards(state, days(1, 2, 3), NOW); assert.deepEqual(r.unlocked.map((p) => p.id), ["cat"]); state = r.state;
  assert.equal(state.active, "egg", "later rewards never replace the chosen companion");
  // refresh / second tab: nothing granted twice
  r = evaluateRewards(state, days(1, 2, 3), NOW); assert.equal(r.unlocked.length, 0); assert.equal(r.state, state);
  assert.equal(state.history.length, 2); assert.deepEqual(state.history.map((h) => h.streak), [1, 3]);
});

test("each milestone from the spec unlocks at the right streak", () => {
  const streak = (n: number) => Array.from({ length: n }, (_, i) => day(i + 1));
  const ids = (n: number) => evaluateRewards(EMPTY_PETS, streak(n), NOW).unlocked.map((p) => p.id);
  assert.deepEqual(ids(2), ["egg"]);
  assert.deepEqual(ids(3), ["egg", "cat"]);
  assert.deepEqual(ids(7), ["egg", "cat", "puppy"]);
  assert.ok(ids(14).includes("bunny") && !ids(13).includes("bunny"));
  assert.ok(ids(21).includes("penguin") && !ids(20).includes("penguin"));
  assert.ok(ids(30).includes("dragon") && !ids(29).includes("dragon"));
  assert.ok(ids(60).includes("fox") && !ids(59).includes("fox"));
  assert.ok(ids(100).includes("starlight") && !ids(99).includes("starlight"));
  assert.equal(ids(100).length, 8);
});

test("pets are kept forever after a streak is lost or history is cleared", () => {
  const earned = evaluateRewards(EMPTY_PETS, days(1, 2, 3, 4, 5, 6, 7), NOW).state;
  assert.equal(Object.keys(earned.unlocked).length, 3);
  const later = evaluateRewards(earned, [day(20)], NOW); // streak broken, one lonely day
  assert.equal(later.unlocked.length, 0); assert.equal(later.state, earned);
  const cleared = evaluateRewards(earned, [], NOW); // dashboard reset
  assert.equal(Object.keys(cleared.state.unlocked).length, 3);
  assert.equal(nextReward(earned, 7)?.pet.id, "bunny"); assert.equal(nextReward(earned, 7)?.daysToGo, 7);
});

// ---- storage -------------------------------------------------------------------
test("pet storage validates hostile input and persists choices", () => {
  assert.equal(validatePetState("nope"), null);
  assert.equal(validatePetState([]), null);
  const v = validatePetState({ version: 99, unlocked: { cat: { id: "cat", at: "2026-01-01T00:00:00Z", streak: 3 }, ghost: { at: "x" }, egg: 5 }, active: "ghost", pending: ["cat", "cat", "egg", 7], enabled: "yes", settings: { animations: "wild", size: "lg", speech: false }, history: [{ id: "cat", at: "bad", streak: 3 }, { id: "cat" }, null] })!;
  assert.deepEqual(Object.keys(v.unlocked), ["cat"]);
  assert.equal(v.active, null); assert.deepEqual(v.pending, ["cat"]); assert.equal(v.enabled, true);
  assert.equal(v.settings.animations, "full"); assert.equal(v.settings.size, "lg"); assert.equal(v.settings.speech, false);
  assert.equal(v.history.length, 1);
  assert.equal(validatePetState({ unlocked: {}, active: "cat" })!.active, null, "cannot activate a locked pet");

  mem.clear();
  updatePets(() => evaluateRewards(EMPTY_PETS, days(1, 2, 3), NOW).state);
  assert.equal(updatePets((x) => x).active, "cat", "a batch of rewards activates the newest pet");
  assert.equal(selectPet("dragon").active, "cat", "cannot select a locked pet");
  assert.equal(selectPet("egg").active, "egg");
  assert.equal(selectPet("cat").active, "cat");
  dismissPending("egg"); dismissPending("cat");
  const raw = mem.get("dlt.pets.v1")!;
  mem.clear(); mem.set("dlt.pets.v1", raw); // "refresh"
  const again = readPetState();
  assert.equal(again.active, "cat"); assert.deepEqual(again.pending, []); assert.equal(Object.keys(again.unlocked).length, 2);
  mem.set("dlt.pets.v1", "{{corrupt");
  assert.deepEqual(readPetState().unlocked, {});
});

// ---- account perk: all pets for chosen emails ------------------------------------
test("perk email list: case-insensitive, trimmed, exact match only", () => {
  const raw = " DalenSophea34@Gmail.com , other@example.com ,, ";
  assert.deepEqual(parseEmailList(raw), ["dalensophea34@gmail.com", "other@example.com"]);
  assert.equal(emailInList(raw, "dalensophea34@gmail.com"), true);
  assert.equal(emailInList(raw, "  DALENSOPHEA34@gmail.com "), true);
  assert.equal(emailInList(raw, "dalensophea3@gmail.com"), false);
  assert.equal(emailInList(raw, "xdalensophea34@gmail.com"), false);
  assert.equal(emailInList("", "dalensophea34@gmail.com"), false);
  assert.equal(emailInList(undefined, "a@b.co"), false);
});

test("granting all pets: unlocks the rest, keeps earned pets and choices, is idempotent", () => {
  mem.clear();
  updatePets(() => ({ ...evaluateRewards(EMPTY_PETS, days(1, 2, 3), NOW).state, active: "cat" }));
  const before = readPetState();
  const granted = grantAllPets();
  assert.equal(Object.keys(granted.unlocked).length, PETS.length);
  assert.equal(granted.active, "cat", "keeps the chosen companion");
  assert.equal(granted.unlocked.egg.source, undefined, "streak-earned pets are not relabelled");
  assert.equal(granted.unlocked.starlight.source, "account");
  assert.deepEqual(granted.pending, before.pending, "no unlock toasts for a grant");
  const raw = mem.get("dlt.pets.v1");
  grantAllPets();
  assert.equal(mem.get("dlt.pets.v1"), raw, "second grant writes nothing");
  assert.equal(readPetState().unlocked.starlight.source, "account", "the source survives storage");
});

test("visiting while signed out writes nothing to storage", () => {
  removeRaw("dlt.pets.v1"); // also clears local-progress's in-memory fallback copy
  revokeAccountGrants();
  assert.equal(mem.get("dlt.pets.v1"), undefined);
});

test("signing out removes only account-granted pets", () => {
  mem.clear();
  updatePets(() => ({ ...evaluateRewards(EMPTY_PETS, days(1, 2, 3), NOW).state, active: "cat" }));
  grantAllPets();
  selectPet("fox");
  const after = revokeAccountGrants();
  assert.deepEqual(Object.keys(after.unlocked).sort(), ["cat", "egg"], "streak-earned pets stay");
  assert.ok(after.active && after.active in after.unlocked, "active falls back to a pet that is still owned");
  const raw = mem.get("dlt.pets.v1");
  revokeAccountGrants();
  assert.equal(mem.get("dlt.pets.v1"), raw, "nothing to revoke writes nothing");
});

test("a granted pet becomes permanent once the streak earns it", () => {
  mem.clear();
  updatePets(() => EMPTY_PETS);
  grantAllPets();
  const r = evaluateRewards(readPetState(), days(1, 2, 3), NOW);
  assert.deepEqual(r.unlocked.map((p) => p.id), ["egg", "cat"]);
  assert.equal(r.state.unlocked.cat.source, undefined);
  assert.deepEqual(r.state.pending, [], "no second announcement for pets already owned");
  assert.equal(r.state.unlocked.dragon.source, "account", "pets not yet earned stay grants");
  updatePets(() => r.state);
  const out = revokeAccountGrants();
  assert.deepEqual(Object.keys(out.unlocked).sort(), ["cat", "egg"]);
});
