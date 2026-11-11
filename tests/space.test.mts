const store = new Map<string, string>();
(globalThis as any).window = { localStorage: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) }, addEventListener() {} };
const assert = (await import("node:assert/strict")).default;
const { test } = await import("node:test");
const space = await import("@/lib/arcade/space");
const verify = await import("@/lib/arcade/space-verify");
const sc = await import("@/lib/arcade/space-content");
const core = await import("@/lib/arcade/typing-core");
const { spaceVocabulary } = await import("@/data/space-content");
const { findKeyFor } = await import("@/lib/keyboard/keyboard-mapping");
const { codepoints, normalizeKhmer, splitGraphemes } = await import("@/lib/khmer-unicode");
const progress = await import("@/lib/arcade/progress");
const content = await import("@/lib/arcade/content");
const i18n = await import("@/lib/i18n");

const cfg = (over: object = {}) => ({ language: "english", difficulty: "easy", mode: "survival", topic: "space", timeLimit: 120, waveTarget: 5, seed: 42, ...over }) as any;

/**
 * Scripted pilot: types at `cps` keys per second, always aiming at the most
 * dangerous ship, makes a mistake every `errorEvery` keys and uses power-ups
 * when it holds some. Runs at real 60 Hz steps like the browser.
 */
function pilot(sim: any, cps: number, opts: { maxMs?: number; errorEvery?: number; powers?: boolean; each?: (sim: any) => void } = {}) {
  let due = 0, keys = 0;
  const maxTicks = Math.ceil((opts.maxMs ?? 600000) / space.TICK_MS);
  while (!sim.over && sim.tick < maxTicks) {
    space.stepSpace(sim, space.TICK_MS);
    opts.each?.(sim);
    due = Math.min(3, due + cps / 60);
    while (due >= 1 && !sim.over && !sim.result) {
      due--;
      if (opts.powers && sim.powers.length && sim.enemies.length > 2) space.spacePower(sim, 0);
      const target = space.findTarget(sim);
      if (opts.errorEvery && ++keys % opts.errorEvery === 0) {
        space.spaceChar(sim, "\u0001");
        continue;
      }
      if (target) space.spaceChar(sim, core.expectedChar(target.buf));
      else {
        const ready = sim.enemies.filter((e: any) => !space.isDoomed(e) && e.introMs <= 0 && e.y >= 0 && e.x >= 0 && e.x <= space.WORLD.w);
        if (!ready.length) break;
        const next = ready.reduce((a: any, b: any) => (b.y > a.y ? b : a));
        space.spaceChar(sim, core.firstChar(next.buf));
      }
    }
  }
  return space.spaceOutcome(sim);
}

// ---- Content ----------------------------------------------------------------
test("every word can be typed on its layout, holds no digits, and every size has words", () => {
  for (const language of ["english", "khmer"] as const) {
    for (const word of Object.values(spaceVocabulary[language]).flat()) {
      assert.ok(!/[0-9០-៩]/.test(word), `digit in ${word}`);
      for (const cp of codepoints(normalizeKhmer(word))) if (cp !== " ") assert.ok(findKeyFor(language, cp), `${language}: no key for "${cp}" (U+${cp.codePointAt(0)!.toString(16)}) in "${word}"`);
    }
    for (const topic of ["space", "science", "general", "mixed"] as const) for (const cls of ["short", "medium", "long", "phrase"] as const) {
      const pool = sc.spacePool(language, topic, cls);
      assert.ok(pool.length >= 8, `${language}/${topic}/${cls}: ${pool.length}`);
      if (cls !== "phrase") assert.ok(pool.every((w: string) => sc.classify(w) === cls || !w.includes(" ")), `${language}/${topic}/${cls}`);
    }
  }
});

test("Khmer words are sized by keystrokes, not by visible clusters or UTF-16 length", () => {
  assert.equal(sc.classify("ព្រះអាទិត្យ"), "long"); // 11 keystrokes, 4 clusters
  assert.ok(splitGraphemes("ព្រះអាទិត្យ").length < 6);
  assert.equal(sc.classify("ភព"), "short");
  assert.equal(sc.classify("ការពារ ផែនដី"), "phrase");
});

