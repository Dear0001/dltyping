"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import VirtualKeyboard from "@/components/keyboard/VirtualKeyboard";
import { useLocale } from "@/components/shared/LocaleProvider";
import { useActivityRecorder } from "@/hooks/useActivityRecorder";
import { useTicker } from "@/hooks/use-ticker";
import type { Difficulty } from "@/lib/game-engine";
import { codepoints } from "@/lib/khmer-unicode";
import { flushSession, recordKeystrokes, type KeyStats } from "@/lib/keyboard/key-stats";
import { calcAccuracy, calcWpm, getCharStates, normalizeText } from "@/lib/typing-engine";
import type { RunResult, RunSample } from "@/lib/typing-test";
import type { Language } from "@/types";

type Props = {
  language: Language;
  text: string;
  durationSec: number;
  /** Label saved with the dashboard session, e.g. "60s test" or "Daily · Speed Sprint". */
  detail: string;
  difficulty?: Difficulty | null;
  onFinish: (result: RunResult) => void;
  keyboard?: boolean;
};

const countMatches = (typed: readonly string[], goal: readonly string[]) => typed.reduce((n, cp, i) => (cp === goal[i] ? n + 1 : n), 0);

/**
 * A timed typing run over a fixed text: the clock starts on the first keystroke and
 * the run ends when time is up or the text is finished. Shared by /test and /daily.
 * Records the session (activity "typing-test") and per-key speed/accuracy like practice does.
 * Remount it (change `key`) to start over.
 */
