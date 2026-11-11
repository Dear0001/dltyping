"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import VirtualKeyboard from "@/components/keyboard/VirtualKeyboard";
import GameControls from "@/components/games/shared/GameControls";
import { primaryBtn, secondaryBtn } from "@/components/games/shared/GameDialog";
import GameInstructions, { type Instruction } from "@/components/games/shared/GameInstructions";
import GameLayout from "@/components/games/shared/GameLayout";
import GameResults, { type ResultRow } from "@/components/games/shared/GameResults";
import GameThumb from "@/components/games/shared/GameThumb";
import { LanguageSelector, Segmented } from "@/components/games/shared/Selectors";
import { useLocale } from "@/components/shared/LocaleProvider";
import { getGame } from "@/data/games";
import { useArcadeStore, useMediaQuery, type ArcadeSession } from "@/hooks/use-arcade";
import { useGameText } from "@/hooks/useGameText";
import { useScores, useSeen, useSettings } from "@/hooks/use-stored-value";
import { startMusic, stopMusic, type MusicTheme } from "@/lib/arcade/audio";
import { ARCADE_DIFFICULTIES, type ArcadeDifficulty } from "@/lib/arcade/difficulty";
import { ACHIEVEMENTS, statsFor, updateArcade, type ArcadeGameId } from "@/lib/arcade/progress";
import type { RunReport } from "@/lib/arcade/save";
import { levelFromArcadeXp, xpForArcadeLevel } from "@/lib/arcade/scoring";
import type { Language } from "@/types";

const card = "rounded-3xl border border-slate-200 bg-white p-5 shadow-sm";
const heading = "mb-3 text-sm font-extrabold uppercase tracking-wider text-mute";

function subscribeFullscreen(notify: () => void) {
  document.addEventListener("fullscreenchange", notify);
  return () => document.removeEventListener("fullscreenchange", notify);
}

export type ArcadeShellProps = {
  game: ArcadeGameId;
  icon: string;
  music: MusicTheme;
  session: ArcadeSession;
  difficulty: ArcadeDifficulty;
  onDifficulty: (difficulty: ArcadeDifficulty) => void;
  /** Language of the run in progress (the lobby uses the saved setting). */
  runLanguage: Language;
  /** Extra lobby choices (track, car, stage…). */
  options?: React.ReactNode;
  howTo: Instruction[];
  /** Keys and what they do, for the details page. */
  controls: { keys: string; text: string }[];
  /** Personal-best key for the current setup. */
  variant: string;
  hud: React.ReactNode;
  canvas: React.ReactNode;
  panel: React.ReactNode;
  report: RunReport | null;
  resultTitle: string;
  resultSubtitle: string;
  resultIcon: string;
  resultRows: ResultRow[];
  onStart: () => void;
  /** Ends the run early and shows its results. */
  onQuit: () => void;
  keyboard: { expected: string | null; onChar: (char: string) => void; onBackspace: () => void };
};

/**
 * Everything the arcade games share around their canvas: the details page
 * (overview, how to play, setup, bests, achievements), the in-game frame with
 * HUD, countdown, pause menu and fullscreen, and the results screen.
 */
