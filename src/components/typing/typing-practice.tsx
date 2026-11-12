"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { getTypingStats } from "@/lib/typing-engine";
import { normalizeKhmer } from "@/lib/khmer-unicode";
import { lessons } from "@/data/lessons";
import type { Language, OSPlatform } from "@/types";
import { useLocale } from "@/components/shared/LocaleProvider";
import { useCurriculumText } from "@/hooks/useCurriculumText";
import { completeLesson, readUserProgress, recordPractice } from "@/lib/local-progress";
import { curricula, findLesson } from "@/data/curriculum";
import { GameDialog } from "@/components/games/shared/GameDialog";
import { pickArticle } from "@/lib/lesson-picker";
import { DURATIONS, MAX_DURATION, articleFromIds, averageWpm, isPlainLesson, minutesToDuration, targetWords, typingWords, type Article } from "@/lib/article-length";
import { readStore } from "@/lib/progress/progress-storage";
import VirtualKeyboard from "@/components/keyboard/VirtualKeyboard";
import { osFromPlatform } from "@/lib/keyboard/keyboard-detection";
import WeakKeysReport from "@/components/typing/WeakKeysReport";
import { useKeyStatBook } from "@/hooks/useKeyStatBook";
import { flushSession, recordKeystrokes, weakKeys, type KeyStats } from "@/lib/keyboard/key-stats";
import { findKeyFor } from "@/lib/keyboard/keyboard-mapping";
import { useActivityRecorder } from "@/hooks/useActivityRecorder";
import { Icon, ProgressBar, btn } from "@/components/ui/ui";

type TypingPracticeProps = {
  language: Language;
  platform?: OSPlatform;
  initialLessonId?: string;
  timeLimit?: number;
  /** Drill text built from a dashboard recommendation (weak keys, combinations or words). */
  initialDrill?: string | null;
  /** A generated article sized to the chosen duration (text from one or more lessons). */
  initialArticle?: Pick<Article, "title" | "text" | "ids"> | null;
};

