const store = new Map<string, string>();
(globalThis as any).window = { localStorage: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) }, addEventListener() {} };
const assert = (await import("node:assert/strict")).default;
const { test } = await import("node:test");
const core = await import("@/lib/arcade/typing-core");
const scoring = await import("@/lib/arcade/scoring");
const content = await import("@/lib/arcade/content");
const progress = await import("@/lib/arcade/progress");
const racing = await import("@/lib/arcade/racing");
const zombie = await import("@/lib/arcade/zombie");
const arena = await import("@/lib/arcade/arena");
const { arcadeWords, arcadeSentences } = await import("@/data/arcade-content");
const { findKeyFor } = await import("@/lib/keyboard/keyboard-mapping");
const { codepoints, normalizeKhmer, splitGraphemes } = await import("@/lib/khmer-unicode");
const i18n = await import("@/lib/i18n");

const typeText = (buf: any, text: string, stats: any) => codepoints(normalizeKhmer(text)).map((c: string) => core.typeChar(buf, c, stats));

// ---- Typing engine ----------------------------------------------------------
test("strict mode: a wrong key is counted but not inserted", () => {
  const stats = core.createStats(), buf = core.createBuffer("cat", "english", "strict");
  assert.equal(core.typeChar(buf, "x", stats), "wrong");
  assert.equal(buf.typed.length, 0);
  assert.deepEqual(typeText(buf, "cat", stats), ["correct", "correct", "complete"]);
  const sum = core.summarize(stats, 60000);
  assert.deepEqual([sum.totalKeys, sum.mistakes, sum.correctChars, sum.accuracy, sum.bestStreak], [4, 1, 3, 75, 3]);
});

test("free mode: mistakes are inserted and must be fixed with Backspace", () => {
  const stats = core.createStats(), buf = core.createBuffer("dog", "english", "free");
  core.typeChar(buf, "d", stats);
  assert.equal(core.typeChar(buf, "x", stats), "wrong");
  assert.equal(core.typeChar(buf, "g", stats), "correct"); // right letter, but a mistake is standing
  assert.equal(core.isComplete(buf), false);
  assert.equal(core.typeChar(buf, "g", stats), "blocked");
  assert.equal(stats.netChars, 1);
  core.backspace(buf, stats);
  core.backspace(buf, stats);
  assert.equal(stats.netChars, 1);
  assert.deepEqual([core.typeChar(buf, "o", stats), core.typeChar(buf, "g", stats)], ["correct", "complete"]);
  assert.equal(stats.netChars, 3);
  assert.equal(buf.mistakes, 1);
  assert.equal(core.backspace(core.createBuffer("a", "english", "free"), stats), false);
});

test("WPM, CPM and accuracy", () => {
  const stats = core.createStats(), buf = core.createBuffer("a".repeat(100), "english");
  for (let i = 0; i < 100; i++) core.typeChar(buf, "a", stats);
  const sum = core.summarize(stats, 30000);
  assert.deepEqual([sum.wpm, sum.cpm, sum.accuracy], [40, 200, 100]);
  assert.equal(core.summarize(core.createStats(), 0).accuracy, 100);
});

test("Khmer is validated per code point and displayed per cluster", () => {
  const word = "ស្រលាញ់";
  const stats = core.createStats(), buf = core.createBuffer(word, "khmer");
  assert.equal(buf.goal.length, codepoints(normalizeKhmer(word)).length);
  assert.ok(buf.goal.length > splitGraphemes(word).length, "more keystrokes than visible clusters");
  core.typeChar(buf, buf.goal[0], stats);
  const view = core.bufferView(buf);
  assert.equal(view.length, splitGraphemes(word).length);
  assert.equal(view.map((v) => v.text).join(""), normalizeKhmer(word));
  assert.equal(view[0].state, "partial"); // first cluster started, not finished
  const results = buf.goal.slice(1).map((c: string) => core.typeChar(buf, c, stats));
  assert.equal(results.at(-1), "complete");
  assert.ok(core.bufferView(buf).every((v) => v.state === "correct"));
  // Zero-width characters in source text never become required keystrokes.
  assert.equal(core.createBuffer("ក​ខ", "khmer").goal.length, 2);
});

