"use client";

import Link from "next/link";
import GamesMenu from "@/components/shared/GamesMenu";
import { useEffect, useMemo, useRef, useState } from "react";
import { getTypingStats } from "@/lib/typing-engine";
import { normalizeKhmer } from "@/lib/khmer-unicode";
import { lessons } from "@/data/lessons";
import type { Language, OSPlatform } from "@/types";
import { useLocale } from "@/components/shared/LocaleProvider";
import LocaleToggle from "@/components/shared/LocaleToggle";
import { recordPractice } from "@/lib/local-progress";
import { pickRandomLesson } from "@/lib/lesson-picker";

const keyboardRows = [
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "[", "]"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'"],
  ["⇧", "z", "x", "c", "v", "b", "n", "m", ",", ".", "/", "⇧"],
];

// NiDA key legends, based on the Microsoft Khmer (NIDA) keyboard layout.
const khmerKeyboardRows = [
  ["១", "២", "៣", "៤", "៥", "៦", "៧", "៨", "៩", "០", "ឥ", "ឲ"],
  ["ឆ", "ឹ", "េ", "រ", "ត", "យ", "ុ", "ិ", "ោ", "ផ", "ៀ", "ឪ"],
  ["ា", "ស", "ដ", "ថ", "ង", "ហ", "្", "ក", "ល", "ើ", "់", "ឮ"],
  ["⇧", "z", "ឋ", "ខ", "ច", "វ", "ប", "ន", "ម", "ុំ", "។", "៊", "⇧"],
];
const khmerShiftRows = [
  ["»", "!", "ៗ", "\"", "៛", "%", "៍", "័", "៏", "(", ")", "៌"],
  ["ឈ", "ឺ", "ែ", "ឬ", "ទ", "ួ", "ូ", "ី", "ៅ", "ភ", "ឿ", "ឧ"],
  ["ាំ", "ៃ", "ឌ", "ធ", "អ", "ះ", "ញ", "គ", "ឡ", "ោះ", "៉", "ឭ"],
  ["⇧", "z", "ឍ", "ឃ", "ជ", "េះ", "ព", "ណ", "ំ", "ុះ", "៍", "៕", "⇧"],
];

const macModifierRow = ["fn", "⌃", "⌥", "⌘", "space", "⌘", "⌥", "⌃"];
const windowsModifierRow = ["Ctrl", "⊞", "Alt", "space", "Alt", "⊞", "Ctrl"];
const unknownModifierRow = ["Ctrl", "Alt", "space", "↵"];

type TypingPracticeProps = {
  language: Language;
  platform?: OSPlatform;
  initialLessonId?: string;
  timeLimit?: number;
};