export default function ArcadeShell(props: ArcadeShellProps) {
  const { game, session, report } = props;
  const { phase, resume } = session;
  const { t } = useLocale();
  const gt = useGameText();
  const [settings, updateSettings] = useSettings();
  const store = useArcadeStore();
  const scores = useScores();
  const seen = useSeen();
  const meta = getGame(game);
  const frameRef = useRef<HTMLDivElement>(null);
  const fullscreen = useSyncExternalStore(subscribeFullscreen, () => document.fullscreenElement !== null, () => false);
  const touch = useMediaQuery("(pointer: coarse)");
  const [keyboardChoice, setKeyboardChoice] = useState<boolean | null>(null);
  const showKeyboard = keyboardChoice ?? touch;
  const inGame = phase === "countdown" || phase === "playing" || phase === "paused";

  // Music plays only while a run is on screen.
  useEffect(() => {
    if (phase === "countdown" || phase === "playing") startMusic(props.music, store.music && settings.sound);
    else stopMusic();
  }, [phase, props.music, store.music, settings.sound]);
  useEffect(() => stopMusic, []);

  // Bring the game into view when a run starts, so the stage and the text to type are both on screen.
  useEffect(() => {
    if (phase === "countdown") frameRef.current?.scrollIntoView({ block: "start", behavior: "auto" });
  }, [phase]);

  // Results: focus "Play again" only after a moment, so an Enter meant for the game cannot restart it by accident.
  const againRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (phase !== "finished") return;
    window.scrollTo({ top: 0 });
    const id = window.setTimeout(() => againRef.current?.focus(), 1200);
    return () => window.clearTimeout(id);
  }, [phase]);

  // Leave fullscreen when the run is over so the results are visible.
  useEffect(() => {
    if (!inGame && document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
  }, [inGame]);

  // Escape resumes from the pause menu (while playing, the game's own key handler pauses).
  useEffect(() => {
    if (phase !== "paused") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      resume();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, resume]);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    else void frameRef.current?.requestFullscreen?.().catch(() => undefined);
  }, []);

  const stats = statsFor(store, game);
  const level = levelFromArcadeXp(store.xp);
  const levelFloor = xpForArcadeLevel(level), levelCeil = xpForArcadeLevel(level + 1);
  const achievements = ACHIEVEMENTS.filter((a) => a.game === game || a.game === null);
  const history = store.history.filter((h) => h.game === game).slice(-5).reverse();
  const bestFor = (difficulty: ArcadeDifficulty) => Object.entries(scores).filter(([key]) => key === `${game}:${settings.language}:${difficulty}` || key.startsWith(`${game}:${settings.language}:${difficulty}:`)).reduce((max, [, entry]) => Math.max(max, entry.best), 0);
  const iconButton = "grid h-9 w-9 flex-none place-items-center rounded-xl bg-white/10 text-base text-white transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white";

  return <GameLayout>
    <nav className="mb-4 flex gap-2 text-xs font-semibold text-mute" aria-label={t("arc.breadcrumb")}>
      <Link href="/games" className="hover:text-brand">{t("gm.allGames")}</Link><span aria-hidden="true">/</span><span className="text-navy">{gt.title(meta)}</span>
    </nav>

    {phase === "lobby" && <div className="space-y-5">
      <header className={`overflow-hidden rounded-3xl bg-gradient-to-br ${meta.gradient} text-white shadow-lg`}>
        <div className="grid items-center gap-4 sm:grid-cols-[1.2fr_1fr]">
          <div className="p-6 sm:p-8">
            <div className="mb-3 flex flex-wrap gap-1.5 text-[11px] font-bold">
              <span className="rounded-full bg-black/25 px-2.5 py-1">{gt.category(meta.category)}</span>
              <span className="rounded-full bg-black/25 px-2.5 py-1">{t("arc.singlePlayer")}</span>
              <span className="rounded-full bg-black/25 px-2.5 py-1">{meta.languages.map(gt.language).join(" · ")}</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl"><span aria-hidden="true">{props.icon} </span>{gt.title(meta)}</h1>
            <p className="mt-2 max-w-xl text-sm text-white/90">{gt.description(meta)}</p>
          </div>
          <div className="hidden h-44 sm:block" aria-hidden="true"><GameThumb id={game} /></div>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1.05fr_1fr]">
        <section className={card} aria-labelledby="arc-setup">
          <h2 id="arc-setup" className={heading}>{t("arc.setup")}</h2>
          <div className="space-y-4">
            <LanguageSelector value={settings.language} onChange={(language) => updateSettings({ language })} />
            <Segmented label={t("gamehub.difficulty")} value={props.difficulty} onChange={props.onDifficulty} options={ARCADE_DIFFICULTIES.map((d) => ({ value: d, label: gt.difficulty(d) }))} />
            {props.options}
            <p className="text-xs text-mute">{t("gm.bestOnSetup")}<strong className="text-navy">{(scores[props.variant]?.best ?? 0).toLocaleString("en-US")}</strong></p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button type="button" data-autofocus className={`${primaryBtn} flex-1 !py-3.5 !text-base`} onClick={props.onStart}>{t("gm.startGame")} →</button>
              <Link href="/games" className={secondaryBtn}>{t("gm.allGames")}</Link>
            </div>
            <p className="text-xs text-mute">{t("arc.focusHint")}</p>
          </div>
        </section>

        <div className="space-y-5">
          <section className={card} aria-labelledby="arc-how">
            <h2 id="arc-how" className={heading}>{t("gm.howToPlay")}</h2>
            <GameInstructions steps={props.howTo} firstTime={!seen[game]} />
            <h3 className="mb-2 mt-4 text-xs font-bold uppercase tracking-wider text-mute">{t("arc.controls")}</h3>
            <ul className="space-y-1.5 text-sm text-slate-600">
              {props.controls.map((c) => <li key={c.keys} className="flex items-start gap-2"><kbd className="flex-none rounded-md border border-slate-300 bg-slate-50 px-2 py-0.5 text-xs font-bold text-navy">{c.keys}</kbd><span>{c.text}</span></li>)}
            </ul>
          </section>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <section className={card} aria-labelledby="arc-best">
          <h2 id="arc-best" className={heading}>{t("arc.bestScores")}</h2>
          <ul className="space-y-1.5 text-sm">
            {ARCADE_DIFFICULTIES.map((d) => <li key={d} className="flex justify-between rounded-xl bg-slate-50 px-3 py-2"><span className="font-semibold">{gt.difficulty(d)}</span><strong className="tabular-nums text-brand">{bestFor(d) ? bestFor(d).toLocaleString("en-US") : "—"}</strong></li>)}
          </ul>
          <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
            <div><dt className="text-mute">{t("arc.plays")}</dt><dd className="text-base font-extrabold">{stats.plays}</dd></div>
            <div><dt className="text-mute">{t("arc.bestWpm")}</dt><dd className="text-base font-extrabold">{stats.bestWpm}</dd></div>
            <div><dt className="text-mute">{t("arc.bestStreak")}</dt><dd className="text-base font-extrabold">{stats.bestStreak}</dd></div>
          </dl>
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-xs font-semibold text-mute"><span>{t("arc.level", { n: level })}</span><span>{store.xp.toLocaleString("en-US")} XP</span></div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-gradient-to-r from-brand to-accent" style={{ width: `${Math.round(((store.xp - levelFloor) / (levelCeil - levelFloor)) * 100)}%` }} /></div>
          </div>
        </section>

        <section className={card} aria-labelledby="arc-ach">
          <h2 id="arc-ach" className={heading}>{t("arc.achievements")} <span className="font-semibold normal-case tracking-normal">({achievements.filter((a) => store.achievements[a.id]).length}/{achievements.length})</span></h2>
          <ul className="grid max-h-72 gap-1.5 overflow-y-auto pr-1">
            {achievements.map((a) => {
              const earned = Boolean(store.achievements[a.id]);
              return <li key={a.id} className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm ${earned ? "bg-blue-50" : "bg-slate-50 opacity-70"}`}>
                <span className={`grid h-8 w-8 flex-none place-items-center rounded-lg bg-white text-lg shadow-sm ${earned ? "" : "grayscale"}`} aria-hidden="true">{a.icon}</span>
                <span className="min-w-0"><strong className="block truncate">{t(`ach.${a.id}.t`)}</strong><span className="block text-xs text-mute">{t(`ach.${a.id}.d`)}</span></span>
                {earned && <span className="ml-auto text-good" aria-label={t("arc.earned")}>✓</span>}
              </li>;
            })}
          </ul>
        </section>

        <section className={card} aria-labelledby="arc-recent">
          <h2 id="arc-recent" className={heading}>{t("arc.recent")}</h2>
          {history.length === 0
            ? <p className="text-sm text-mute">{t("arc.noRuns")}</p>
            : <ul className="space-y-1.5 text-sm">
                {history.map((h, i) => <li key={`${h.at}-${i}`} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2">
                  <span className="min-w-0"><strong className="block truncate">{h.detail ?? gt.difficulty(h.difficulty)}</strong><span className="block text-xs text-mute">{gt.language(h.language)} · {gt.difficulty(h.difficulty)} · {h.wpm} WPM · {h.accuracy}%</span></span>
                  <strong className="tabular-nums text-brand">{h.score.toLocaleString("en-US")}</strong>
                </li>)}
              </ul>}
        </section>
      </div>
    </div>}

    {inGame && <div className="space-y-4">
      <div ref={frameRef} className="arc-frame overflow-hidden rounded-3xl bg-slate-900 text-white shadow-lg">
        <div className="flex items-center gap-2 p-2.5 sm:p-3">
          <div className="grid min-w-0 flex-1 grid-cols-3 gap-1.5 sm:grid-cols-6 sm:gap-2">{props.hud}</div>
          <div className="flex flex-col gap-1.5 sm:flex-row">
            <button type="button" className={iconButton} aria-pressed={store.music} aria-label={t(store.music ? "arc.musicOn" : "arc.musicOff")} title={t(store.music ? "arc.musicOn" : "arc.musicOff")} onClick={() => updateArcade({ music: !store.music })}>{store.music ? "🎵" : "🔕"}</button>
            {!touch && <button type="button" className={iconButton} aria-pressed={fullscreen} aria-label={t(fullscreen ? "arc.exitFullscreen" : "arc.fullscreen")} title={t(fullscreen ? "arc.exitFullscreen" : "arc.fullscreen")} onClick={toggleFullscreen}>{fullscreen ? "🗗" : "⛶"}</button>}
            <button type="button" className={iconButton} aria-label={t("gm.pauseBtn")} title={t("gm.pauseBtn")} disabled={phase !== "playing"} onClick={session.pause}>⏸</button>
          </div>
        </div>
        <div className="arc-stage relative">
          {props.canvas}
          {phase === "countdown" && <div className="absolute inset-0 grid place-items-center bg-slate-900/35" aria-live="assertive">
            <span key={session.count} className="gm-pop text-7xl font-extrabold text-white drop-shadow-lg sm:text-9xl">{session.count > 0 ? session.count : t("arc.go")}</span>
          </div>}
          {phase === "paused" && <div className="absolute inset-0 grid place-items-center overflow-y-auto bg-slate-900/80 p-4" role="dialog" aria-modal="true" aria-labelledby="arc-paused">
            <div className="w-full max-w-xs space-y-2 text-center">
              <h2 id="arc-paused" className="text-2xl font-extrabold">⏸️ {t("gm.paused")}</h2>
              <p className="pb-2 text-sm text-slate-300">{t("gm.pausedSub")}</p>
              <button type="button" autoFocus className={`${primaryBtn} w-full`} onClick={session.resume}>{t("gm.resume")}</button>
              <button type="button" className={`${secondaryBtn} w-full`} onClick={props.onStart}>{t("gm.restart")}</button>
              <button type="button" className={`${secondaryBtn} w-full`} onClick={props.onQuit}>{t("arc.endRun")}</button>
            </div>
          </div>}
        </div>
        <div className="arc-panel p-3 sm:p-4">{props.panel}</div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-mute">{t("arc.focusHint")}</p>
        <button type="button" className={`${secondaryBtn} !px-4 !py-2`} aria-pressed={showKeyboard} onClick={() => setKeyboardChoice(!showKeyboard)}>⌨ {t(showKeyboard ? "arc.hideKeyboard" : "arc.showKeyboard")}</button>
      </div>
      {showKeyboard
        ? <VirtualKeyboard language={props.runLanguage} expected={props.keyboard.expected} disabled={phase !== "playing"} onChar={props.keyboard.onChar} onBackspace={props.keyboard.onBackspace} controls={<GameControls status={phase === "playing" ? "playing" : phase === "paused" ? "paused" : "idle"} onPause={session.pause} onResume={session.resume} onRestart={props.onStart} onFinish={props.onQuit} onMenu={session.toLobby} />} />
        : <GameControls status={phase === "playing" ? "playing" : phase === "paused" ? "paused" : "idle"} onPause={session.pause} onResume={session.resume} onRestart={props.onStart} onFinish={props.onQuit} onMenu={session.toLobby} />}
    </div>}

    {phase === "finished" && <section className="mx-auto max-w-2xl rounded-3xl bg-white p-6 shadow-lg sm:p-8" aria-labelledby="arc-result">
      <div className="mb-5 text-center">
        <div className="mb-2 text-5xl" aria-hidden="true">{props.resultIcon}</div>
        <h1 id="arc-result" className="text-2xl font-extrabold text-navy">{props.resultTitle}</h1>
        <p className="mt-1 text-sm text-mute">{props.resultSubtitle}</p>
      </div>
      {report
        ? <div className="space-y-4">
            <GameResults rows={props.resultRows} newBest={report.newBest} best={report.setupBest} />
            <div className="rounded-2xl bg-slate-50 p-4 text-sm">
              <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-mute">{t("arc.scoreBreakdown")}</h2>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 tabular-nums">
                <dt>{t("arc.basePoints")}</dt><dd className="text-right font-bold">{report.breakdown.base.toLocaleString("en-US")}</dd>
                <dt>{t("arc.accuracyBonus")}</dt><dd className="text-right font-bold">+{report.breakdown.accuracyBonus.toLocaleString("en-US")}</dd>
                <dt>{t("arc.speedBonus")}</dt><dd className="text-right font-bold">+{report.breakdown.speedBonus.toLocaleString("en-US")}</dd>
                <dt>{t("arc.comboBonus")}</dt><dd className="text-right font-bold">+{report.breakdown.comboBonus.toLocaleString("en-US")}</dd>
                <dt>{t("arc.difficultyBonus", { d: gt.difficulty(report.result.difficulty) })}</dt><dd className="text-right font-bold">×{report.breakdown.multiplier}</dd>
                <dt className="border-t border-slate-200 pt-1 font-extrabold">{t("arc.finalScore")}</dt><dd className="border-t border-slate-200 pt-1 text-right text-base font-extrabold text-brand">{report.breakdown.total.toLocaleString("en-US")}</dd>
              </dl>
            </div>
            <div className="rounded-2xl bg-blue-50 p-4 text-sm">
              <p className="font-bold text-navy">+{report.outcome.xpGained} XP · {t("arc.level", { n: report.outcome.levelAfter })}{report.outcome.levelAfter > report.outcome.levelBefore && <span className="ml-2 rounded-full bg-brand px-2 py-0.5 text-xs text-white">{t("arc.levelUp")}</span>}</p>
              {report.outcome.newAchievements.length > 0 && <ul className="mt-2 space-y-1">
                {report.outcome.newAchievements.map((id) => <li key={id}>🏅 <strong>{t("arc.newAchievement")}</strong> {t(`ach.${id}.t`)}</li>)}
              </ul>}
              {report.outcome.newUnlocks.length > 0 && <ul className="mt-2 space-y-1">
                {report.outcome.newUnlocks.map((id) => <li key={id}>🔓 <strong>{t("arc.newUnlock")}</strong> {t(`unl.${id.replace(":", "-")}`)}</li>)}
              </ul>}
            </div>
          </div>
        : <p className="rounded-xl bg-slate-100 px-4 py-3 text-center text-sm text-mute">{t("arc.notSaved")}</p>}
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <button type="button" ref={againRef} className={`${primaryBtn} flex-1`} onClick={props.onStart}>{t("arc.playAgain")}</button>
        <button type="button" className={`${secondaryBtn} flex-1`} onClick={session.toLobby}>{t("arc.changeSetup")}</button>
        <Link href="/games" className={`${secondaryBtn} flex-1`}>{t("gm.allGames")}</Link>
      </div>
    </section>}
  </GameLayout>;
}