test("every arcade challenge can be typed on its keyboard layout", () => {
  for (const language of ["english", "khmer"] as const) {
    const texts = [...Object.values(arcadeWords[language]).flat(), ...Object.values(arcadeSentences[language]).flat()];
    assert.ok(texts.length > 60);
    for (const text of texts) for (const cp of codepoints(normalizeKhmer(text))) {
      if (cp === " ") continue;
      assert.ok(findKeyFor(language, cp), `${language}: no key for "${cp}" (U+${cp.codePointAt(0)!.toString(16)}) in "${text}"`);
    }
  }
  for (const cls of ["short", "medium", "long", "phrase"] as const) assert.ok(arcadeWords.khmer[cls].length >= 10 && arcadeWords.english[cls].length >= 10);
});

test("word picking avoids first letters already on screen and is seeded", () => {
  const rng = content.createRng(7);
  const used = new Set<string>();
  for (let i = 0; i < 6; i++) {
    const word = content.pickWord(rng, "english", "short", used);
    assert.ok(!used.has(word[0]));
    used.add(word[0]);
  }
  assert.deepEqual(content.buildLines(content.createRng(3), "khmer", "hard", 200), content.buildLines(content.createRng(3), "khmer", "hard", 200));
  for (const d of ["easy", "medium", "hard", "expert"] as const) assert.ok(content.buildLines(content.createRng(1), "english", d, 300).join("").length >= 300);
});

// ---- Scoring ----------------------------------------------------------------
test("scoring: bonuses and difficulty multiplier", () => {
  const easy = scoring.scoreBreakdown({ base: 1000, accuracy: 100, wpm: 40, bestStreak: 50, difficulty: "easy" });
  assert.deepEqual(easy, { base: 1000, accuracyBonus: 300, speedBonus: 200, comboBonus: 150, multiplier: 1, total: 1650 });
  assert.equal(scoring.scoreBreakdown({ base: 1000, accuracy: 100, wpm: 40, bestStreak: 50, difficulty: "expert" }).total, 4950);
  assert.equal(scoring.scoreBreakdown({ base: 1000, accuracy: 80, wpm: 0, bestStreak: 0, difficulty: "medium" }).total, 1500);
  assert.equal(scoring.scoreBreakdown({ base: 0, accuracy: 100, wpm: 90, bestStreak: 90, difficulty: "hard" }).total, 0);
  assert.deepEqual([0, 99, 100, 400, 900].map(scoring.levelFromArcadeXp), [1, 1, 2, 3, 4]);
});

// ---- Progression ------------------------------------------------------------
const result = (over: object = {}) => ({ game: "car-racing", language: "english", difficulty: "medium", score: 2000, wpm: 42, cpm: 210, accuracy: 96, mistakes: 3, correctChars: 200, bestStreak: 55, durationMs: 60000, won: true, sum: { nitro: 3, winsMediumUp: 1 }, ...over }) as any;

test("a result updates stats, XP, history, achievements and unlocks", () => {
  const first = progress.applyResult(progress.EMPTY_ARCADE, result(), "2026-11-11T00:00:00.000Z");
  const stats = progress.statsFor(first.store, "car-racing");
  assert.deepEqual([stats.plays, stats.wins, stats.bestScore, stats.bestWpm, stats.sum.nitro], [1, 1, 2000, 42, 3]);
  assert.equal(first.isBestScore, true);
  assert.ok(first.xpGained > 0 && first.store.xp === first.xpGained);
  for (const id of ["first-game", "sharpshooter", "swift-fingers", "streak-50", "race-finish", "race-win", "race-nitro"]) assert.ok(first.newAchievements.includes(id), id);
  assert.ok(!first.newAchievements.includes("race-clean") && !first.newAchievements.includes("lightning-hands"));
  for (const id of ["track:desert", "track:city", "car:viper"]) assert.ok(first.newUnlocks.includes(id), id);
  assert.equal(progress.isUnlocked(first.store, "car:comet"), true);
  assert.equal(progress.isUnlocked(first.store, "car:falcon"), false);

  const second = progress.applyResult(first.store, result({ score: 500, won: false }), "2026-11-11T00:01:00.000Z");
  assert.equal(second.isBestScore, false);
  assert.equal(second.newAchievements.length, 0, "achievements are awarded once");
  assert.ok(second.newUnlocks.includes("car:falcon"));
  assert.equal(second.store.history.length, 2);
  assert.equal(progress.statsFor(second.store, "car-racing").sum.nitro, 6);
});

test("stored arcade data is validated and survives a round trip", () => {
  const out = progress.recordArcadeResult(result({ game: "zombie-survival", max: { wave: 6 }, sum: { kills: 30 } }));
  assert.deepEqual(progress.readArcade(), out.store);
  assert.ok(out.newUnlocks.includes("stage:street"));
  assert.equal(progress.validateArcade("nope"), null);
  const cleaned = progress.validateArcade({ xp: -5, history: [{ game: "hack" }], unlocks: ["a", "a", 3], music: false })!;
  assert.deepEqual([cleaned.xp, cleaned.history.length, cleaned.unlocks, cleaned.music], [0, 0, ["a"], false]);
  assert.equal(progress.loadoutChoice({ ...progress.EMPTY_ARCADE, loadout: { car: "viper" } }, "car", ["comet", "viper"], "comet", "car"), "comet");
});