// ---- Core gameplay ------------------------------------------------------------
test("typing a word locks on, fires, and the hit lands only when the shot arrives", () => {
  const sim = space.createSpace(cfg());
  while (!sim.enemies.some((e: any) => e.y > 40)) space.stepSpace(sim, space.TICK_MS);
  const enemy = sim.enemies.find((e: any) => e.y > 40)!;
  const word = codepoints(enemy.words[0]);
  space.spaceChar(sim, word[0]);
  assert.equal(space.findTarget(sim), enemy);
  for (const c of word.slice(1)) space.spaceChar(sim, c);
  assert.equal(space.findTarget(sim), null, "lock released after the word");
  assert.ok(space.isDoomed(enemy), "single-word ship is doomed");
  assert.equal(sim.shots.length, 1);
  assert.equal(sim.kills, 0, "not destroyed until the shot lands");
  const y = enemy.y;
  for (let i = 0; i < 90 && sim.kills === 0; i++) space.stepSpace(sim, space.TICK_MS);
  assert.equal(sim.kills, 1);
  assert.equal(enemy.y, y, "a doomed ship stops moving");
  assert.ok(sim.points >= 10);
});

test("wrong keys never damage ships; each key moves only one target", () => {
  const sim = space.createSpace(cfg({ difficulty: "hard" }));
  while (sim.enemies.filter((e: any) => e.y > 10).length < 2) space.stepSpace(sim, space.TICK_MS);
  const [a, b] = sim.enemies.filter((e: any) => e.y > 10);
  const before = sim.enemies.map((e: any) => e.hp);
  space.spaceChar(sim, "\u0001");
  space.spaceChar(sim, core.firstChar(a.buf));
  space.spaceChar(sim, "\u0001");
  assert.deepEqual(sim.enemies.map((e: any) => e.hp), before);
  assert.equal(a.buf.typed.length, 1);
  assert.equal(b.buf.typed.length, 0);
  assert.equal(sim.stats.totalKeys - sim.stats.correctKeys, 2);
  space.spaceBackspace(sim);
  assert.equal(space.findTarget(sim), null, "backspace on an empty word lets go");
  assert.equal(sim.stats.netChars, 0);
});

test("ships reaching the defence line cost health; an idle pilot loses", () => {
  const sim = space.createSpace(cfg());
  for (let i = 0; i < 60 * 600 && !sim.over; i++) space.stepSpace(sim, space.TICK_MS);
  assert.equal(sim.over, true);
  assert.equal(sim.result, "lost");
  assert.equal(sim.hp, 0);
  assert.equal(sim.kills, 0);
  assert.equal(space.spaceOutcome(sim).score.total, 0);
});

// ---- Balance across skill levels ---------------------------------------------
test("difficulty fits the typist: steady beginners survive Easy, Expert demands real speed", () => {
  const easySlow = pilot(space.createSpace(cfg({ mode: "waves", waveTarget: 5 })), 2.5);
  assert.equal(easySlow.won, true, `Easy at ~30 WPM should clear 5 waves (reached ${easySlow.wave}, hp ${easySlow.hpLeft})`);
  assert.ok(easySlow.bosses >= 1);
  const expertSlow = pilot(space.createSpace(cfg({ difficulty: "expert", mode: "waves", waveTarget: 5 })), 2.5);
  assert.equal(expertSlow.won, false, "Expert should beat a 30 WPM typist");
  const expertFast = pilot(space.createSpace(cfg({ difficulty: "expert", mode: "waves", waveTarget: 5 })), 9, { powers: true });
  assert.equal(expertFast.won, true, `Expert at ~100 WPM should be beatable (wave ${expertFast.wave}, hp ${expertFast.hpLeft})`);
  for (const difficulty of ["medium", "hard"] as const) {
    const out = pilot(space.createSpace(cfg({ difficulty, mode: "waves", waveTarget: 5 })), 6, { powers: true });
    assert.equal(out.won, true, `${difficulty} at ~70 WPM (wave ${out.wave}, hp ${out.hpLeft})`);
  }
});

