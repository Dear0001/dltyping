"use client";

import ArcadeShell from "@/components/games/arcade/ArcadeShell";
import { Chip, formatTime, Meter, OptionPicker, TypeLine } from "@/components/games/arcade/ArcadeParts";
import { burst, floatText, setTimer, shoot, showBanner } from "@/components/games/arcade/canvas-utils";
import { useLocale } from "@/components/shared/LocaleProvider";
import { useArcadeGame } from "@/hooks/use-arcade-game";
import { useKeyInput } from "@/hooks/use-key-input";
import { useScores, useSettings } from "@/hooks/use-stored-value";
import { ARENAS, arenaBackspace, arenaChar, arenaOutcome, createArena, slotBlock, SPELLS, stepArena, type ArenaId, type ArenaSim, type EnemyKind, type SpellId } from "@/lib/arcade/arena";
import { playArcadeSound } from "@/lib/arcade/audio";
import { isArcadeDifficulty, type ArcadeDifficulty } from "@/lib/arcade/difficulty";
import { isUnlocked, loadoutChoice, updateArcade } from "@/lib/arcade/progress";
import { saveRun } from "@/lib/arcade/save";
import { bufferView, correctPrefix, expectedChar } from "@/lib/arcade/typing-core";
import { calcAccuracy, calcWpm, type CharView } from "@/lib/typing-engine";
import type { Language } from "@/types";
import { arenaPoints, drawArena, SPELL_COLORS } from "./arena-render";

const GAME = "battle-arena";
const STEP_ICONS = ["🧙", "⌨️", "🎯", "🛡️", "🌟"];
const ARENA_ICONS: Record<ArenaId, string> = { forest: "🌲", ice: "🧊", volcano: "🌋" };
const SPELL_ICONS: Record<SpellId, string> = { fireball: "🔥", ice: "❄️", lightning: "⚡", shield: "🛡️", ultimate: "🌟" };
const SPELL_SOUNDS = { fireball: "spell", ice: "ice", lightning: "zap", shield: "shield", ultimate: "explode" } as const;
const BASE_SPELLS: SpellId[] = ["fireball", "shield"];
const EXTRA_SPELLS: SpellId[] = ["ice", "lightning"];

type SlotView = { spell: SpellId; views: CharView[]; block: ReturnType<typeof slotBlock>; cooldownMs: number; active: boolean };
type Hud = { language: Language; slots: SlotView[]; expected: string | null; stuck: boolean; hp: number; mana: number; ult: number; shield: boolean; enemy: { kind: EnemyKind; boss: boolean } | null; defeated: number; total: number; combo: number; wpm: number; accuracy: number; points: number; timeMs: number };
const HUD: Hud = { language: "english", slots: [], expected: null, stuck: false, hp: 100, mana: 60, ult: 0, shield: false, enemy: null, defeated: 0, total: 0, combo: 0, wpm: 0, accuracy: 100, points: 0, timeMs: 0 };

function snapshot(sim: ArenaSim): Hud {
  const active = sim.active === null ? null : sim.slots[sim.active];
  return {
    language: sim.cfg.language,
    slots: sim.slots.map((slot) => ({ spell: slot.spell, views: bufferView(slot.buf), block: slotBlock(sim, slot), cooldownMs: slot.cooldownMs, active: slot === active })),
    // Once a wrong letter is standing, the next key to press is Backspace, so no key is highlighted.
    expected: active && correctPrefix(active.buf) === active.buf.typed.length ? expectedChar(active.buf) : null,
    stuck: Boolean(active && correctPrefix(active.buf) < active.buf.typed.length),
    hp: sim.hp, mana: Math.floor(sim.mana), ult: sim.ult, shield: sim.shieldMs > 0,
    enemy: sim.enemy ? { kind: sim.enemy.kind, boss: sim.enemy.kind === "boss" } : null,
    defeated: sim.defeated, total: sim.roster.length, combo: sim.combo, points: sim.points, timeMs: sim.elapsedMs,
    wpm: calcWpm(sim.stats.netChars, sim.elapsedMs), accuracy: calcAccuracy(sim.stats.correctKeys, sim.stats.totalKeys),
  };
}

