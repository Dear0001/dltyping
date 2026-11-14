"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { getCharStates, normalizeText } from "@/lib/typing-engine";
import { codepoints } from "@/lib/khmer-unicode";
import { lessons } from "@/data/lessons";
import type { Language, OSPlatform } from "@/types";
import { useLocale } from "@/components/shared/LocaleProvider";
import { useCurriculumText } from "@/hooks/useCurriculumText";
import { completeLesson, readPracticeBest, readUserProgress, recordPractice, writeRaw } from "@/lib/local-progress";
import { curricula, findLesson } from "@/data/curriculum";
import { pickArticle } from "@/lib/lesson-picker";
import { DURATIONS, MAX_DURATION, articleFromIds, averageWpm, isPlainLesson, minutesToDuration, targetWords, typingWords, type Article } from "@/lib/article-length";
import { readStore } from "@/lib/progress/progress-storage";
import VirtualKeyboard from "@/components/keyboard/VirtualKeyboard";
import { osFromPlatform } from "@/lib/keyboard/keyboard-detection";
import PracticeResults, { type PracticeResult } from "@/components/typing/PracticeResults";
import { useKeyStatBook } from "@/hooks/useKeyStatBook";
import { flushSession, recordKeystrokes, weakKeys, type KeyStats } from "@/lib/keyboard/key-stats";
import { findKeyFor } from "@/lib/keyboard/keyboard-mapping";
import { describeGuidance, guidanceFor } from "@/lib/keyboard/typing-guidance";
import { colorOfFinger } from "@/lib/keyboard/finger-mapping";
import { useActivityRecorder } from "@/hooks/useActivityRecorder";
import { useAutoPause, useTicker } from "@/hooks/use-ticker";
import { useStoredValue } from "@/hooks/use-stored-value";
import { practiceHistory, practiceOutcome } from "@/lib/practice-results";
import { Icon, ProgressBar, cx } from "@/components/ui/ui";

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

/** Whether the on-screen keyboard is shown under the text (a per-device preference). */
const KEYBOARD_KEY = "dlt.practice.keyboard";
const validateBool = (v: unknown) => (typeof v === "boolean" ? v : null);

const countMatches = (typed: readonly string[], goal: readonly string[]) => typed.reduce((n, cp, i) => (cp === goal[i] ? n + 1 : n), 0);
const wpmFor = (correct: number, ms: number) => Math.round(correct / 5 / (Math.max(ms, 1000) / 60000));