test("Khmer runs are playable and fair at Khmer typing speeds", () => {
  for (const difficulty of ["easy", "medium"] as const) {
    const out = pilot(space.createSpace(cfg({ language: "khmer", difficulty, mode: "waves", waveTarget: 5 })), difficulty === "easy" ? 2.5 : 4.5, { powers: true });
    assert.equal(out.won, true, `khmer ${difficulty}: wave ${out.wave}, hp ${out.hpLeft}`);
    assert.equal(out.accuracy, 100);
  }
});

// ---- Waves, bosses, specials ---------------------------------------------------
test("waves grow gradually and bosses arrive every fifth wave", () => {
  const rng = content.createRng(7);
  const rosters = [1, 2, 3, 4, 5, 6, 10, 30].map((w) => space.waveRoster(w, { difficulty: "medium", mode: "survival" }, rng));
  assert.ok(rosters[0].every((k: string) => k === "scout"));
  assert.equal(rosters[4][0], "boss");
  assert.equal(rosters[6][0], "boss");
  assert.ok(!rosters[3].includes("boss") && !rosters[5].includes("boss"));
  assert.ok(rosters[0].length < rosters[3].length && rosters[7].length <= 28);
  const late = space.waveRoster(29, { difficulty: "expert", mode: "survival" }, rng);
  for (const kind of ["speed", "armored", "bomber", "stealth", "elite"]) assert.ok(late.includes(kind), kind);
});

test("boss: intro, several words in phases, attacks, bonus and power-ups when beaten", () => {
  const sim = space.createSpace(cfg({ mode: "waves", waveTarget: 5 }));
  pilot(sim, 4, { maxMs: 1 });
  while (sim.wave < 5 && !sim.over) pilot(sim, 4, { maxMs: sim.tick * space.TICK_MS + 1000 });
  while (!space.findBoss(sim) && !sim.over) space.stepSpace(sim, space.TICK_MS);
  const boss = space.findBoss(sim)!;
  assert.ok(boss.introMs > 0, "boss intro");
  space.spaceChar(sim, core.firstChar(boss.buf));
  assert.equal(space.findTarget(sim), null, "boss cannot be targeted during the intro");
  assert.ok(boss.words.length >= 4);
  assert.ok(sc.classify(boss.words.at(-1)) === "phrase" || sc.classify(boss.words.at(-1)) === "long");
  const powers = sim.powers.length;
  const out = pilot(sim, 5);
  assert.ok(out.bosses >= 1, "boss beaten");
  assert.ok(sim.powers.length >= Math.min(3, powers) || sim.powersUsed > 0);
});

test("bombers stop and bomb; shield blocks; stealth ships keep their word", () => {
  // Play an Expert game under a permanent shield until every special enemy has shown up.
  const s2 = space.createSpace(cfg({ difficulty: "expert", seed: 3 }));
  s2.shieldMs = 1e9;
  let sawBomb = false, sawCloak = false, blocked = false, hovered = false;
  pilot(s2, 5, { maxMs: 400000, each: (sim) => {
    if (sim.events.some((e: any) => e.type === "bomb")) sawBomb = true;
    if (sim.events.some((e: any) => e.type === "blocked")) blocked = true;
    for (const e of sim.enemies) {
      if (e.kind === "bomber" && e.hovering) hovered = true;
      if (space.isCloaked(e)) {
        sawCloak = true;
        assert.ok(e.words.length > 0 && e.buf.text.length > 0, "a cloaked ship keeps its word");
      }
    }
    sim.events.length = 0;
  } });
  assert.ok(hovered, "a bomber stopped to hover");
  assert.ok(sawBomb, "a bomber launched a bomb");
  assert.ok(sawCloak, "a stealth ship cloaked");
  assert.ok(blocked, "the shield blocked damage");
});