export default function BattleArenaGame() {
  const { t } = useLocale();
  const [{ sound }] = useSettings();
  const scores = useScores();
  const game = useArcadeGame<ArenaSim, Hud>({
    game: GAME,
    initialHud: HUD,
    snapshot,
    step: stepArena,
    isOver: (sim) => sim.over !== null,
    draw: drawArena,
    drain(sim, fx, view) {
      const at = view ? arenaPoints(view) : null;
      for (const event of sim.events) {
        switch (event.type) {
          case "key": playArcadeSound("key", sound); break;
          case "wrong": playArcadeSound("wrong", sound); break;
          case "lock": playArcadeSound("hit", sound); break;
          case "noMana": if (at) floatText(fx, at.wizard.x, at.wizard.y - at.u * 3.6, t("ba.noMana"), "#93c5fd", 16); break;
          case "ultReady": playArcadeSound("powerup", sound); showBanner(fx, t("ba.ultReady"), undefined, 1100); break;
          case "cast": {
            playArcadeSound(SPELL_SOUNDS[event.spell], sound);
            setTimer(fx, "cast", 260);
            if (!at) break;
            const color = SPELL_COLORS[event.spell];
            if (event.spell === "shield") {
              burst(fx, at.wizard.x, at.wizard.y, color, 16, 160);
              break;
            }
            shoot(fx, event.spell === "lightning" || event.spell === "ultimate" ? event.spell : "orb", at.staff.x, at.staff.y, at.enemy.x, at.enemy.y, color, event.spell === "ultimate" ? 480 : 240);
            if (event.damage > 0) {
              setTimer(fx, "enemyHit", 170);
              burst(fx, at.enemy.x, at.enemy.y, color, event.crit ? 26 : 12, event.crit ? 260 : 180);
              floatText(fx, at.enemy.x, at.enemy.y - at.u * 2.4, event.crit ? `${t("ba.crit")} -${event.damage}` : `-${event.damage}`, event.crit ? "#fde047" : "#fff", event.crit ? 24 : 19);
              if (event.spell === "ultimate" || event.crit) setTimer(fx, "shake", event.spell === "ultimate" ? 320 : 160);
            }
            break;
          }
          case "enemyDown": playArcadeSound("explode", sound); if (at) burst(fx, at.enemy.x, at.enemy.y, "#fde68a", 34, 300, 200); break;
          case "nextEnemy": {
            const enemy = sim.enemy;
            if (!enemy) break;
            setTimer(fx, "appear", 500);
            playArcadeSound(enemy.kind === "boss" ? "boss" : "wave", sound);
            showBanner(fx, t(`ba.enemy.${enemy.kind === "boss" ? `boss.${sim.cfg.arena}` : enemy.kind}`), enemy.kind === "boss" ? t("ba.bossFight") : t("ba.enemyOf", { n: enemy.index + 1, total: sim.roster.length }), 1500);
            break;
          }
          case "enrage": playArcadeSound("boss", sound); showBanner(fx, t("ba.enraged"), undefined, 1200); break;
          case "enemyAttack":
            setTimer(fx, "lunge", 300);
            if (event.blocked) playArcadeSound("block", sound);
            else {
              playArcadeSound("hurt", sound);
              setTimer(fx, "wizardHit", 350);
              setTimer(fx, "shake", 220);
            }
            if (at) {
              shoot(fx, "orb", at.enemy.x, at.enemy.y, at.wizard.x, at.wizard.y, "#7f1d1d", 200);
              floatText(fx, at.wizard.x, at.wizard.y - at.u * 3, event.blocked ? `${t("ba.blocked")} -${event.damage}` : `-${event.damage}`, event.blocked ? "#c4b5fd" : "#fca5a5", 20);
            }
            break;
          case "enemyHeal": playArcadeSound("powerup", sound); if (at) floatText(fx, at.enemy.x, at.enemy.y - at.u * 2.4, `+${event.amount}`, "#86efac", 20); break;
          case "won": case "lost": break;
        }
      }
      sim.events.length = 0;
    },
    save(sim, recorder) {
      const out = arenaOutcome(sim);
      playArcadeSound(out.won ? "win" : "lose", sound);
      if (sim.stats.totalKeys === 0) return null;
      const key = `${GAME}:${sim.cfg.language}:${sim.cfg.difficulty}:${sim.cfg.arena}`;
      return saveRun({
        game: GAME, language: sim.cfg.language, difficulty: sim.cfg.difficulty, score: out.score.total, wpm: out.wpm, cpm: out.cpm, accuracy: out.accuracy, mistakes: out.mistakes,
        correctChars: out.correctChars, bestStreak: out.bestStreak, durationMs: out.timeMs, won: out.won,
        detail: out.won ? t("ba.detailWon", { a: t(`unl.arena-${sim.cfg.arena}`) }) : t("ba.detailLost", { n: out.defeated, total: out.total }),
        sum: { fallen: sim.over === "lost" ? 1 : 0, defeated: out.defeated, crits: out.crits, casts: out.casts, damage: out.damageDealt, [`cleared_${sim.cfg.arena}`]: out.won ? 1 : 0 },
        max: { hpLeft: out.won ? out.hpLeft : 0, combo: out.bestCombo },
      }, out.score, key, scores[key]?.best ?? 0, recorder);
    },
  });
  const { settings, store, session, hud, report, attachCanvas } = game;
  const language = settings.language;

  const saved = store.loadout["arena.difficulty"];
  const difficulty: ArcadeDifficulty = isArcadeDifficulty(saved) ? saved : "easy";
  const arena = loadoutChoice<ArenaId>(store, "arena.place", ARENAS, "forest", "arena");
  const spells = [...BASE_SPELLS, ...EXTRA_SPELLS.filter((id) => isUnlocked(store, `spell:${id}`))];
  const pick = (key: string) => (value: string) => updateArcade({ loadout: { [key]: value } });

  function start() {
    game.begin(createArena({ language, difficulty, arena, spells, seed: (Date.now() ^ 0x51ed270b) >>> 0 }));
  }
  function onChar(char: string) {
    game.act((sim) => {
      const before = sim.active === null ? null : sim.slots[sim.active];
      const expected = before ? expectedChar(before.buf) : null;
      const keys = sim.stats.totalKeys;
      arenaChar(sim, char);
      if (sim.stats.totalKeys === keys) return; // ignored (between enemies, or the word is full)
      if (expected !== null) game.recorder.keystroke(sim.cfg.language, expected, char === expected);
      else if (sim.events.some((e) => e.type === "lock")) game.recorder.keystroke(sim.cfg.language, char, true);
    });
  }
  const onBackspace = () => game.act(arenaBackspace);

  useKeyInput(session.phase === "playing", hud.language, { onChar, onBackspace, onEscape: session.pause });

  const result = report?.result;
  const khmer = hud.language === "khmer";

  return <ArcadeShell
    game={GAME} icon="🧙" music="arena" session={session} difficulty={difficulty} onDifficulty={pick("arena.difficulty")} runLanguage={hud.language}
    variant={`${GAME}:${language}:${difficulty}:${arena}`}
    howTo={STEP_ICONS.map((icon, i) => ({ icon, title: t(`ba.s${i + 1}t`), text: t(`ba.s${i + 1}`) }))}
    controls={[{ keys: t("arc.keyLetters"), text: t("ba.c1") }, { keys: "Backspace", text: t("ba.c2") }, { keys: "Esc", text: t("arc.keyPause") }]}
    options={<>
      <OptionPicker label={t("ba.arena")} value={arena} onChange={pick("arena.place")} options={ARENAS.map((id) => ({ id, label: t(`unl.arena-${id}`), locked: !isUnlocked(store, `arena:${id}`), how: t(`unl.arena-${id}.how`), preview: <span className="text-2xl" aria-hidden="true">{ARENA_ICONS[id]}</span> }))} />
      <div>
        <div className="mb-1.5 text-xs font-bold uppercase tracking-wider text-mute">{t("ba.spellbook")}</div>
        <ul className="grid gap-1.5 text-xs text-slate-600 sm:grid-cols-2">
          {([...BASE_SPELLS, ...EXTRA_SPELLS, "ultimate"] as SpellId[]).map((id) => {
            const locked = id !== "ultimate" && !spells.includes(id);
            return <li key={id} className={`rounded-xl bg-slate-50 px-2.5 py-2 ${locked ? "opacity-60" : ""}`}>
              <strong className="block text-navy">{locked ? "🔒" : SPELL_ICONS[id]} {t(`unl.spell-${id}`)}{id !== "ultimate" && <span className="ml-1 font-semibold text-mute">· {SPELLS[id].mana} {t("ba.mana")}</span>}</strong>
              {locked ? t(`unl.spell-${id}.how`) : t(`ba.spell.${id}`)}
            </li>;
          })}
        </ul>
      </div>
    </>}
    hud={<>
      <Chip label={t("ba.enemies")} value={`${Math.min(hud.defeated + 1, hud.total || 1)} / ${hud.total || "—"}`} tone={hud.enemy?.boss ? "gold" : "default"} />
      <Chip label={t("gm.score")} value={hud.points.toLocaleString("en-US")} />
      <Chip label={t("gm.time")} value={formatTime(hud.timeMs)} />
      <Chip label="WPM" value={hud.wpm} />
      <Chip label={t("gm.accuracy")} value={`${hud.accuracy}%`} tone={hud.accuracy >= 95 ? "good" : hud.accuracy < 85 ? "bad" : "default"} />
      <Chip label={t("gm.combo")} value={hud.combo} tone={hud.combo >= 3 ? "good" : "default"} />
    </>}
    canvas={<canvas ref={attachCanvas} className="block h-full w-full" role="img" aria-label={t("ba.canvas")} />}
    panel={<div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <Meter label={`♥ ${t("zs.health")}${hud.shield ? " 🛡️" : ""}`} value={hud.hp / 100} text={`${hud.hp}`} color={hud.hp > 35 ? "#22c55e" : "#ef4444"} pulse={hud.hp <= 25} />
        <Meter label={`✦ ${t("ba.mana")}`} value={hud.mana / 100} text={`${hud.mana}`} color="#3b82f6" />
        <Meter label={`🌟 ${t("unl.spell-ultimate")}`} value={hud.ult / 100} text={hud.ult >= 100 ? t("race.ready") : undefined} color="linear-gradient(90deg,#f472b6,#facc15)" pulse={hud.ult >= 100} />
      </div>
      <ul className="grid grid-cols-2 gap-2 lg:grid-cols-5" aria-label={t("ba.spellbook")}>
        {hud.slots.map((slot) => {
          const rule = SPELLS[slot.spell];
          const dim = slot.block !== null && !slot.active;
          return <li key={slot.spell} className={`relative min-w-0 rounded-2xl border-2 bg-black/30 px-3 py-2 transition ${dim ? "opacity-45" : ""} ${slot.spell === "ultimate" ? "col-span-2 lg:col-span-1" : ""}`} style={{ borderColor: slot.active ? SPELL_COLORS[slot.spell] : "transparent" }}>
            <div className="mb-1 flex items-center justify-between gap-1 text-[11px] font-bold text-slate-300">
              <span className="truncate"><span aria-hidden="true">{SPELL_ICONS[slot.spell]} </span>{t(`unl.spell-${slot.spell}`)}</span>
              <span className="flex-none tabular-nums" style={{ color: slot.block === "mana" ? "#fca5a5" : undefined }}>
                {slot.block === "cooldown" ? `⏳ ${(slot.cooldownMs / 1000).toFixed(1)}s` : slot.spell === "ultimate" ? `${Math.floor(hud.ult)}%` : `✦ ${rule.mana}`}
              </span>
            </div>
            <TypeLine views={slot.views} khmer={khmer} className={khmer ? "text-lg sm:text-xl" : "text-base sm:text-xl"} />
          </li>;
        })}
      </ul>
      <p className="min-h-5 text-center text-xs text-slate-300" aria-live="polite">{hud.stuck ? t("gm.fixMistake") : !hud.enemy ? t("ba.nextComing") : hud.slots.some((s) => s.active) ? "" : t("ba.pickSpell")}</p>
    </div>}
    report={report}
    resultIcon={result?.won ? "🏆" : result?.sum?.fallen ? "💀" : "🏳️"}
    resultTitle={result?.won ? t("ba.victory") : result?.sum?.fallen ? t("ba.defeat") : t("arc.ended")}
    resultSubtitle={result?.detail ?? t("ba.defeatSub")}
    resultRows={result ? [
      { label: t("ba.defeated"), value: result.sum?.defeated ?? 0, tone: "good" },
      { label: t("ba.damage"), value: result.sum?.damage ?? 0, tone: "brand" },
      { label: t("ba.crits"), value: result.sum?.crits ?? 0 },
      { label: "WPM", value: result.wpm, tone: "brand" },
      { label: t("gm.accuracy"), value: `${result.accuracy}%`, tone: result.accuracy >= 95 ? "good" : "default" },
      { label: t("gm.mistakes"), value: result.mistakes, tone: result.mistakes ? "bad" : "default" },
      { label: t("arc.longestStreak"), value: result.bestStreak },
      { label: t("gm.bestCombo"), value: result.max?.combo ?? 0 },
      { label: t("gm.time"), value: formatTime(result.durationMs) },
    ] : []}
    onStart={start} onQuit={() => game.quit()}
    keyboard={{ expected: hud.expected, onChar, onBackspace }}
  />;
}