test("every achievement and unlock has English and Khmer text", () => {
  const has = (key: string) => i18n.translate("en", key) !== key && /[ក-៿]/.test(i18n.translate("km", key));
  for (const a of progress.ACHIEVEMENTS) assert.ok(has(`ach.${a.id}.t`) && has(`ach.${a.id}.d`), a.id);
  for (const u of progress.UNLOCKS) assert.ok(has(`unl.${u.id.replace(":", "-")}`) && has(`unl.${u.id.replace(":", "-")}.how`), u.id);
  for (const id of progress.ARCADE_GAMES) assert.ok(has(`game.${id}.title`) && has(`game.${id}.desc`) && has(`act.d.${id}`), id);
});

// ---- Racing -----------------------------------------------------------------
const raceCfg = (over: object = {}) => ({ language: "english", difficulty: "easy", length: "short", track: "coast", car: "comet", paint: "red", seed: 11, ...over }) as any;
/** Types the race text at a steady pace (chars per second) until the race ends. */
function drive(sim: any, cps: number, opts: { errorEvery?: number; nitro?: boolean } = {}) {
  let due = 0, typed = 0;
  for (let ms = 0; ms < 600000 && !racing.raceFinished(sim); ms += 16) {
    racing.stepRace(sim, 16);
    due += (cps * 16) / 1000;
    while (due >= 1 && !racing.raceFinished(sim)) {
      due--;
      if (opts.errorEvery && ++typed % opts.errorEvery === 0) racing.raceChar(sim, "\u0001");
      racing.raceChar(sim, core.expectedChar(sim.buf));
      if (opts.nitro) racing.raceNitro(sim);
    }
  }
  return racing.raceOutcome(sim);
}

test("racing: typing drives the car to the finish and the pace decides the place", () => {
  const fast = drive(racing.createRace(raceCfg()), 6);
  assert.equal(fast.position, 1);
  assert.equal(fast.won, true);
  assert.equal(fast.accuracy, 100);
  assert.ok(Math.abs(fast.wpm - 72) <= 4, `wpm ${fast.wpm}`);
  assert.ok(fast.correctChars >= 500 / racing.METRES_PER_CHAR - 2);
  const slow = drive(racing.createRace(raceCfg()), 0.8);
  assert.equal(slow.position, 4);
  assert.equal(slow.won, false);
  assert.ok(slow.timeMs > fast.timeMs * 4);
  assert.ok(fast.score.total > slow.score.total);
});

test("racing: mistakes cost time, nitro saves time, an idle car stops", () => {
  const clean = drive(racing.createRace(raceCfg()), 4);
  const sloppy = drive(racing.createRace(raceCfg()), 4, { errorEvery: 5 });
  assert.ok(sloppy.timeMs > clean.timeMs && sloppy.accuracy < 90 && sloppy.mistakes > 10);
  const boosted = drive(racing.createRace(raceCfg()), 4, { nitro: true });
  assert.ok(boosted.nitroUsed >= 1 && boosted.timeMs < clean.timeMs);
  const idle = racing.createRace(raceCfg());
  assert.equal(racing.raceNitro(idle), false, "nitro needs a full charge");
  for (let i = 0; i < 4000; i++) racing.stepRace(idle, 50);
  assert.equal(idle.dist, 0);
  assert.ok(idle.rivals.every((r: any) => r.finishedAt !== null));
  assert.equal(racing.raceOutcome(idle).score.total, 0);
});

test("racing: harder difficulties bring faster rivals; Khmer races work", () => {
  const speeds = (["easy", "medium", "hard", "expert"] as const).map((difficulty) => Math.max(...racing.createRace(raceCfg({ difficulty })).rivals.map((r: any) => r.cps)));
  assert.ok(speeds[0] < speeds[1] && speeds[1] < speeds[2] && speeds[2] < speeds[3]);
  for (const difficulty of ["easy", "expert"] as const) {
    const out = drive(racing.createRace(raceCfg({ language: "khmer", difficulty, length: "medium" })), 5);
    assert.equal(out.accuracy, 100);
    assert.ok(out.timeMs > 0 && out.score.total > 0);
  }
});