export default function TypingPractice({ language, platform = "Unknown", initialLessonId, timeLimit: initialTimeLimit = 60, initialDrill = null, initialArticle = null }: TypingPracticeProps) {
  const { t, locale } = useLocale();
  const ct = useCurriculumText();
  const list = lessons[language];
  const [lessonId, setLessonId] = useState(() => list.find((item) => item.id === initialLessonId)?.id ?? list[0].id);
  const [timeLimit, setTimeLimit] = useState(initialTimeLimit);
  const [customMinutes, setCustomMinutes] = useState("");
  const [input, setInput] = useState("");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [running, setRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [paused, setPaused] = useState(false);
  const [forcedDone, setForcedDone] = useState(false);
  const [resultClosed, setResultClosed] = useState(false);
  const [drillText, setDrillText] = useState<string | null>(initialDrill);
  const [article, setArticle] = useState<Pick<Article, "title" | "text" | "ids"> | null>(initialArticle);
  const [needsKhmerInputSwitch, setNeedsKhmerInputSwitch] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [focused, setFocused] = useState(false);
  /** Every keystroke judged against the text, including ones later fixed with backspace. */
  const [keys, setKeys] = useState({ total: 0, wrong: 0 });
  const [result, setResult] = useState<PracticeResult | null>(null);
  const showKeyboard = useStoredValue(KEYBOARD_KEY, true, validateBool);
  const tabArmedRef = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const promptRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const isComposingRef = useRef(false);
  const sessionStatsRef = useRef<KeyStats>({});
  const lastKeyAtRef = useRef<number | null>(null);
  const compositionStartRef = useRef("");
  const elapsedRef = useRef(0);
  const lesson = list.find((item) => item.id === lessonId) ?? list[0];
  const lessonLevel = lesson.level === "Beginner" ? t("practice.beginner") : t("practice.intermediate");
  const target = drillText ?? article?.text ?? lesson.text;
  const keyBook = useKeyStatBook();
  const recorder = useActivityRecorder();

  // Text is compared as normalized code points; it is drawn per grapheme cluster, so a Khmer syllable stays one shaped unit.
  const goal = useMemo(() => codepoints(normalizeText(target, language)), [target, language]);
  const typed = useMemo(() => codepoints(normalizeText(input, language)), [input, language]);
  const views = useMemo(() => getCharStates(target, typed, language), [target, typed, language]);
  const correctNow = useMemo(() => countMatches(typed, goal), [typed, goal]);
  const typedLength = typed.length;
  const wpm = wpmFor(correctNow, elapsedMs);
  const accuracy = keys.total ? Math.round(((keys.total - keys.wrong) / keys.total) * 100) : 100;
  const progress = goal.length ? Math.min(100, Math.round((typedLength / goal.length) * 100)) : 0;
  const timeUp = elapsedMs >= timeLimit * 1000;
  const finishedPassage = goal.length > 0 && typedLength >= goal.length;
  const done = forcedDone || (!paused && typedLength > 0 && (timeUp || finishedPassage));
  const live = running && !paused;

  const heat: Record<string, number> = {};
  if (done) for (const k of weakKeys(keyBook[language])) {
    const code = findKeyFor(language, k.char)?.code;
    if (code) heat[code] = Math.max(heat[code] ?? 0, Math.min(1, 0.35 + k.score / 80));
  }
  const lessonIndex = list.findIndex((item) => item.id === lessonId);
  const nextLesson = list[lessonIndex + 1];
  const nextCharacter = goal[typedLength] ?? "";
  // Next key + finger, shown under the text so guidance stays visible even with the keyboard hidden.
  const nextGuide = useMemo(() => guidanceFor(language, nextCharacter || null), [language, nextCharacter]);
  const cursorIndex = views.findIndex((v) => v.state === "current" || v.state === "partial");

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

  // The clock runs from the first keystroke and stops on pause, so WPM uses real typing time.
  useTicker(live && !done, (delta) => {
    elapsedRef.current = Math.min(timeLimit * 1000, elapsedRef.current + delta);
    setElapsedMs(elapsedRef.current);
    if (elapsedRef.current >= timeLimit * 1000) setRunning(false);
  });
  // Leaving the tab pauses the session instead of letting the clock run.
  useAutoPause(live && !done, () => { setPaused(true); setRunning(false); });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Keep the current line in view: the text box scrolls as the cursor moves down.
  useEffect(() => {
    const box = promptRef.current, cursor = cursorRef.current;
    if (!box || !cursor) return;
    const top = cursor.offsetTop - box.offsetTop;
    if (top < box.scrollTop || top > box.scrollTop + box.clientHeight - cursor.offsetHeight * 2) box.scrollTop = Math.max(0, top - cursor.offsetHeight);
  }, [typedLength]);

  // Focus mode hides the site header, footer and pet so only the text is left (html[data-focus] in design-system.css).
  useEffect(() => {
    const root = document.documentElement;
    if (focusMode) root.setAttribute("data-focus", "");
    else root.removeAttribute("data-focus");
    return () => root.removeAttribute("data-focus");
  }, [focusMode]);

  // Save exactly once per finished session: rewards, history and the results snapshot.
  useEffect(() => {
    if (!done) return;
    flushSession(language, sessionStatsRef.current);
    sessionStatsRef.current = {};
    const durationMs = Math.max(elapsedRef.current, 1000);
    const finalWpm = wpmFor(correctNow, durationMs);
    const store = readStore();
    const previousBest = readPracticeBest(language);
    const history = practiceHistory(store.sessions, language, drillText ? undefined : previousBest, Date.now());
    // Drills use made-up text, so they would skew the lesson WPM records.
    if (!drillText) recordPractice(language, finalWpm, accuracy);
    recorder.wordsFromText(language, goal.join(""), typed.join(""));
    // A curriculum lesson completes by itself once the whole passage is typed within its limits.
    const curriculumLesson = drillText || article ? undefined : findLesson(curricula[language], lessonId);
    const rule = curriculumLesson?.completionCriteria;
    const lessonMet = !!rule && finishedPassage && accuracy >= rule.minAccuracy && finalWpm >= (rule.minWpm ?? 0);
    const xpReward = curriculumLesson?.xpReward ?? 50;
    const wasDone = !!readUserProgress().completedLessons[`${language}:${lessonId}`];
    recorder.finish({
      lessonDone: lessonMet,
      // Dashboard record: running out the clock is a typing test, finishing the passage is a lesson.
      activity: drillText ? "drill" : timeUp && !finishedPassage ? "typing-test" : "lesson",
      language,
      durationSec: durationMs / 1000,
      correct: correctNow,
      incorrect: keys.wrong,
      wpm: finalWpm,
      accuracy,
      difficulty: lesson.level === "Beginner" ? "easy" : "medium",
      detail: drillText ? "Weak-key drill" : article?.title ?? lesson.title,
    });
    // completeLesson never awards a lesson's XP twice.
    if (lessonMet) completeLesson(language, lessonId, xpReward);
    const outcome = practiceOutcome({ wpm: finalWpm, accuracy, correct: correctNow, lessonDone: lessonMet && !wasDone, comparable: !drillText }, history);
    setResult({
      language,
      title: drillText ? t("practice.weakKeyDrill") : article?.title ?? ct.passageTitle(lesson),
      wpm: finalWpm,
      accuracy,
      correct: correctNow,
      wrongKeys: keys.wrong,
      keystrokes: keys.total,
      uncorrected: typedLength - correctNow,
      durationSec: Math.round(durationMs / 1000),
      xp: !rule ? { kind: "none", amount: 0 } : lessonMet ? (wasDone ? { kind: "repeat", amount: 0 } : { kind: "lesson", amount: xpReward }) : { kind: "missed", amount: xpReward, minAccuracy: rule.minAccuracy, minWpm: rule.minWpm },
      outcome,
      best: history.best,
      mistakes: typed.flatMap((cp, index) => (goal[index] !== undefined && cp !== goal[index] ? [{ index, expected: goal[index], typed: cp }] : [])),
    });
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
      const goalWords = targetWords(averageWpm(readStore(), language), nextSeconds);
      const sameLesson = typingWords(lesson.text) >= goalWords * 0.8 ? articleFromIds(language, lessonId, goalWords) : null;
      const built = sameLesson ?? pickArticle(language, nextSeconds).article;
      next = isPlainLesson(built) ? null : built;
      nextId = built.ids[0];
      try { window.history.replaceState(null, "", `/learn/${language}?lesson=${encodeURIComponent(built.ids.join(","))}&goal=${goalWords}&time=${nextSeconds}`); } catch {}
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
    elapsedRef.current = 0;
    setDrillText(drill !== undefined ? drill : nextId === lessonId ? drillText : null);
    setArticle(nextArticle !== undefined ? nextArticle : nextId === lessonId ? article : null);
    setLessonId(nextId);
    setPaused(false);
    setForcedDone(false);
    setResult(null);
    setResultClosed(false);
    setInput("");
    setElapsedMs(0);
    setKeys({ total: 0, wrong: 0 });
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

    const nextInput = Array.from(value).slice(0, goal.length).join("");
    const nextChars = codepoints(normalizeText(nextInput, language));
    const previousLength = codepoints(normalizeText(previousValue, language)).length;
    if (!running && nextChars.length) setRunning(true);

    if (nextChars.length > previousLength) {
      const judged: [string, boolean][] = [];
      nextChars.slice(previousLength).forEach((cp, offset) => {
        const expected = goal[previousLength + offset];
        if (!expected) return;
        const ok = cp === expected;
        judged.push([expected, ok]);
        recorder.keystroke(language, expected, ok);
      });
      recordKeystrokes(sessionStatsRef.current, lastKeyAtRef, judged);
      const wrong = judged.filter(([, ok]) => !ok).length;
      if (judged.length) setKeys((k) => ({ total: k.total + judged.length, wrong: k.wrong + wrong }));
      playKeySound(wrong === 0);

      if (language === "khmer") {
        const latestCharacter = nextChars.at(-1) ?? "";
        if (/[a-z]/i.test(latestCharacter)) setNeedsKhmerInputSwitch(true);
        else if (/[ក-៿]/u.test(latestCharacter)) setNeedsKhmerInputSwitch(false);
      }
    }

    setInput(nextInput);
    if (nextChars.length >= goal.length) setRunning(false);
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
  const remaining = Math.max(0, Math.ceil(timeLimit - elapsedMs / 1000));
  const clock = (n: number) => `${Math.floor(n / 60)}:${(n % 60).toString().padStart(2, "0")}`;
  const togglePause = () => {
    if (paused) { setPaused(false); if (typedLength > 0) setRunning(true); inputRef.current?.focus(); }
    else { setPaused(true); setRunning(false); }
  };
  const toggleKeyboard = () => writeRaw(KEYBOARD_KEY, JSON.stringify(!showKeyboard));
  const durationLabel = customMinutes ? `${customMinutes}${t("ui.practice.minShort")}` : `${timeLimit / 60}${t("ui.practice.minShort")}`;

  return (
    <main className="practice-page tp" data-focus={focusMode || undefined}>
      <section className="tp-shell" id="practice">
        {/* Session settings: lesson, length and actions in one compact bar. While typing it shrinks to a summary. */}
        <div className={cx("tp-toolbar", live && "is-live")}>
          <nav className="tp-lang" aria-label={t("results.language")}>
            <Link href="/learn/english" aria-current={language === "english" ? "page" : undefined}>EN</Link>
            <Link href="/learn/khmer" aria-current={language === "khmer" ? "page" : undefined} className="font-khmer">ខ្មែរ</Link>
          </nav>
          <label className="tp-lesson">
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
            <button type="button" className="tp-shuffle" disabled={running} onClick={newArticle} title={t("practice.randomArticle")} aria-label={t("practice.randomArticle")}><Icon name="sparkle" size={15} /><span>{t("results.newText")}</span></button>
          </div>
          <span className="tp-live-chip" aria-hidden={!live}><Icon name="clock" size={14} />{durationLabel}</span>
          <div className="tp-actions">
            <button type="button" className="tp-icon-btn" onClick={() => setSoundEnabled((enabled) => !enabled)} aria-pressed={soundEnabled} title={soundEnabled ? t("practice.mute") : t("practice.enableSound")} aria-label={t(soundEnabled ? "practice.soundOn" : "practice.soundOff")}><Icon name={soundEnabled ? "sound" : "mute"} /></button>
            <button type="button" className="tp-icon-btn" onClick={() => { toggleKeyboard(); inputRef.current?.focus(); }} aria-pressed={showKeyboard} title={t(showKeyboard ? "results.hideKeyboard" : "results.showKeyboard")} aria-label={t("results.keyboardToggle")}><Icon name="keyboard" /></button>
            <button type="button" className="tp-icon-btn" onClick={() => { setFocusMode((v) => !v); inputRef.current?.focus(); }} aria-pressed={focusMode} title={t("ui.practice.focusHint")} aria-label={t("ui.practice.focus")}><Icon name="focus" /></button>
            <button type="button" className="tp-icon-btn" onClick={() => reset()} title={t("practice.restart")} aria-label={t("practice.restart")}><Icon name="restart" /></button>
          </div>
        </div>

        {/* Live stats */}
        <div className="tp-stats" aria-label={t("practice.sessionStats")}>
          <div className="tp-stat tp-stat-main"><span>{t("practice.wpm")}</span><strong>{wpm}</strong></div>
          <div className="tp-stat"><span>{t("practice.accuracy")}</span><strong className={accuracy < 90 && keys.total > 5 ? "is-low" : undefined}>{accuracy}<small>%</small></strong></div>
          <div className="tp-stat"><span>{t("practice.errors")}</span><strong className={keys.wrong ? "is-bad" : undefined}>{keys.wrong}</strong></div>
          <div className="tp-stat"><span>{t("ui.practice.timeLeft")}</span><strong className={running && remaining <= 10 ? "is-bad" : undefined}>{clock(remaining)}</strong></div>
          <div className="tp-progress"><div className="tp-progress-label"><span>{drillText ? t("practice.weakKeyDrill") : article?.title ?? ct.passageTitle(lesson)}</span><b>{progress}%</b></div><ProgressBar value={progress} size="sm" label={t("practice.lessonProgress")} /></div>
        </div>

        {/* The text */}
        <div className={cx("tp-card", paused && "is-paused")}>
          <div className="tp-text-wrap">
            <div ref={promptRef} className={cx("tp-prompt", language === "khmer" && "khmer-prompt font-khmer")} onClick={() => inputRef.current?.focus()} lang={language === "khmer" ? "km" : "en"}>
              {views.map((v, index) => {
                const isCursor = index === cursorIndex;
                return <span key={index} ref={isCursor ? cursorRef : undefined} className={cx("char", v.state === "current" ? "pending" : v.state, isCursor && "cursor", v.text === " " && v.state === "wrong" && "space")}>{v.text}</span>;
              })}
            </div>
            <textarea ref={inputRef} value={input} onChange={(event) => handleInput(event.target.value)} onCompositionStart={handleCompositionStart} onCompositionEnd={(event) => handleCompositionEnd(event.currentTarget.value)} onPaste={(event) => event.preventDefault()} onDrop={(event) => event.preventDefault()}
              onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
              onKeyDown={(event) => {
                // Tab then Enter restarts, like the hint says. Tab never leaves the text box while it is armed.
                if (event.key === "Tab") { event.preventDefault(); tabArmedRef.current = true; return; }
                if (event.key === "Enter" && tabArmedRef.current) { event.preventDefault(); tabArmedRef.current = false; reset(); return; }
                if (event.key === "Escape" && !done && (typedLength > 0 || paused)) { event.preventDefault(); togglePause(); return; }
                tabArmedRef.current = false;
              }}
              className="tp-input" aria-label={t("practice.typeTheLessonText")} lang={language === "khmer" ? "km" : "en"} autoCapitalize="off" autoCorrect="off" autoComplete="off" spellCheck={false} />
            {paused && <button type="button" className="tp-paused" onClick={togglePause}><Icon name="play" size={18} />{t("practice.paused")}</button>}
            {!paused && !focused && !done && <button type="button" className="tp-unfocused" onClick={() => inputRef.current?.focus()}><Icon name="keyboard" size={18} />{t(typedLength ? "results.clickToContinue" : "results.clickToStart")}</button>}
          </div>
          <div className="tp-card-foot">
            {nextGuide && !done && !paused
              ? <span className="tp-next" style={{ "--finger": colorOfFinger(nextGuide.finger) } as React.CSSProperties}>
                  <i aria-hidden="true" />{t("practice.nextKey")} <kbd>{nextGuide.shift ? "Shift + " : ""}{nextGuide.keyName}</kbd><span className="tp-next-finger">{describeGuidance(nextGuide, locale === "km" ? "km" : "en", "short").split(" · ").slice(1).join(" · ")}</span>
                </span>
              : null}
            <span className="tp-hint"><kbd>tab</kbd> + <kbd>enter</kbd> {t("practice.restartHint")} · <kbd>esc</kbd> {t("practice.pause")}</span>
            <div className="tp-foot-actions">
              {!done && <button type="button" onClick={togglePause} disabled={typedLength === 0 && !paused}><Icon name={paused ? "play" : "pause"} size={15} />{t(paused ? "practice.resume" : "practice.pause")}</button>}
              {!done && typedLength > 0 && <button type="button" onClick={() => { setRunning(false); setPaused(false); setForcedDone(true); }}><Icon name="check" size={15} />{t("practice.finish")}</button>}
              {done && resultClosed && <button type="button" onClick={() => setResultClosed(false)}><Icon name="trophy" size={15} />{t("results.showResults")}</button>}
              <button type="button" onClick={() => reset(nextInList.id)} title={t("practice.upNext")}>{t("ui.practice.next")}: <b>{ct.passageTitle(nextInList)}</b><Icon name="arrow" size={15} /></button>
            </div>
          </div>
          {done && result && !resultClosed && (
            <PracticeResults
              result={result}
              hasNextLesson={!!nextLesson}
              onRetry={() => reset()}
              onNextLesson={() => reset(nextLesson.id)}
              onNewText={newArticle}
              onDrill={(text) => reset(lessonId, text)}
              onClose={() => { setResultClosed(true); }}
            />
          )}
        </div>
        {needsKhmerInputSwitch && language === "khmer" && <div className="input-switch-hint" role="alert"><span className="feedback-icon">!</span><span><strong>{t("practice.switchTitle")}</strong><br />{t(platform === "Windows" ? "practice.switchWindows" : platform === "macOS" ? "practice.switchMac" : "practice.switchUnknown")}</span></div>}
        {focusMode
          ? <p className="tp-focus-note"><Icon name="focus" size={15} />{t("ui.practice.focusOn")} <button type="button" onClick={() => setFocusMode(false)}>{t("ui.practice.focusExit")}</button></p>
          : showKeyboard
            ? <>
              <VirtualKeyboard language={language} heat={done ? heat : undefined} expected={done || paused ? null : nextCharacter || null} disabled={paused || done} osHint={osFromPlatform(platform)} onChar={handleVirtualChar} onBackspace={handleVirtualBackspace} />
              <p className="tp-tip"><Icon name="sparkle" size={15} /><b>{t("practice.tipTitle")}:</b> {t("practice.tipText")}</p>
            </>
            : <p className="tp-focus-note"><Icon name="keyboard" size={15} />{t("results.keyboardHidden")} <button type="button" onClick={toggleKeyboard}>{t("results.showKeyboard")}</button></p>}
      </section>
    </main>
  );
}
