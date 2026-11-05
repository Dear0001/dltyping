"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { getTypingStats } from "@/lib/typing-engine";
import { normalizeKhmer } from "@/lib/khmer-unicode";
import { lessons } from "@/data/lessons";
import type { Language, OSPlatform } from "@/types";
import { useLocale } from "@/components/shared/LocaleProvider";
import SiteHeader from "@/components/shared/SiteHeader";
import { completeLesson, readUserProgress, recordPractice } from "@/lib/local-progress";
import { curricula, findLesson } from "@/data/curriculum";
import { GameDialog } from "@/components/games/shared/GameDialog";
import { pickRandomLesson } from "@/lib/lesson-picker";
import VirtualKeyboard from "@/components/keyboard/VirtualKeyboard";
import { osFromPlatform } from "@/lib/keyboard/keyboard-detection";
import WeakKeysReport from "@/components/typing/WeakKeysReport";
import { useKeyStatBook } from "@/hooks/useKeyStatBook";
import { flushSession, recordKeystrokes, weakKeys, type KeyStats } from "@/lib/keyboard/key-stats";
import { findKeyFor } from "@/lib/keyboard/keyboard-mapping";
import { useActivityRecorder } from "@/hooks/useActivityRecorder";

type TypingPracticeProps = {
  language: Language;
  platform?: OSPlatform;
  initialLessonId?: string;
  timeLimit?: number;
  /** Drill text built from a dashboard recommendation (weak keys, combinations or words). */
  initialDrill?: string | null;
};