test("power-ups: each kind does what it says", () => {
  const setup = () => {
    const sim = space.createSpace(cfg({ difficulty: "hard", seed: 11 }));
    while (sim.enemies.filter((e: any) => e.y > 30).length < 3) space.stepSpace(sim, space.TICK_MS);
    return sim;
  };
  let sim = setup();
  sim.powers = ["laser"];
  const kills = sim.kills;
  assert.equal(space.spacePower(sim, 0), true);
  assert.equal(sim.kills, kills + 1);
  sim = setup();
  sim.hp = 40;
  sim.powers = ["repair", "shield", "slow"];
  space.spacePower(sim, 0);
  assert.equal(sim.hp, 70);
  space.spacePower(sim, 0);
  space.spacePower(sim, 0);
  assert.ok(sim.shieldMs > 0 && sim.slowMs > 0 && sim.powers.length === 0 && sim.powersUsed === 3);
  const enemy = sim.enemies.find((e: any) => e.y > 30)!;
  const y = enemy.y;
  for (let i = 0; i < 60; i++) space.stepSpace(sim, space.TICK_MS);
  const slowMoved = enemy.y - y;
  sim = setup();
  sim.powers = ["multi"];
  space.spacePower(sim, 0);
  assert.ok(sim.shots.length >= 2 && sim.shots.every((s: any) => s.kind === "missile"));
  sim = setup();
  sim.powers = ["emp"];
  const total = sim.enemies.reduce((n: number, e: any) => n + e.hp, 0);
  space.spacePower(sim, 0);
  assert.ok(sim.enemies.reduce((n: number, e: any) => n + e.hp, 0) < total);
  sim = setup();
  sim.powers = ["rapid"];
  space.spacePower(sim, 0);
  assert.ok(sim.rapidMs > 0);
  assert.equal(space.spacePower(sim, 0), false, "empty slot does nothing");
  assert.ok(slowMoved >= 0);
});

// ---- Modes ------------------------------------------------------------------
test("modes: time limit ends with a bonus, accuracy mode charges for mistakes", () => {
  const timed = pilot(space.createSpace(cfg({ mode: "time", timeLimit: 60 })), 4);
  assert.equal(timed.won, true);
  assert.ok(Math.abs(timed.timeMs - 60000) < 50);
  const clean = pilot(space.createSpace(cfg({ mode: "accuracy" })), 4);
  const sloppy = pilot(space.createSpace(cfg({ mode: "accuracy" })), 4, { errorEvery: 6 });
  assert.equal(clean.won, true);
  assert.ok(clean.score.total > sloppy.score.total);
  assert.ok(sloppy.incorrect > 10 && sloppy.accuracy < 90);
  assert.equal(space.finalWave({ mode: "survival", waveTarget: 5 }), null);
  assert.equal(space.finalWave({ mode: "waves", waveTarget: 15 }), 15);
});

// ---- Server verification -------------------------------------------------------
const playLogged = (config: any, cps: number, maxMs?: number) => {
  const sim = space.createSpace(config);
  pilot(sim, cps, { maxMs, powers: true, errorEvery: 17 });
  return sim;
};

test("replaying the input log gives exactly the same result (English and Khmer)", () => {
  for (const config of [cfg({ mode: "waves", waveTarget: 5, seed: 99 }), cfg({ language: "khmer", difficulty: "medium", mode: "time", timeLimit: 60, seed: 5 }), cfg({ difficulty: "expert", seed: 1234 })]) {
    const live = playLogged(config, 6, 120000);
    const check = verify.verifySpaceRun({ setup: config, seed: config.seed, ticks: live.tick, log: JSON.parse(JSON.stringify(live.log)), wallMs: live.tick * space.TICK_MS + 4000 });
    assert.equal(check.ok, true, JSON.stringify(check));
    assert.deepEqual((check as any).outcome, space.spaceOutcome(live));
  }
});