export default function TypingPractice({ language, platform = "Unknown", initialLessonId, timeLimit = 60 }: TypingPracticeProps) {
  const { locale, t } = useLocale();
  const list = lessons[language];
  const [lessonId, setLessonId] = useState(() => list.find((item) => item.id === initialLessonId)?.id ?? list[0].id);
  const [input, setInput] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [paused, setPaused] = useState(false);
  const [forcedDone, setForcedDone] = useState(false);
  const [shifted, setShifted] = useState(false);
  const [pressedKey, setPressedKey] = useState("");
  const [wrongKey, setWrongKey] = useState("");
  const [needsKhmerInputSwitch, setNeedsKhmerInputSwitch] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const keyTimerRef = useRef<number | null>(null);
  const isComposingRef = useRef(false);
  const compositionStartRef = useRef("");
  const lesson = list.find((item) => item.id === lessonId) ?? list[0];
  const lessonLevel = lesson.level === "Beginner" ? t("practice.beginner") : t("practice.intermediate");
  const lessonMinutes = Number.parseInt(lesson.duration, 10) || 1;
  const target = lesson.text;
  const normalizedInput = language === "khmer" ? normalizeKhmer(input) : input;
  const normalizedTarget = language === "khmer" ? normalizeKhmer(target) : target;
  const stats = useMemo(() => getTypingStats(normalizedTarget, normalizedInput, seconds), [normalizedTarget, normalizedInput, seconds]);
  const typedLength = Array.from(normalizedInput).length;
  const done = forcedDone || (!running && !paused && typedLength > 0 && (seconds >= timeLimit || typedLength >= Array.from(normalizedTarget).length));
  const lessonIndex = list.findIndex((item) => item.id === lessonId);
  const nextLesson = list[lessonIndex + 1];
  const nextCharacter = Array.from(normalizedTarget)[Array.from(normalizedInput).length] ?? "";
  const currentKhmerRows = shifted ? khmerShiftRows : khmerKeyboardRows;
  const modifierRow = platform === "macOS" ? macModifierRow : platform === "Windows" ? windowsModifierRow : unknownModifierRow;
  const shownRows = [...(language === "english" ? keyboardRows : currentKhmerRows), modifierRow];
  const platformLabel = platform === "macOS" ? "MacBook" : platform === "Windows" ? "Windows" : "Standard";
  const shiftedHasNext = language === "khmer" && currentKhmerRows.flat().every((item) => !item.includes(nextCharacter)) && (shifted ? khmerKeyboardRows : khmerShiftRows).flat().some((item) => item.includes(nextCharacter));

  useEffect(() => () => {
    if (keyTimerRef.current) window.clearTimeout(keyTimerRef.current);
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
    if (done) recordPractice(language, stats.wpm, stats.accuracy);
    // Save once per finished session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  function reset(nextId = lessonId) {
    setLessonId(nextId);
    setPaused(false);
    setForcedDone(false);
    setInput("");
    setSeconds(0);
    setRunning(false);
    setPressedKey("");
    setWrongKey("");
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
      const wrongCharacter = additions.find((typed, offset) => {
        const targetIndex = previousLength + offset;
        const expected = Array.from(normalizedTarget)[targetIndex];
        return typed !== expected;
      });
      const typed = additions.at(-1) ?? "";
      const typedKey = typed === " " ? "space" : typed.toLowerCase();
      setPressedKey(typedKey);
      setWrongKey(wrongCharacter ? wrongCharacter === " " ? "space" : wrongCharacter.toLowerCase() : "");
      playKeySound(!wrongCharacter);

      if (language === "khmer") {
        const latestCharacter = additions.at(-1) ?? "";
        if (/[a-z]/i.test(latestCharacter)) setNeedsKhmerInputSwitch(true);
        else if (/[\u1780-\u17ff]/u.test(latestCharacter)) setNeedsKhmerInputSwitch(false);
      }
      if (keyTimerRef.current) window.clearTimeout(keyTimerRef.current);
      keyTimerRef.current = window.setTimeout(() => setPressedKey(""), 220);
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

  function handleVirtualKey(key: string) {
    if (key === "⇧") {
      setShifted((value) => !value);
      inputRef.current?.focus();
      return;
    }
    if (key === "⌫" || key === "Backspace") {
      handleInput(Array.from(input).slice(0, -1).join(""));
      inputRef.current?.focus();
      return;
    }
    if (["English (US)", "⌘", "Ctrl", "Alt", "AltGr", "Enter", "fn", "⌃", "⌥", "⊞"].includes(key)) return;
    if (key === "↵") {
      reset();
      return;
    }
    const value = key === "space" ? " " : language === "english" && shifted && /^[a-z]$/i.test(key) ? key.toUpperCase() : key;
    handleInput(`${input}${value}`);
    if (shifted) setShifted(false);
    inputRef.current?.focus();
  }

  function handlePhysicalShift(isDown: boolean) {
    setShifted(isDown);
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
      <header className="topbar">
        <Link className="brand" href="/"><span className="brand-mark">d</span><span>keyflow<span className="brand-dot">.</span></span></Link>
        <nav className="topnav"><Link href="/">{t("nav.overview")}</Link><a className="active" href="#practice">{t("nav.practice")}</a><GamesMenu/><a href="#progress">{t("nav.progress")}</a></nav>
        <LocaleToggle/><div className="user-pill"><span className="avatar">S</span><span>{t("nav.guest")}</span><span className="chevron">⌄</span></div>
      </header>
      <section className="practice-shell" id="practice">
        <div className="practice-grid">
          <section className="practice-main">
            <div className="lesson-bar"><div className="lesson-name"><span className="lesson-icon">✳</span><div><span className="small-label">{t("practice.currentLesson")}</span><strong>{lesson.title}</strong></div></div><select value={lessonId} onChange={(event) => reset(event.target.value)} aria-label={locale === "km" ? "ជ្រើសរើសមេរៀន" : "Choose lesson"}>{list.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></div>
            <div className="typing-card">
              <div className="text-meta"><span>{t("practice.typeBelow")}</span><span>{lessonLevel} <i>·</i> {lessonMinutes} {t("setup.min")}</span></div>
              <div className={`prompt ${language === "khmer" ? "khmer-prompt" : ""}`} onClick={() => inputRef.current?.focus()}>
                {Array.from(target).map((char, index) => {
                  const typed = Array.from(normalizedInput)[index];
                  const state = typed === undefined ? "pending" : typed === char ? "correct" : "wrong";
                  return <span key={`${index}-${char}`} className={`char ${state} ${index === normalizedInput.length ? "cursor" : ""}`}>{char}</span>;
                })}
              </div>
              <textarea ref={inputRef} value={input} onChange={(event) => handleInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Shift") handlePhysicalShift(true); }} onKeyUp={(event) => { if (event.key === "Shift") handlePhysicalShift(false); }} onCompositionStart={handleCompositionStart} onCompositionEnd={(event) => handleCompositionEnd(event.currentTarget.value)} onPaste={(event) => event.preventDefault()} className="typing-input" aria-label={locale === "km" ? "វាយអត្ថបទមេរៀន" : "Type the lesson text"} lang={language === "khmer" ? "km" : "en"} autoCapitalize="off" autoCorrect="off" spellCheck={false} />
              {paused && <p className="mx-auto my-2 w-fit rounded-lg bg-blue-50 px-4 py-2 text-sm font-semibold text-brand" role="status">⏸ Paused — press Resume to continue.</p>}
              {done && <div className="mx-auto my-4 max-w-xl rounded-2xl border border-blue-100 bg-white p-5 text-center shadow-sm" role="status" aria-live="polite">
                <h2 className="text-xl font-extrabold text-navy">🎉 Lesson complete</h2>
                <dl className="my-4 grid grid-cols-4 gap-2 text-center">{[["WPM", stats.wpm], ["Accuracy", `${stats.accuracy}%`], ["Errors", stats.errors], ["Time", `${seconds}s`]].map(([label, value]) => <div key={String(label)} className="rounded-xl bg-slate-50 p-2"><dt className="text-[10px] font-bold uppercase text-mute">{label}</dt><dd className="text-xl font-extrabold text-navy">{value}</dd></div>)}</dl>
                <div className="flex flex-wrap justify-center gap-2">
                  <button type="button" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-navy" onClick={() => reset()}>↻ Retry</button>
                  <button type="button" className="rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white" onClick={() => reset(pickRandomLesson(language, lessonId).id)}>🎲 Random article</button>
                  {nextLesson && <button type="button" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-navy" onClick={() => reset(nextLesson.id)}>Next lesson →</button>}
                  <Link href="/games" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-navy">🎮 Play a game</Link>
                </div>
              </div>}
              <div className="typing-footer"><span><kbd>tab</kbd> + <kbd>enter</kbd> {t("practice.restartHint")}</span><div className="typing-actions"><button className={`sound-toggle ${soundEnabled ? "sound-on" : ""}`} onClick={() => setSoundEnabled((enabled) => !enabled)} aria-pressed={soundEnabled} title={soundEnabled ? t("practice.mute") : t("practice.enableSound")}>{soundEnabled ? "◖))" : "◖×"}<span>{t(soundEnabled ? "practice.soundOn" : "practice.soundOff")}</span></button>{!done && <button className="restart-button" onClick={() => { if (paused) { setPaused(false); if (typedLength > 0) setRunning(true); inputRef.current?.focus(); } else { setPaused(true); setRunning(false); } }} disabled={typedLength === 0 && !paused}>{paused ? "▶ Resume" : "⏸ Pause"}</button>}{!done && typedLength > 0 && <button className="restart-button" onClick={() => { setRunning(false); setPaused(false); setForcedDone(true); }}>🏁 Finish</button>}<button className="restart-button" onClick={() => reset()}>↻ <span>{t("practice.restart")}</span></button></div></div>
            </div>
            <div className={`keyboard-card ${language === "khmer" ? "khmer-keyboard-card" : ""}`}><div className="keyboard-topline"><span>{t("practice.keyboard")}</span><span className="layout-chip">{language === "english" ? `${platformLabel} · QWERTY` : `NiDA · ${platformLabel}${shifted ? " · SHIFT" : ""}`}</span></div>{needsKhmerInputSwitch && language === "khmer" && <div className="input-switch-hint" role="alert"><span className="feedback-icon">!</span><span><strong>{t("practice.switchTitle")}</strong><br />{t(platform === "Windows" ? "practice.switchWindows" : platform === "macOS" ? "practice.switchMac" : "practice.switchUnknown")}</span></div>}{wrongKey && <div className="key-feedback" role="alert"><span className="feedback-icon">!</span><span>{t("practice.wrong")}</span></div>}<div className="keyboard">{shownRows.map((row, rowIndex) => <div className={`key-row row-${rowIndex}`} key={rowIndex}>{row.map((key, keyIndex) => {
              const normalizedKey = key === "space" ? "space" : key.toLowerCase();
              const targetKey = nextCharacter === " " ? "space" : language === "khmer" ? nextCharacter : nextCharacter.toLowerCase();
              const isPressed = pressedKey === normalizedKey;
              const isWrong = language === "khmer" ? normalizedKey.includes(wrongKey) && wrongKey !== "" : wrongKey === normalizedKey;
              const isNext = language === "khmer" ? (key === "⇧" && shiftedHasNext) || normalizedKey.includes(targetKey) : normalizedKey === targetKey;
              const isDisabled = ["English (US)", "⌘", "Ctrl", "Alt", "AltGr", "Enter", "fn", "⌃", "⌥", "⊞"].includes(key);
              return <button type="button" key={`${rowIndex}-${keyIndex}-${key}`} onMouseDown={(event) => event.preventDefault()} onClick={() => handleVirtualKey(key)} disabled={isDisabled} className={`key ${key === "space" ? "space-key" : ""} ${key.length > 1 && key !== "space" ? "special-key" : ""} ${isNext ? "next-key" : ""} ${isPressed ? "pressed-key" : ""} ${isWrong ? "wrong-key" : ""}`} aria-label={key === "space" ? t("practice.keyboardSpace") : key === "↵" ? t("practice.restart") : locale === "km" ? `វាយ ${key}` : `Type ${key}`}>{key === "space" ? "space" : key}</button>;
            })}</div>)}</div>{language === "khmer" && <p className="keyboard-note">{t("practice.khmerKeyboardHint")}</p>}</div>
          </section>
          <aside className="stats-column"><div className="stats-card"><div className="stats-title"><span>{t("practice.sessionStats")}</span><span className="info">i</span></div><div className="wpm-stat"><strong>{stats.wpm}</strong><span>{t("practice.wpm")}</span></div><div className="stat-divider"/><div className="mini-stat"><span>{t("practice.accuracy")}</span><strong>{stats.accuracy}<small>%</small></strong></div><div className="mini-stat"><span>{t("practice.errors")}</span><strong>{stats.errors.toString().padStart(2, "0")}</strong></div><div className="mini-stat"><span>{t("practice.time")}</span><strong>{Math.floor(seconds / 60).toString().padStart(2, "0")}:{(seconds % 60).toString().padStart(2, "0")}</strong></div><div className="progress-label"><span>{t("practice.lessonProgress")}</span><strong>{stats.progress}%</strong></div><div className="progress-track"><span style={{ width: `${stats.progress}%` }}/></div></div><div className="tip-card"><span className="tip-icon">✦</span><div><strong>{t("practice.tipTitle")}</strong><p>{t("practice.tipText")}</p></div></div><div className="next-lesson"><span className="small-label">{t("practice.upNext")}</span><strong>{list[(list.findIndex((item) => item.id === lessonId) + 1) % list.length].title}</strong><button onClick={() => reset(list[(list.findIndex((item) => item.id === lessonId) + 1) % list.length].id)}>{t("practice.preview")} <span>→</span></button></div></aside>
        </div>
        <footer className="practice-footer" id="progress"><span>{t("common.footer")} <span className="footer-heart">♥</span></span><span>{t("practice.guestFooter")}</span></footer>
      </section>
    </main>
  );
}