// ---- Zombie survival --------------------------------------------------------
const zombieCfg = (over: object = {}) => ({ language: "english", difficulty: "easy", stage: "graveyard", seed: 5, ...over }) as any;
/** Plays automatically: always types the word of the closest zombie or power-up. */
function survive(sim: any, cps: number, maxMs: number) {
  let due = 0;
  for (let ms = 0; ms < maxMs && !sim.over; ms += 16) {
    zombie.stepZombies(sim, 16);
    due = Math.min(3, due + (cps * 16) / 1000);
    while (due >= 1 && !sim.over) {
      due--;
      const target = zombie.findTarget(sim);
      if (target) zombie.zombieChar(sim, core.expectedChar(target.buf));
      else {
        const all = [...sim.zombies, ...sim.powerups].filter((t: any) => t.x >= 0 && t.x <= sim.w && t.y >= 0 && t.y <= sim.h);
        if (!all.length) break;
        const d = (t: any) => Math.hypot(t.x - sim.w / 2, t.y - sim.h / 2);
        zombie.zombieChar(sim, core.firstChar(all.reduce((a: any, b: any) => (d(a) < d(b) ? a : b)).buf));
      }
      if (zombie.shockwaveReady(sim) && sim.zombies.length > 4) zombie.zombieShockwave(sim);
    }
  }
  return zombie.zombieOutcome(sim);
}

test("zombies: a fast typist clears waves, bosses take three words", () => {
  const sim = zombie.createZombieGame(zombieCfg());
  const out = survive(sim, 9, 240000);
  assert.ok(out.wave >= 6, `reached wave ${out.wave}`);
  assert.ok(out.bossKills >= 1, "boss beaten on wave 5");
  assert.ok(out.kills > 40 && out.score.total > 0 && out.accuracy === 100);
  assert.equal(sim.over, false);
});

test("zombies: without typing the player is overrun; wrong keys do no damage", () => {
  const sim = zombie.createZombieGame(zombieCfg());
  for (let ms = 0; ms < 200000 && !sim.over; ms += 16) {
    zombie.stepZombies(sim, 16);
    if (sim.zombies.length) zombie.zombieChar(sim, "\u0001");
  }
  assert.equal(sim.over, true);
  assert.equal(sim.health, 0);
  assert.equal(sim.kills, 0);
  assert.equal(zombie.zombieOutcome(sim).score.total, 0);
});

test("zombies: targeting, release, and waves that grow fairly", () => {
  const sim = zombie.createZombieGame(zombieCfg());
  while (sim.zombies.length < 2) zombie.stepZombies(sim, 16);
  for (let i = 0; i < 200; i++) zombie.stepZombies(sim, 16); // let them walk onto the field
  const [a] = sim.zombies;
  zombie.zombieChar(sim, core.firstChar(a.buf));
  assert.ok(zombie.findTarget(sim));
  const locked = zombie.findTarget(sim)!;
  zombie.zombieRelease(sim);
  assert.equal(zombie.findTarget(sim), null);
  assert.equal(locked.buf.typed.length, 0);
  assert.equal(sim.stats.netChars, 0);

  const rng = content.createRng(1);
  const sizes = [1, 2, 3, 4, 5, 10, 30].map((w) => zombie.waveRoster(w, "medium", rng));
  assert.ok(sizes[0].every((t) => t === "normal"), "wave 1 is walkers only");
  assert.ok(sizes[4].includes("boss") && sizes[5].includes("boss") && !sizes[3].includes("boss"));
  assert.ok(sizes[0].length < sizes[3].length && sizes[6].length <= 25, "wave size is capped");
  for (const language of ["english", "khmer"] as const) for (const difficulty of ["easy", "expert"] as const) {
    const out = survive(zombie.createZombieGame(zombieCfg({ language, difficulty, stage: "lab" })), 12, 60000);
    assert.ok(out.kills > 5, `${language}/${difficulty}: ${out.kills} kills`);
  }
});