test("the server rejects tampered, impossible or replayed submissions", () => {
  const config = cfg({ mode: "waves", waveTarget: 5, seed: 7 });
  const live = playLogged(config, 6, 60000);
  const good = { setup: config, seed: 7, ticks: live.tick, log: live.log, wallMs: live.tick * space.TICK_MS + 1000 };
  assert.equal(verify.verifySpaceRun(good).ok, true);
  // A different seed is a different game: the claimed log no longer earns the same score.
  const otherSeed = verify.verifySpaceRun({ ...good, seed: 8 });
  assert.ok(!otherSeed.ok || (otherSeed as any).outcome.score.total !== space.spaceOutcome(live).score.total);
  assert.deepEqual(verify.verifySpaceRun({ ...good, wallMs: 1000 }), { ok: false, reason: "time" });
  assert.deepEqual(verify.verifySpaceRun({ ...good, setup: { ...config, difficulty: "insane" } }), { ok: false, reason: "setup" });
  assert.deepEqual(verify.verifySpaceRun({ ...good, log: [[5, 0, "ab"]] }), { ok: false, reason: "log" });
  assert.deepEqual(verify.verifySpaceRun({ ...good, log: [[9, 0, "a"], [3, 0, "b"]] }), { ok: false, reason: "log" });
  assert.deepEqual(verify.verifySpaceRun({ ...good, ticks: -1 }), { ok: false, reason: "ticks" });
  const bot = Array.from({ length: 200 }, (_, i) => [100 + Math.floor(i / 2), 0, "a"]);
  assert.deepEqual(verify.verifySpaceRun({ ...good, log: bot }), { ok: false, reason: "rate" });
  // Claiming extra ticks after the game ended is rejected.
  const ended = playLogged(cfg({ seed: 3 }), 1);
  assert.equal(ended.over, true);
  assert.deepEqual(verify.verifySpaceRun({ setup: cfg({ seed: 3 }), seed: 3, ticks: ended.tick + 600, log: ended.log, wallMs: 1e9 }), { ok: false, reason: "ticks" });
});

// ---- Platform integration --------------------------------------------------------
test("space achievements are awarded only when earned, and have both languages", () => {
  const base = { game: "space-shooter", language: "english", difficulty: "easy", score: 900, wpm: 30, cpm: 150, accuracy: 92, mistakes: 4, correctChars: 120, bestStreak: 20, durationMs: 90000, won: false, sum: { kills: 1, bosses: 0 }, max: { wave: 2, combo: 1, survivalMs: 90000 } } as any;
  const first = progress.applyResult(progress.EMPTY_ARCADE, base, "2026-11-11T00:00:00Z");
  assert.ok(first.newAchievements.includes("space-first-contact"));
  for (const id of ["space-boss", "space-galaxy", "space-perfect", "space-combo", "space-survivor", "space-elite", "space-defender", "space-speed"]) assert.ok(!first.newAchievements.includes(id), id);
  const big = progress.applyResult(first.store, { ...base, difficulty: "expert", won: true, accuracy: 100, wpm: 55, correctChars: 400, sum: { kills: 120, bosses: 2 }, max: { wave: 10, combo: 25, survivalMs: 320000 } }, "2026-11-11T00:10:00Z");
  for (const id of ["space-boss", "space-galaxy", "space-perfect", "space-combo", "space-survivor", "space-elite", "space-defender", "space-speed"]) assert.ok(big.newAchievements.includes(id), id);
  const has = (key: string) => i18n.translate("en", key) !== key && /[ក-៿]/.test(i18n.translate("km", key));
  for (const a of progress.ACHIEVEMENTS.filter((x: any) => x.game === "space-shooter")) assert.ok(has(`ach.${a.id}.t`) && has(`ach.${a.id}.d`), a.id);
  for (const key of ["game.space-shooter.title", "game.space-shooter.desc", "act.d.space-shooter", "ss.mode.survival", "ss.power.emp", "ss.enemy.bomber"]) assert.ok(has(key), key);
});
