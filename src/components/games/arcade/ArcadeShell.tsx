"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import VirtualKeyboard from "@/components/keyboard/VirtualKeyboard";
import GameControls from "@/components/games/shared/GameControls";
import { primaryBtn, secondaryBtn } from "@/components/games/shared/GameDialog";
import type { Instruction } from "@/components/games/shared/GameInstructions";
import { ResultTile, Tutorial } from "@/components/games/arcade/ArcadeParts";
import GameLayout from "@/components/games/shared/GameLayout";
import GameResults, { ResultGrid, type ResultRow } from "@/components/games/shared/GameResults";
import GameThumb from "@/components/games/shared/GameThumb";
import { LanguageSelector, Segmented } from "@/components/games/shared/Selectors";
import { useLocale } from "@/components/shared/LocaleProvider";
import { getGame } from "@/data/games";
import { useArcadeStore, useMediaQuery, type ArcadeSession } from "@/hooks/use-arcade";
import { useGameText } from "@/hooks/useGameText";
import { useScores, useSeen, useSettings } from "@/hooks/use-stored-value";
import { startMusic, stopMusic, type MusicTheme } from "@/lib/arcade/audio";
import { ARCADE_DIFFICULTIES, type ArcadeDifficulty } from "@/lib/arcade/difficulty";
import { ACHIEVEMENTS, statsFor, UNLOCKS, updateArcade, type ArcadeGameId } from "@/lib/arcade/progress";
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
  /** Extra class for the canvas stage (a game can ask for a different height). */
  stageClass?: string;
  /** True while a run is being prepared (e.g. asking the server for a verified run). */
  starting?: boolean;
  /** Extra content under the results (e.g. server verification status). */
  resultExtra?: React.ReactNode;
  /** Ends the run early and shows its results. */
  onQuit: () => void;
  keyboard: { expected: string | null; onChar: (char: string) => void; onBackspace: () => void };
  /** Reference material under the controls (e.g. expandable enemy and power-up lists). */
  guide?: React.ReactNode;
  /** Live stats shown on the pause menu. */
  pauseStats?: { label: string; value: React.ReactNode }[];
  /**
   * Headline numbers for the game-over screen, shown as large tiles (XP is added automatically).
   * When given, the full `resultRows` list moves into an expandable "All statistics" section.
   */
  resultHighlights?: (ResultRow & { icon?: string })[];
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

  // A run in progress is lost when leaving the page, so links and closing the tab ask first.
  useEffect(() => {
    if (!inGame) return;
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.("a[href]");
      if (!link || event.defaultPrevented || link.getAttribute("target") === "_blank") return;
      if (!window.confirm(t("arc.leaveConfirm"))) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    const onUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    document.addEventListener("click", onClick, true);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, [inGame, t]);

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
  const setupBest = scores[props.variant]?.best ?? 0;
  const xpToNext = Math.max(0, levelCeil - store.xp);
  const levelPct = Math.round(((store.xp - levelFloor) / Math.max(1, levelCeil - levelFloor)) * 100);
  const gameUnlocks = UNLOCKS.filter((u) => u.game === game);
  const unlocksEarned = gameUnlocks.filter((u) => store.unlocks.includes(u.id)).length;
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
            <p className="text-xs text-mute">{setupBest > 0 ? <>{t("gm.bestOnSetup")}<strong className="text-navy">{setupBest.toLocaleString("en-US")}</strong></> : t("arc.setupBestNone")}</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button type="button" data-autofocus className={`${primaryBtn} flex-1 !py-3.5 !text-base disabled:opacity-60`} onClick={props.onStart} disabled={props.starting} aria-busy={props.starting}>{props.starting ? t("ss.preparing") : `${t("gm.startGame")} →`}</button>
              <Link href="/games" className={secondaryBtn}>{t("gm.allGames")}</Link>
            </div>
            <p className="text-xs text-mute">{t("arc.focusHint")}</p>
          </div>
        </section>

        <div className="space-y-5">
          <section className={card} aria-labelledby="arc-how">
            <h2 id="arc-how" className={heading}>{t("gm.howToPlay")}</h2>
            <Tutorial steps={props.howTo} firstTime={!seen[game]} />
            <h3 className="mb-2 mt-4 text-xs font-bold uppercase tracking-wider text-mute">{t("arc.controls")}</h3>
            <ul className="space-y-1.5 text-sm text-slate-600">
              {props.controls.map((c) => <li key={c.keys} className="flex items-start gap-2"><kbd className="flex-none rounded-md border border-slate-300 bg-slate-50 px-2 py-0.5 text-xs font-bold text-navy">{c.keys}</kbd><span>{c.text}</span></li>)}
            </ul>
            {props.guide && <div className="mt-4 space-y-2">{props.guide}</div>}
          </section>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <section className={card} aria-labelledby="arc-best">
          <h2 id="arc-best" className={heading}>{t("arc.bestScores")}</h2>
          {stats.plays === 0
            ? <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center">
                <p className="text-2xl" aria-hidden="true">🏁</p>
                <p className="mt-1 text-sm font-bold text-navy">{t("arc.firstRunTitle")}</p>
                <p className="mt-1 text-xs leading-relaxed text-mute">{t("arc.firstRunText")}</p>
              </div>
            : <>
                <ul className="space-y-1.5 text-sm">
                  {ARCADE_DIFFICULTIES.map((d) => { const best = bestFor(d); return <li key={d} className="flex justify-between rounded-xl bg-slate-50 px-3 py-2"><span className="font-semibold">{gt.difficulty(d)}</span>{best ? <strong className="tabular-nums text-brand">{best.toLocaleString("en-US")}</strong> : <span className="text-xs text-mute">{t("arc.notPlayedYet")}</span>}</li>; })}
                </ul>
                <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div><dt className="text-mute">{t("arc.plays")}</dt><dd className="text-base font-extrabold tabular-nums">{stats.plays}</dd></div>
                  <div><dt className="text-mute">{t("arc.bestWpm")}</dt><dd className="text-base font-extrabold tabular-nums">{stats.bestWpm}</dd></div>
                  <div><dt className="text-mute">{t("arc.bestStreak")}</dt><dd className="text-base font-extrabold tabular-nums">{stats.bestStreak}</dd></div>
                </dl>
              </>}
          <div className="mt-4 border-t border-slate-100 pt-4">
            <div className="mb-1 flex justify-between text-xs font-bold text-navy"><span>{t("arc.level", { n: level })}</span><span className="tabular-nums text-mute">{store.xp.toLocaleString("en-US")} XP</span></div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-label={t("arc.level", { n: level })} aria-valuenow={levelPct} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-gradient-to-r from-brand to-accent" style={{ width: `${levelPct}%` }} /></div>
            <p className="mt-1.5 text-xs text-mute">{t("arc.xpToNext", { xp: xpToNext.toLocaleString("en-US"), n: level + 1 })}</p>
            <details className="group mt-2 text-xs text-slate-600">
              <summary className="flex cursor-pointer list-none items-center gap-1 font-bold text-brand [&::-webkit-details-marker]:hidden">{t("arc.howXp")}<span className="transition group-open:rotate-180" aria-hidden="true">⌄</span></summary>
              <ul className="mt-2 space-y-1.5 leading-relaxed">
                <li>⭐ {t("arc.howXp1")}</li>
                <li>📈 {t("arc.howXp2")}</li>
                <li>🔓 {gameUnlocks.length ? t("arc.howXpUnlocks", { n: unlocksEarned, total: gameUnlocks.length }) : t("arc.howXpNoUnlocks")}</li>
              </ul>
            </details>
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
        <div className={`arc-stage relative ${props.stageClass ?? ""}`}>
          {props.canvas}
          {phase === "countdown" && <div className="absolute inset-0 grid place-items-center bg-slate-900/35" aria-live="assertive">
            {session.resuming && <span className="absolute top-[22%] rounded-full bg-black/40 px-3 py-1 text-sm font-bold text-sky-200">{t("arc.resuming")}</span>}
            <span key={session.count} className="gm-pop text-7xl font-extrabold text-white drop-shadow-lg sm:text-9xl">{session.count > 0 ? session.count : t("arc.go")}</span>
          </div>}
          {phase === "paused" && <div className="absolute inset-0 grid place-items-center overflow-y-auto bg-slate-900/80 p-4" role="dialog" aria-modal="true" aria-labelledby="arc-paused">
            <div className="w-full max-w-xs space-y-2 text-center">
              <h2 id="arc-paused" className="text-2xl font-extrabold">⏸️ {t("gm.paused")}</h2>
              <p className="pb-2 text-sm text-slate-300">{t("gm.pausedSub")}</p>
              {props.pauseStats && <dl className="mb-2 grid grid-cols-2 gap-1.5 text-left">
                {props.pauseStats.map((stat) => <div key={stat.label} className="rounded-xl bg-white/10 px-3 py-1.5"><dt className="truncate text-[10px] font-bold text-slate-300">{stat.label}</dt><dd className="text-base font-extrabold tabular-nums">{stat.value}</dd></div>)}
              </dl>}
              <button type="button" autoFocus className={`${primaryBtn} w-full`} onClick={session.resume}>{t("gm.resume")} <kbd className="ml-1 rounded bg-black/20 px-1.5 text-[10px]">Esc</kbd></button>
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
            {props.resultHighlights
              ? <>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {props.resultHighlights.map((row) => <ResultTile key={row.label} {...row} />)}
                    <ResultTile label={t("arc.xpEarned")} value={`+${report.outcome.xpGained}`} icon="⭐" tone="good" />
                  </div>
                  <GameResults rows={[]} newBest={report.newBest} best={report.setupBest} />
                  {props.resultExtra}
                  <details className="group rounded-2xl border border-slate-200 p-3">
                    <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold text-navy">{t("arc.allStats")}<span className="text-mute transition group-open:rotate-180" aria-hidden="true">⌄</span></summary>
                    <div className="mt-3"><ResultGrid rows={props.resultRows} /></div>
                  </details>
                </>
              : <>
                  <GameResults rows={props.resultRows} newBest={report.newBest} best={report.setupBest} />
                  {props.resultExtra}
                </>}
            <RecordsAndRewards report={report} />
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

/** Personal records compared with this game's stats before the run, then XP, level progress, badges and unlocks. */
function RecordsAndRewards({ report }: { report: RunReport }) {
  const { t } = useLocale();
  const { result, outcome, before } = report;
  const first = before.plays === 0;
  const records = [
    { label: t("arc.recScore"), value: result.score, prev: report.setupBest, isNew: report.newBest },
    { label: t("arc.bestWpm"), value: result.wpm, prev: before.bestWpm, isNew: result.wpm > before.bestWpm && result.wpm > 0 },
    { label: t("arc.longestStreak"), value: result.bestStreak, prev: before.bestStreak, isNew: result.bestStreak > before.bestStreak && result.bestStreak > 0 },
  ];
  const floor = xpForArcadeLevel(outcome.levelAfter), ceil = xpForArcadeLevel(outcome.levelAfter + 1);
  const xp = outcome.store.xp;
  const pct = Math.round(((xp - floor) / Math.max(1, ceil - floor)) * 100);
  return <>
    <div className="rounded-2xl border border-slate-200 p-4 text-sm">
      <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-mute">{t("arc.records")}</h2>
      {first
        ? <p className="text-slate-600">{t("arc.recFirst")}</p>
        : <ul className="divide-y divide-slate-100">
            {records.map((r) => <li key={r.label} className="flex items-center justify-between gap-2 py-1.5">
              <span className="text-slate-600">{r.label}</span>
              <span className="flex items-center gap-2 tabular-nums">
                <strong className="text-navy">{r.value.toLocaleString("en-US")}</strong>
                {r.isNew
                  ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-good">{t("arc.recNew")}</span>
                  : <span className="text-xs text-mute">{t("arc.recBest", { n: Math.max(r.prev, r.value).toLocaleString("en-US") })}</span>}
              </span>
            </li>)}
          </ul>}
    </div>
    <div className="rounded-2xl bg-blue-50 p-4 text-sm">
      <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-mute">{t("arc.rewards")}</h2>
      <p className="font-bold text-navy">+{outcome.xpGained} XP · {t("arc.level", { n: outcome.levelAfter })}{outcome.levelAfter > outcome.levelBefore && <span className="ml-2 rounded-full bg-brand px-2 py-0.5 text-xs text-white">{t("arc.levelUp")}</span>}</p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white" role="progressbar" aria-label={t("arc.level", { n: outcome.levelAfter })} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-gradient-to-r from-brand to-accent" style={{ width: `${pct}%` }} /></div>
      <p className="mt-1 text-xs text-mute">{t("arc.xpToNext", { xp: Math.max(0, ceil - xp).toLocaleString("en-US"), n: outcome.levelAfter + 1 })}</p>
      {outcome.newAchievements.length > 0 && <ul className="mt-2 space-y-1">
        {outcome.newAchievements.map((id) => <li key={id}>🏅 <strong>{t("arc.newAchievement")}</strong> {t(`ach.${id}.t`)}</li>)}
      </ul>}
      {outcome.newUnlocks.length > 0 && <ul className="mt-2 space-y-1">
        {outcome.newUnlocks.map((id) => <li key={id}>🔓 <strong>{t("arc.newUnlock")}</strong> {t(`unl.${id.replace(":", "-")}`)}</li>)}
      </ul>}
    </div>
  </>;
}