// ---- Battle arena -----------------------------------------------------------
const arenaCfg = (over: object = {}) => ({ language: "english", difficulty: "easy", arena: "forest", spells: ["fireball", "shield", "ice", "lightning"], seed: 9, ...over }) as any;
/** Plays automatically: shields when an attack is near, otherwise casts the strongest ready spell. */
function fight(sim: any, cps: number, maxMs = 600000) {
  let due = 0;
  for (let ms = 0; ms < maxMs && !sim.over; ms += 16) {
    arena.stepArena(sim, 16);
    due = Math.min(2, due + (cps * 16) / 1000);
    while (due >= 1 && !sim.over && sim.enemy) {
      due--;
      if (sim.active !== null) {
        arena.arenaChar(sim, core.expectedChar(sim.slots[sim.active].buf));
        continue;
      }
      const ready = sim.slots.filter((s: any) => arena.slotBlock(sim, s) === null);
      const want = sim.enemy.attackMs < 2500 && sim.shieldMs <= 0 ? ["shield"] : ["ultimate", "lightning", "ice", "fireball"];
      const slot = want.map((id) => ready.find((s: any) => s.spell === id)).find(Boolean);
      if (slot) arena.arenaChar(sim, core.firstChar(slot.buf));
    }
  }
  return arena.arenaOutcome(sim);
}

test("arena: a good typist clears the arena, an idle one loses", () => {
  const out = fight(arena.createArena(arenaCfg()), 7);
  assert.equal(out.won, true);
  assert.equal(out.defeated, out.total);
  assert.ok(out.crits > 0 && out.hpLeft > 0 && out.score.total > 0);
  const idle = arena.createArena(arenaCfg());
  for (let ms = 0; ms < 300000 && !idle.over; ms += 16) arena.stepArena(idle, 16);
  assert.equal(idle.over, "lost");
  assert.equal(arena.arenaOutcome(idle).score.total, 0);
});

test("arena: accuracy sets spell power, shield blocks, mana and cooldowns apply", () => {
  const cast = (mistakes: number) => {
    const sim = arena.createArena(arenaCfg({ spells: ["fireball", "shield"] }));
    while (!sim.enemy) arena.stepArena(sim, 16);
    const slot = sim.slots.find((s: any) => s.spell === "fireball");
    sim.elapsedMs += 60000; // slow cast: no critical hit
    const [head, ...rest] = slot.buf.goal;
    arena.arenaChar(sim, head);
    for (let i = 0; i < mistakes; i++) {
      arena.arenaChar(sim, "\u0001");
      arena.arenaBackspace(sim);
    }
    sim.elapsedMs += 60000;
    for (const c of rest) arena.arenaChar(sim, c);
    return { sim, dealt: sim.damageDealt };
  };
  const clean = cast(0), sloppy = cast(3);
  assert.ok(clean.dealt > sloppy.dealt && sloppy.dealt > 0, `${clean.dealt} vs ${sloppy.dealt}`);
  assert.equal(clean.sim.combo, 1);
  assert.equal(sloppy.sim.combo, 0);
  const fireball = clean.sim.slots.find((s: any) => s.spell === "fireball");
  assert.equal(arena.slotBlock(clean.sim, fireball), "cooldown");
  assert.ok(clean.sim.mana < 60 + 10);

  const sim = arena.createArena(arenaCfg({ spells: ["fireball", "shield"] }));
  while (!sim.enemy) arena.stepArena(sim, 16);
  const atk = sim.enemy!.atk;
  for (const c of sim.slots.find((s: any) => s.spell === "shield").buf.goal) arena.arenaChar(sim, c);
  assert.ok(sim.shieldMs > 0);
  sim.enemy!.attackMs = 10;
  arena.stepArena(sim, 16);
  assert.ok(sim.damageTaken < atk * 0.3 && sim.shieldMs === 0, "shield absorbs most of one hit");
  sim.mana = 0;
  assert.equal(arena.slotBlock(sim, sim.slots.find((s: any) => s.spell === "fireball")), "mana");
  assert.equal(arena.slotBlock(sim, sim.slots.find((s: any) => s.spell === "ultimate")), "charge");
});

test("arena: every arena, language and difficulty is playable to an ending", () => {
  for (const id of arena.ARENAS) assert.equal(arena.ARENA_ROSTER[id].at(-1), "boss");
  for (const language of ["english", "khmer"] as const) for (const difficulty of ["easy", "expert"] as const) for (const id of arena.ARENAS) {
    const out = fight(arena.createArena(arenaCfg({ language, difficulty, arena: id })), language === "khmer" ? 9 : 8);
    assert.ok(out.defeated >= 1 && out.casts > 3, `${language}/${difficulty}/${id}`);
  }
  const easy = arena.createArena(arenaCfg()), expert = arena.createArena(arenaCfg({ difficulty: "expert", arena: "volcano" }));
  for (const s of [easy, expert]) while (!s.enemy) arena.stepArena(s, 16);
  assert.ok(expert.enemy!.maxHp > easy.enemy!.maxHp && expert.enemy!.atk > easy.enemy!.atk && expert.enemy!.intervalMs < easy.enemy!.intervalMs * 1.2);
});