export default function TypingRun({ language, text, durationSec, detail, difficulty = null, onFinish, keyboard = true }: Props) {
  const { locale } = useLocale();
  const km = locale === "km";
  const [input, setInput] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [focused, setFocused] = useState(false);
  /** Every keystroke judged, including ones later corrected with backspace. */
  const [keyCount, setKeyCount] = useState({ total: 0, correct: 0 });
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const promptRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const composingRef = useRef(false);
  const compositionStartRef = useRef("");
  const keyStatsRef = useRef<KeyStats>({});
  const lastKeyAtRef = useRef<number | null>(null);
  const keysRef = useRef({ total: 0, correct: 0 });
  const samplesRef = useRef<RunSample[]>([]);
  const elapsedRef = useRef(0);
  const finishedRef = useRef(false);
  const recorder = useActivityRecorder();

  const goal = useMemo(() => codepoints(normalizeText(text, language)), [text, language]);
  const typed = useMemo(() => codepoints(normalizeText(input, language)), [input, language]);
  const typedRef = useRef(typed);
  useEffect(() => {
    typedRef.current = typed;
  });
  const views = useMemo(() => getCharStates(text, typed, language), [text, typed, language]);
  const correctNow = useMemo(() => countMatches(typed, goal), [typed, goal]);
  const liveWpm = calcWpm(correctNow, elapsed);
  const liveAccuracy = calcAccuracy(keyCount.correct, keyCount.total);
  const remaining = Math.max(0, Math.ceil(durationSec - elapsed / 1000));

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Keep the current line in view: the prompt shows three lines and scrolls as you type.
  useEffect(() => {
    const box = promptRef.current, cursor = cursorRef.current;
    if (!box || !cursor) return;
    box.scrollTop = Math.max(0, cursor.offsetTop - cursor.offsetHeight * 1.2);
  }, [typed.length]);

  // Unsaved key stats are kept when the learner leaves mid-run (the recorder does the same for its tally).
  useEffect(() => () => {
    flushSession(language, keyStatsRef.current);
    keyStatsRef.current = {};
  }, [language]);

  function sample(second: number, current: readonly string[]): RunSample {
    const ms = second * 1000;
    return { second, wpm: calcWpm(countMatches(current, goal), ms), raw: calcWpm(current.length, ms), errors: keysRef.current.total - keysRef.current.correct, chars: current.length };
  }

  function finish(ms: number, current: readonly string[]) {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setRunning(false);
    setFinished(true);
    const seconds = Math.max(1, Math.round(ms / 100) / 10);
    const last = samplesRef.current.at(-1);
    if (!last || seconds - last.second >= 0.3) samplesRef.current.push(sample(seconds, current));
    const correct = countMatches(current, goal);
    const keys = keysRef.current;
    const result: RunResult = {
      language,
      durationSec: Math.round(seconds),
      wpm: calcWpm(correct, ms),
      rawWpm: calcWpm(current.length, ms),
      accuracy: calcAccuracy(keys.correct, keys.total),
      correct,
      errors: keys.total - keys.correct,
      samples: samplesRef.current,
    };
    flushSession(language, keyStatsRef.current);
    keyStatsRef.current = {};
    recorder.wordsFromText(language, goal.join(""), current.join(""));
    recorder.finish({ activity: "typing-test", language, durationSec: result.durationSec, correct, incorrect: result.errors, wpm: result.wpm, accuracy: result.accuracy, difficulty, detail });
    onFinish(result);
  }

  useTicker(running && !finished, (delta) => {
    const before = Math.floor(elapsedRef.current / 1000);
    elapsedRef.current = Math.min(durationSec * 1000, elapsedRef.current + delta);
    const now = Math.floor(elapsedRef.current / 1000);
    for (let s = before + 1; s <= now; s++) samplesRef.current.push(sample(s, typedRef.current));
    setElapsed(elapsedRef.current);
    if (elapsedRef.current >= durationSec * 1000) finish(elapsedRef.current, typedRef.current);
  });

  function handleInput(value: string, previousValue = input) {
    if (finishedRef.current) return;
    if (composingRef.current) {
      setInput(value);
      if (!running && value.length) setRunning(true);
      return;
    }
    const next = Array.from(value).slice(0, goal.length).join("");
    const nextCps = codepoints(normalizeText(next, language));
    const prevLength = codepoints(normalizeText(previousValue, language)).length;
    if (!running && nextCps.length) setRunning(true);
    if (nextCps.length > prevLength) {
      const samples: [string, boolean][] = [];
      nextCps.slice(prevLength).forEach((cp, offset) => {
        const expected = goal[prevLength + offset];
        if (!expected) return;
        const ok = cp === expected;
        keysRef.current.total += 1;
        if (ok) keysRef.current.correct += 1;
        samples.push([expected, ok]);
        recorder.keystroke(language, expected, ok);
      });
      recordKeystrokes(keyStatsRef.current, lastKeyAtRef, samples);
      setKeyCount({ ...keysRef.current });
    }
    setInput(next);
    if (nextCps.length >= goal.length) finish(Math.max(elapsedRef.current, 1000), nextCps);
  }

  const nextChar = finished ? null : goal[typed.length] ?? null;
  const cursorIndex = views.findIndex((v) => v.state === "current" || v.state === "partial");

  return (
    <div>
      <div className="mb-3 flex items-end justify-between gap-4" aria-live="off">
        <div className="text-4xl font-extrabold tabular-nums text-brand" aria-label={km ? "ពេលនៅសល់" : "Time left"}>{remaining}<span className="ml-1 text-base font-bold text-mute">s</span></div>
        <dl className="flex gap-5 text-right">
          <div><dt className="text-[10px] font-bold uppercase tracking-wider text-mute">WPM</dt><dd className="text-2xl font-extrabold tabular-nums text-navy">{liveWpm}</dd></div>
          <div><dt className="text-[10px] font-bold uppercase tracking-wider text-mute">{km ? "ភាពត្រឹមត្រូវ" : "Accuracy"}</dt><dd className="text-2xl font-extrabold tabular-nums text-navy">{liveAccuracy}%</dd></div>
        </dl>
      </div>

      <div className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div ref={promptRef} className={`relative max-h-[7.5em] overflow-hidden whitespace-pre-wrap break-words select-none ${language === "khmer" ? "font-khmer text-2xl leading-[2.5]" : "text-2xl leading-[2.5] tracking-wide"}`} style={{ scrollBehavior: "smooth" }}>
          {views.map((v, i) => {
            const cls = v.state === "correct" ? "text-navy" : v.state === "wrong" ? "rounded-sm bg-red-100 text-red-600" : v.state === "partial" ? "text-brand underline decoration-2 underline-offset-4" : "text-slate-400";
            const isCursor = i === cursorIndex;
            return <span key={i} ref={isCursor ? cursorRef : undefined} className={`${cls} ${isCursor && focused ? "relative before:absolute before:-left-px before:top-[20%] before:h-[60%] before:w-0.5 before:animate-pulse before:bg-brand" : ""}`}>{v.text}</span>;
          })}
        </div>
        <textarea
          ref={inputRef} value={input}
          onChange={(e) => handleInput(e.target.value)}
          onCompositionStart={() => { composingRef.current = true; compositionStartRef.current = input; }}
          onCompositionEnd={(e) => { composingRef.current = false; handleInput(e.currentTarget.value, compositionStartRef.current); }}
          onPaste={(e) => e.preventDefault()} onDrop={(e) => e.preventDefault()}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          disabled={finished}
          className="absolute inset-0 h-full w-full cursor-text resize-none opacity-0"
          aria-label={km ? "វាយអត្ថបទនៅទីនេះ" : "Type the text shown"} lang={language === "khmer" ? "km" : "en"}
          autoCapitalize="off" autoCorrect="off" autoComplete="off" spellCheck={false}
        />
        {!focused && !finished && (
          <button type="button" onClick={() => inputRef.current?.focus()} className="absolute inset-0 grid place-items-center rounded-2xl bg-white/70 text-sm font-bold text-navy backdrop-blur-[2px]">
            {km ? "ចុចទីនេះ ដើម្បីបន្តវាយ" : "Click here to focus and type"}
          </button>
        )}
      </div>
      <p className="mt-2 text-xs text-mute">{running ? (km ? "កំពុងរាប់ម៉ោង…" : "Timer running…") : km ? "ម៉ោងចាប់ផ្តើមនៅពេលអ្នកចុចគ្រាប់ទីមួយ។" : "The timer starts with your first keystroke."}</p>

      {keyboard && (
        <div className="mt-4">
          <VirtualKeyboard language={language} expected={nextChar} disabled={finished} onChar={(c) => { handleInput(`${input}${c}`); inputRef.current?.focus(); }} onBackspace={() => { handleInput(Array.from(input).slice(0, -1).join("")); inputRef.current?.focus(); }} />
        </div>
      )}
    </div>
  );
}