export default function TypingPractice({ language, platform = "Unknown", initialLessonId, timeLimit: initialTimeLimit = 60, initialDrill = null, initialArticle = null }: TypingPracticeProps) {
  const { t } = useLocale();
  const ct = useCurriculumText();
  const list = lessons[language];
  const [lessonId, setLessonId] = useState(() => list.find((item) => item.id === initialLessonId)?.id ?? list[0].id);
  const [timeLimit, setTimeLimit] = useState(initialTimeLimit);
  const [customMinutes, setCustomMinutes] = useState("");
  const [input, setInput] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [paused, setPaused] = useState(false);
  const [forcedDone, setForcedDone] = useState(false);
  const [resultClosed, setResultClosed] = useState(false);
  const [drillText, setDrillText] = useState<string | null>(initialDrill);
  const [article, setArticle] = useState<Pick<Article, "title" | "text" | "ids"> | null>(initialArticle);
  const [needsKhmerInputSwitch, setNeedsKhmerInputSwitch] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const tabArmedRef = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const isComposingRef = useRef(false);
  const sessionStatsRef = useRef<KeyStats>({});
  const lastKeyAtRef = useRef<number | null>(null);
  const compositionStartRef = useRef("");
  const lesson = list.find((item) => item.id === lessonId) ?? list[0];
  const lessonLevel = lesson.level === "Beginner" ? t("practice.beginner") : t("practice.intermediate");
  const target = drillText ?? article?.text ?? lesson.text;
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

  // Focus mode hides the site header, footer and pet so only the text is left (html[data-focus] in design-system.css).
  useEffect(() => {
    const root = document.documentElement;
    if (focusMode) root.setAttribute("data-focus", "");
    else root.removeAttribute("data-focus");
    return () => root.removeAttribute("data-focus");
  }, [focusMode]);

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
    const rule = drillText || article || !finishedPassage ? undefined : findLesson(curricula[language], lessonId)?.completionCriteria;
    const lessonMet = !!rule && stats.accuracy >= rule.minAccuracy && stats.wpm >= (rule.minWpm ?? 0);
    recorder.finish({
      lessonDone: lessonMet,
      activity: drillText ? "drill" : seconds >= timeLimit && typedLength < Array.from(normalizedTarget).length ? "typing-test" : "lesson",
      language,
      durationSec: seconds,
      correct: stats.correct,
      incorrect: stats.errors,
      difficulty: lesson.level === "Beginner" ? "easy" : "medium",
      detail: drillText ? "Weak-key drill" : article?.title ?? lesson.title,
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

  /** Change the session length: the text is resized to fit it (a drill keeps its text), then the session restarts. */
  function changeTime(nextSeconds: number) {
    if (nextSeconds === timeLimit && !customMinutes) return;
    setTimeLimit(nextSeconds);
    let next: Pick<Article, "title" | "text" | "ids"> | null | undefined;
    let nextId = lessonId;
    if (!drillText) {
      const goal = targetWords(averageWpm(readStore(), language), nextSeconds);
      const sameLesson = typingWords(lesson.text) >= goal * 0.8 ? articleFromIds(language, lessonId, goal) : null;
      const built = sameLesson ?? pickArticle(language, nextSeconds).article;
      next = isPlainLesson(built) ? null : built;
      nextId = built.ids[0];
      try { window.history.replaceState(null, "", `/learn/${language}?lesson=${encodeURIComponent(built.ids.join(","))}&goal=${goal}&time=${nextSeconds}`); } catch {}
    }
    reset(nextId, drillText, next);
  }

  /** New random article sized for the chosen duration and the user's own average speed. */
  function newArticle() {
    const { article: picked } = pickArticle(language, timeLimit, [lessonId]);
    reset(picked.ids[0], null, isPlainLesson(picked) ? null : picked);
  }

  /** Start over. A drill is kept on retry, and cleared when another lesson is chosen. */
  function reset(nextId = lessonId, drill?: string | null, nextArticle?: Pick<Article, "title" | "text" | "ids"> | null) {
    recorder.flush();
    flushSession(language, sessionStatsRef.current);
    sessionStatsRef.current = {};
    lastKeyAtRef.current = null;
    setDrillText(drill !== undefined ? drill : nextId === lessonId ? drillText : null);
    setArticle(nextArticle !== undefined ? nextArticle : nextId === lessonId ? article : null);
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

  const nextInList = list[(lessonIndex + 1) % list.length];
  const remaining = Math.max(0, timeLimit - seconds);
  const clock = (n: number) => `${Math.floor(n / 60)}:${(n % 60).toString().padStart(2, "0")}`;
  const togglePause = () => {
    if (paused) { setPaused(false); if (typedLength > 0) setRunning(true); inputRef.current?.focus(); }
    else { setPaused(true); setRunning(false); }
  };

  return (
    <main className="practice-page tp" data-focus={focusMode || undefined}>
      <section className="tp-shell" id="practice">
        {/* Session settings: lesson, length and actions in one compact bar */}
        <div className="tp-toolbar">
          <label className="tp-lesson">
            <span className="tp-lesson-icon" aria-hidden="true">{language === "khmer" ? "ក" : "Aa"}</span>
            <span className="tp-lesson-text">
              <small>{drillText ? t("practice.weakKeyDrill") : t("practice.currentLesson")} · {lessonLevel}</small>
              <select value={lessonId} onChange={(event) => reset(event.target.value)} aria-label={t("practice.chooseLesson")}>
                {article && <option value={lessonId} hidden>{article.title}</option>}
                {list.map((item) => <option key={item.id} value={item.id}>{ct.passageTitle(item)}</option>)}
              </select>
            </span>
            <Icon name="chevron" size={16} className="tp-caret" />
          </label>
          <div className="tp-durations" role="group" aria-label={t("practice.timeLabel")}>
            <Icon name="clock" size={16} className="tp-dim" />
            {DURATIONS.map((value) => <button key={value} type="button" disabled={running} aria-pressed={timeLimit === value && !customMinutes} onClick={() => { setCustomMinutes(""); changeTime(value); }}>{value / 60}{t("ui.practice.minShort")}</button>)}
            <input type="number" inputMode="numeric" min={1} max={MAX_DURATION / 60} step={1} disabled={running} value={customMinutes} placeholder={t("practice.custom")} aria-label={t("practice.customMinutes")}
              onChange={(event) => setCustomMinutes(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }}
              onBlur={() => { const secs = minutesToDuration(Number(customMinutes)); if (secs) { setCustomMinutes(String(secs / 60)); changeTime(secs); } else setCustomMinutes(""); }} />
          </div>
          <div className="tp-actions">
            <button type="button" className="tp-icon-btn" onClick={() => setSoundEnabled((enabled) => !enabled)} aria-pressed={soundEnabled} title={soundEnabled ? t("practice.mute") : t("practice.enableSound")} aria-label={t(soundEnabled ? "practice.soundOn" : "practice.soundOff")}><Icon name={soundEnabled ? "sound" : "mute"} /></button>
            <button type="button" className="tp-icon-btn" onClick={() => { setFocusMode((v) => !v); inputRef.current?.focus(); }} aria-pressed={focusMode} title={t("ui.practice.focusHint")} aria-label={t("ui.practice.focus")}><Icon name="focus" /></button>
            <button type="button" className="tp-icon-btn" onClick={() => reset()} title={t("practice.restart")} aria-label={t("practice.restart")}><Icon name="restart" /></button>
          </div>
        </div>

        {/* Live stats */}
        <div className="tp-stats" aria-label={t("practice.sessionStats")}>
          <div className="tp-stat tp-stat-main"><span>{t("practice.wpm")}</span><strong>{stats.wpm}</strong></div>
          <div className="tp-stat"><span>{t("practice.accuracy")}</span><strong className={stats.accuracy < 90 && typedLength > 5 ? "is-low" : undefined}>{stats.accuracy}<small>%</small></strong></div>
          <div className="tp-stat"><span>{t("practice.errors")}</span><strong className={stats.errors ? "is-bad" : undefined}>{stats.errors}</strong></div>
          <div className="tp-stat"><span>{t("ui.practice.timeLeft")}</span><strong className={running && remaining <= 10 ? "is-bad" : undefined}>{clock(remaining)}</strong></div>
          <div className="tp-progress"><div className="tp-progress-label"><span>{drillText ? t("practice.weakKeyDrill") : article?.title ?? ct.passageTitle(lesson)}</span><b>{stats.progress}%</b></div><ProgressBar value={stats.progress} size="sm" label={t("practice.lessonProgress")} /></div>
        </div>

        {/* The text */}
        <div className={`tp-card${paused ? " is-paused" : ""}`}>
          <div className="tp-text-wrap">
            <div className={`tp-prompt ${language === "khmer" ? "khmer-prompt font-khmer" : ""}`} onClick={() => inputRef.current?.focus()} lang={language === "khmer" ? "km" : "en"}>
              {Array.from(target).map((char, index) => {
                const typed = Array.from(normalizedInput)[index];
                const state = typed === undefined ? "pending" : typed === char ? "correct" : "wrong";
                return <span key={`${index}-${char}`} className={`char ${state} ${index === normalizedInput.length ? "cursor" : ""}${char === " " && state === "wrong" ? " space" : ""}`}>{char}</span>;
              })}
            </div>
            <textarea ref={inputRef} value={input} onChange={(event) => handleInput(event.target.value)} onCompositionStart={handleCompositionStart} onCompositionEnd={(event) => handleCompositionEnd(event.currentTarget.value)} onPaste={(event) => event.preventDefault()}
              onKeyDown={(event) => {
                // Tab then Enter restarts, like the hint says. Tab never leaves the text box while it is armed.
                if (event.key === "Tab") { event.preventDefault(); tabArmedRef.current = true; return; }
                if (event.key === "Enter" && tabArmedRef.current) { event.preventDefault(); tabArmedRef.current = false; reset(); return; }
                tabArmedRef.current = false;
              }}
              className="tp-input" aria-label={t("practice.typeTheLessonText")} lang={language === "khmer" ? "km" : "en"} autoCapitalize="off" autoCorrect="off" spellCheck={false} />
            {paused && <button type="button" className="tp-paused" onClick={togglePause}><Icon name="play" size={18} />{t("practice.paused")}</button>}
          </div>
          <div className="tp-card-foot">
            <span className="tp-hint"><kbd>tab</kbd> + <kbd>enter</kbd> {t("practice.restartHint")}</span>
            <div className="tp-foot-actions">
              {!done && <button type="button" onClick={togglePause} disabled={typedLength === 0 && !paused}><Icon name={paused ? "play" : "pause"} size={15} />{t(paused ? "practice.resume" : "practice.pause")}</button>}
              {!done && typedLength > 0 && <button type="button" onClick={() => { setRunning(false); setPaused(false); setForcedDone(true); }}><Icon name="check" size={15} />{t("practice.finish")}</button>}
              <button type="button" onClick={() => reset(nextInList.id)} title={t("practice.upNext")}>{t("ui.practice.next")}: <b>{ct.passageTitle(nextInList)}</b><Icon name="arrow" size={15} /></button>
            </div>
          </div>
          {done && !resultClosed && <GameDialog title={t("practice.lessonCompleteTitle")} icon="🎉" onEscape={() => setResultClosed(true)}>
            <div className="text-center">
            {autoCompleted && <p className="mt-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-extrabold text-emerald-800" role="status">{t("practice.lessonCompleteBadge")}{autoCompleted.xp > 0 ? ` +${autoCompleted.xp} XP` : ""}</p>}
            <dl className="my-4 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">{[["WPM", stats.wpm], [t("practice.accuracy"), `${stats.accuracy}%`], [t("practice.errorsLabel"), stats.errors], [t("practice.timeStat"), t("practice.secondsShort", { n: seconds })]].map(([label, value]) => <div key={String(label)} className="rounded-xl bg-slate-50 p-2.5 ring-1 ring-inset ring-line"><dt className="text-[11px] font-bold text-mute">{label}</dt><dd className="text-2xl font-extrabold tabular-nums text-navy">{value}</dd></div>)}</dl>
            {mistakes.length > 0 && <div className="mb-4 text-left"><p className="mb-2 text-[11px] font-bold uppercase text-mute">{t("practice.mistakes", { n: mistakes.length })}</p><ul className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">{mistakes.map((m) => <li key={m.index} className="rounded-lg bg-red-50 px-2 py-1 text-xs text-red-700">{t("practice.expected")} <b>{m.expected === " " ? t("practice.space") : m.expected}</b>, {t("practice.typed")} <b>{m.typed === " " ? t("practice.space") : m.typed}</b></li>)}</ul></div>}
            <div className="flex flex-wrap justify-center gap-2">
              <button data-autofocus type="button" className={btn("secondary", "sm")} onClick={() => reset()}>{t("practice.retry")}</button>
              <button type="button" className={btn("primary", "sm")} onClick={newArticle}>{t("practice.randomArticle")}</button>
              {nextLesson && <button type="button" className={btn("secondary", "sm")} onClick={() => reset(nextLesson.id)}>{t("practice.nextLesson")}</button>}
              <Link href="/games" className={btn("secondary", "sm")}>{t("practice.playGame")}</Link>
              <button type="button" className={btn("ghost", "sm")} onClick={() => setResultClosed(true)}>{t("practice.close")}</button>
            </div>
            <WeakKeysReport language={language} onDrill={(text) => reset(lessonId, text)} />
            </div>
          </GameDialog>}
        </div>
        {needsKhmerInputSwitch && language === "khmer" && <div className="input-switch-hint" role="alert"><span className="feedback-icon">!</span><span><strong>{t("practice.switchTitle")}</strong><br />{t(platform === "Windows" ? "practice.switchWindows" : platform === "macOS" ? "practice.switchMac" : "practice.switchUnknown")}</span></div>}
        {focusMode
          ? <p className="tp-focus-note"><Icon name="focus" size={15} />{t("ui.practice.focusOn")} <button type="button" onClick={() => setFocusMode(false)}>{t("ui.practice.focusExit")}</button></p>
          : <>
            <VirtualKeyboard language={language} heat={done ? heat : undefined} expected={done || paused ? null : nextCharacter || null} disabled={paused || done} osHint={osFromPlatform(platform)} onChar={handleVirtualChar} onBackspace={handleVirtualBackspace} />
            <p className="tp-tip"><Icon name="sparkle" size={15} /><b>{t("practice.tipTitle")}:</b> {t("practice.tipText")}</p>
          </>}
      </section>
    </main>
  );
}