export default function TypingPractice({ language, platform = "Unknown", initialLessonId, timeLimit = 60, initialDrill = null }: TypingPracticeProps) {
  const { locale, t } = useLocale();
  const list = lessons[language];
  const [lessonId, setLessonId] = useState(() => list.find((item) => item.id === initialLessonId)?.id ?? list[0].id);
  const [input, setInput] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [paused, setPaused] = useState(false);
  const [forcedDone, setForcedDone] = useState(false);
  const [resultClosed, setResultClosed] = useState(false);
  const [drillText, setDrillText] = useState<string | null>(initialDrill);
  const [needsKhmerInputSwitch, setNeedsKhmerInputSwitch] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const isComposingRef = useRef(false);
  const sessionStatsRef = useRef<KeyStats>({});
  const lastKeyAtRef = useRef<number | null>(null);
  const compositionStartRef = useRef("");
  const lesson = list.find((item) => item.id === lessonId) ?? list[0];
  const lessonLevel = lesson.level === "Beginner" ? t("practice.beginner") : t("practice.intermediate");
  const lessonMinutes = Number.parseInt(lesson.duration, 10) || 1;
  const target = drillText ?? lesson.text;
  const keyBook = useKeyStatBook();
  const recorder = useActivityRecorder();
  const [autoCompleted, setAutoCompleted] = useState<{ xp: number } | null>(null);
  const normalizedInput = language === "khmer" ? normalizeKhmer(input) : input;
  const normalizedTarget = language === "khmer" ? normalizeKhmer(target) : target;
  const stats = useMemo(() => getTypingStats(normalizedTarget, normalizedInput, seconds), [normalizedTarget, normalizedInput, seconds]);
  const typedLength = Array.from(normalizedInput).length;
  const done = forcedDone || (!running && !paused && typedLength > 0 && (seconds >= timeLimit || typedLength >= Array.from(normalizedTarget).length));
  const heat: Record<string, number> = {};
  if (done) for (const k of weakKeys(keyBook[language])) {
    const code = findKeyFor(language, k.char)?.code;
    if (code) heat[code] = Math.max(heat[code] ?? 0, Math.min(1, 0.35 + k.score / 80));
  }
  const mistakes = done ? Array.from(normalizedInput).flatMap((typed, index) => {
    const expected = Array.from(normalizedTarget)[index];
    return expected !== undefined && typed !== expected ? [{ index, expected, typed }] : [];
  }) : [];
  const lessonIndex = list.findIndex((item) => item.id === lessonId);
  const nextLesson = list[lessonIndex + 1];
  const nextCharacter = Array.from(normalizedTarget)[Array.from(normalizedInput).length] ?? "";
  useEffect(() => () => {
    const context = audioRef.current;
    audioRef.current = null;
    if (context && context.state !== "closed") {
      try {
        void context.close().catch(() => undefined);
      } catch {
        // The browser may close an audio context while navigating away.
      }
    }
  }, []);

  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(() => {
      if (seconds + 1 >= timeLimit) {
        setSeconds(timeLimit);
        setRunning(false);
        return;
      }
      setSeconds(seconds + 1);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [running, seconds, timeLimit]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!done) return;
    flushSession(language, sessionStatsRef.current);
    sessionStatsRef.current = {};
    // Drills use made-up text, so they would skew the lesson WPM records.
    if (!drillText) recordPractice(language, stats.wpm, stats.accuracy);
    // Dashboard record: running out the clock is a typing test, finishing the passage is a completed lesson.
    recorder.wordsFromText(language, normalizedTarget, normalizedInput);
    // A curriculum lesson completes by itself once the whole passage is typed within its limits.
    const finishedPassage = typedLength >= Array.from(normalizedTarget).length;
    const rule = drillText || !finishedPassage ? undefined : findLesson(curricula[language], lessonId)?.completionCriteria;
    const lessonMet = !!rule && stats.accuracy >= rule.minAccuracy && stats.wpm >= (rule.minWpm ?? 0);
    recorder.finish({
      lessonDone: lessonMet,
      activity: drillText ? "drill" : seconds >= timeLimit && typedLength < Array.from(normalizedTarget).length ? "typing-test" : "lesson",
      language,
      durationSec: seconds,
      correct: stats.correct,
      incorrect: stats.errors,
      difficulty: lesson.level === "Beginner" ? "easy" : "medium",
      detail: drillText ? "Weak-key drill" : lesson.title,
    });
    if (lessonMet) {
      const wasDone = !!readUserProgress().completedLessons[`${language}:${lessonId}`];
      const xp = findLesson(curricula[language], lessonId)?.xpReward ?? 50;
      completeLesson(language, lessonId, xp);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAutoCompleted({ xp: wasDone ? 0 : xp });
    }
    // Save once per finished session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  // Save any unsaved per-key stats when leaving the page.
  useEffect(() => () => {
    flushSession(language, sessionStatsRef.current);
    sessionStatsRef.current = {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Start over. A drill is kept on retry, and cleared when another lesson is chosen. */
  function reset(nextId = lessonId, drill?: string | null) {
    recorder.flush();
    flushSession(language, sessionStatsRef.current);
    sessionStatsRef.current = {};
    lastKeyAtRef.current = null;
    setDrillText(drill !== undefined ? drill : nextId === lessonId ? drillText : null);
    setLessonId(nextId);
    setPaused(false);
    setForcedDone(false);
    setAutoCompleted(null);
    setResultClosed(false);
    setInput("");
    setSeconds(0);
    setRunning(false);
    setNeedsKhmerInputSwitch(false);
    inputRef.current?.focus();
  }

  function handleInput(value: string, previousValue = input) {
    if (paused || done) return;
    if (isComposingRef.current) {
      setInput(value);
      if (!running && value.length) setRunning(true);
      return;
    }

    const maxCharacters = Array.from(normalizedTarget).length;
    const nextInput = Array.from(value).slice(0, maxCharacters).join("");
    if (!running && nextInput.length) setRunning(true);
    const cleanNext = language === "khmer" ? normalizeKhmer(nextInput) : nextInput;
    const cleanPrevious = language === "khmer" ? normalizeKhmer(previousValue) : previousValue;
    const nextChars = Array.from(cleanNext);
    const previousLength = Array.from(cleanPrevious).length;

    if (nextChars.length > previousLength) {
      const additions = nextChars.slice(previousLength);
      recordKeystrokes(sessionStatsRef.current, lastKeyAtRef, additions.flatMap((typed, offset): [string, boolean][] => {
        const expectedChar = Array.from(normalizedTarget)[previousLength + offset];
        return expectedChar ? [[expectedChar, typed === expectedChar]] : [];
      }));
      additions.forEach((typed, offset) => {
        const expectedChar = Array.from(normalizedTarget)[previousLength + offset];
        if (expectedChar) recorder.keystroke(language, expectedChar, typed === expectedChar);
      });
      playKeySound(!additions.some((typed, offset) => typed !== Array.from(normalizedTarget)[previousLength + offset]));

      if (language === "khmer") {
        const latestCharacter = additions.at(-1) ?? "";
        if (/[a-z]/i.test(latestCharacter)) setNeedsKhmerInputSwitch(true);
        else if (/[\u1780-\u17ff]/u.test(latestCharacter)) setNeedsKhmerInputSwitch(false);
      }
    }

    setInput(nextInput);
    if (nextChars.length >= maxCharacters) setRunning(false);
  }

  function handleCompositionStart() {
    isComposingRef.current = true;
    compositionStartRef.current = input;
  }

  function handleCompositionEnd(value: string) {
    isComposingRef.current = false;
    handleInput(value, compositionStartRef.current);
  }

  function handleVirtualChar(char: string) {
    handleInput(`${input}${char}`);
    inputRef.current?.focus();
  }

  function handleVirtualBackspace() {
    handleInput(Array.from(input).slice(0, -1).join(""));
    inputRef.current?.focus();
  }

  function playKeySound(correct: boolean) {
    if (!soundEnabled) return;
    try {
      const AudioContextConstructor = window.AudioContext;
      if (!AudioContextConstructor) return;
      const context = audioRef.current && audioRef.current.state !== "closed" ? audioRef.current : new AudioContextConstructor();
      audioRef.current = context;
      if (context.state === "suspended") void context.resume().catch(() => undefined);
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const now = context.currentTime;
      oscillator.type = correct ? "sine" : "triangle";
      oscillator.frequency.setValueAtTime(correct ? 660 : 190, now);
      if (!correct) oscillator.frequency.exponentialRampToValueAtTime(115, now + 0.09);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(correct ? 0.045 : 0.055, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + (correct ? 0.055 : 0.12));
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + (correct ? 0.06 : 0.13));
    } catch {
      // Audio is optional; typing should continue if the browser blocks it.
    }
  }

  return (
    <main className="practice-page">
      <SiteHeader />
      <section className="practice-shell" id="practice">
        <div className="practice-grid">
          <section className="practice-main">
            <div className="lesson-bar"><div className="lesson-name"><span className="lesson-icon">✳</span><div><span className="small-label">{t("practice.currentLesson")}</span><strong>{drillText ? (locale === "km" ? "ហាត់គ្រាប់ចុចខ្សោយ" : "Weak-key drill") : lesson.title}</strong></div></div><select value={lessonId} onChange={(event) => reset(event.target.value)} aria-label={locale === "km" ? "ជ្រើសរើសមេរៀន" : "Choose lesson"}>{list.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></div>
            <div className="typing-card">
              <div className="text-meta"><span>{t("practice.typeBelow")}</span><span>{lessonLevel} <i>·</i> {lessonMinutes} {t("setup.min")}</span></div>
              <div className={`prompt ${language === "khmer" ? "khmer-prompt" : ""}`} onClick={() => inputRef.current?.focus()}>
                {Array.from(target).map((char, index) => {
                  const typed = Array.from(normalizedInput)[index];
                  const state = typed === undefined ? "pending" : typed === char ? "correct" : "wrong";
                  return <span key={`${index}-${char}`} className={`char ${state} ${index === normalizedInput.length ? "cursor" : ""}`}>{char}</span>;
                })}
              </div>
              <textarea ref={inputRef} value={input} onChange={(event) => handleInput(event.target.value)} onCompositionStart={handleCompositionStart} onCompositionEnd={(event) => handleCompositionEnd(event.currentTarget.value)} onPaste={(event) => event.preventDefault()} className="typing-input" aria-label={locale === "km" ? "វាយអត្ថបទមេរៀន" : "Type the lesson text"} lang={language === "khmer" ? "km" : "en"} autoCapitalize="off" autoCorrect="off" spellCheck={false} />
              {paused && <p className="mx-auto my-2 w-fit rounded-lg bg-blue-50 px-4 py-2 text-sm font-semibold text-brand" role="status">⏸ Paused — press Resume to continue.</p>}
              {done && !resultClosed && <GameDialog title="Lesson complete" icon="🎉" onEscape={() => setResultClosed(true)}>
                <div className="text-center">
                {autoCompleted && <p className="mt-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-extrabold text-emerald-800" role="status">🏆 Lesson Complete!{autoCompleted.xp > 0 ? ` +${autoCompleted.xp} XP` : ""}</p>}
                <dl className="my-4 grid grid-cols-4 gap-2 text-center">{[["WPM", stats.wpm], ["Accuracy", `${stats.accuracy}%`], ["Errors", stats.errors], ["Time", `${seconds}s`]].map(([label, value]) => <div key={String(label)} className="rounded-xl bg-slate-50 p-2"><dt className="text-[10px] font-bold uppercase text-mute">{label}</dt><dd className="text-xl font-extrabold text-navy">{value}</dd></div>)}</dl>
                {mistakes.length > 0 && <div className="mb-4 text-left"><p className="mb-2 text-[10px] font-bold uppercase text-mute">Mistakes ({mistakes.length})</p><ul className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">{mistakes.map((m) => <li key={m.index} className="rounded-lg bg-red-50 px-2 py-1 text-xs text-red-700">expected <b>{m.expected === " " ? "space" : m.expected}</b>, typed <b>{m.typed === " " ? "space" : m.typed}</b></li>)}</ul></div>}
                <div className="flex flex-wrap justify-center gap-2">
                  <button data-autofocus type="button" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-navy" onClick={() => reset()}>↻ Retry</button>
                  <button type="button" className="rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white" onClick={() => reset(pickRandomLesson(language, lessonId).id)}>🎲 Random article</button>
                  {nextLesson && <button type="button" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-navy" onClick={() => reset(nextLesson.id)}>Next lesson →</button>}
                  <Link href="/games" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-navy">🎮 Play a game</Link>
                  <button type="button" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-navy" onClick={() => setResultClosed(true)}>Close</button>
                </div>
                <WeakKeysReport language={language} km={locale === "km"} onDrill={(text) => reset(lessonId, text)} />
                </div>
              </GameDialog>}
              <div className="typing-footer"><span><kbd>tab</kbd> + <kbd>enter</kbd> {t("practice.restartHint")}</span><div className="typing-actions"><button className={`sound-toggle ${soundEnabled ? "sound-on" : ""}`} onClick={() => setSoundEnabled((enabled) => !enabled)} aria-pressed={soundEnabled} title={soundEnabled ? t("practice.mute") : t("practice.enableSound")}>{soundEnabled ? "◖))" : "◖×"}<span>{t(soundEnabled ? "practice.soundOn" : "practice.soundOff")}</span></button>{!done && <button className="restart-button" onClick={() => { if (paused) { setPaused(false); if (typedLength > 0) setRunning(true); inputRef.current?.focus(); } else { setPaused(true); setRunning(false); } }} disabled={typedLength === 0 && !paused}>{paused ? "▶ Resume" : "⏸ Pause"}</button>}{!done && typedLength > 0 && <button className="restart-button" onClick={() => { setRunning(false); setPaused(false); setForcedDone(true); }}>🏁 Finish</button>}<button className="restart-button" onClick={() => reset()}>↻ <span>{t("practice.restart")}</span></button></div></div>
            </div>
            {needsKhmerInputSwitch && language === "khmer" && <div className="input-switch-hint" role="alert"><span className="feedback-icon">!</span><span><strong>{t("practice.switchTitle")}</strong><br />{t(platform === "Windows" ? "practice.switchWindows" : platform === "macOS" ? "practice.switchMac" : "practice.switchUnknown")}</span></div>}
            <VirtualKeyboard language={language} heat={done ? heat : undefined} expected={done || paused ? null : nextCharacter || null} disabled={paused || done} osHint={osFromPlatform(platform)} onChar={handleVirtualChar} onBackspace={handleVirtualBackspace} />
          </section>
          <aside className="stats-column"><div className="stats-card"><div className="stats-title"><span>{t("practice.sessionStats")}</span><span className="info">i</span></div><div className="wpm-stat"><strong>{stats.wpm}</strong><span>{t("practice.wpm")}</span></div><div className="stat-divider"/><div className="mini-stat"><span>{t("practice.accuracy")}</span><strong>{stats.accuracy}<small>%</small></strong></div><div className="mini-stat"><span>{t("practice.errors")}</span><strong>{stats.errors.toString().padStart(2, "0")}</strong></div><div className="mini-stat"><span>{t("practice.time")}</span><strong>{Math.floor(seconds / 60).toString().padStart(2, "0")}:{(seconds % 60).toString().padStart(2, "0")}</strong></div><div className="progress-label"><span>{t("practice.lessonProgress")}</span><strong>{stats.progress}%</strong></div><div className="progress-track"><span style={{ width: `${stats.progress}%` }}/></div></div><div className="tip-card"><span className="tip-icon">✦</span><div><strong>{t("practice.tipTitle")}</strong><p>{t("practice.tipText")}</p></div></div><div className="next-lesson"><span className="small-label">{t("practice.upNext")}</span><strong>{list[(list.findIndex((item) => item.id === lessonId) + 1) % list.length].title}</strong><button onClick={() => reset(list[(list.findIndex((item) => item.id === lessonId) + 1) % list.length].id)}>{t("practice.preview")} <span>→</span></button></div></aside>
        </div>
      </section>
    </main>
  );
}
