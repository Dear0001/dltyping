"use client";

import Link from "next/link";
import { useNow } from "@/hooks/useTypingProgress";
import { describeLastPracticed, drillCharsFor, keyCapGlyph, MASTERY_META, MIN_SAMPLES, physicalKeyName, type KeyAnalysis, type MasteryLevel } from "@/lib/progress/keyboard-analytics";
import { drillHref, letterJumpHref } from "@/lib/progress/drill-params";
import { languageName } from "@/lib/progress/progress-analytics";

const BADGE: Record<MasteryLevel, string> = {
  excellent: "bg-blue-600 text-white",
  good: "bg-sky-200 text-sky-900",
  weak: "bg-red-100 text-red-800",
  learning: "border border-dashed border-slate-400 bg-white text-slate-700",
  none: "bg-slate-100 text-slate-600",
};

const unicodeOf = (char: string) => Array.from(char).map((c) => `U+${(c.codePointAt(0) ?? 0).toString(16).toUpperCase().padStart(4, "0")}`).join(" ");
const showChar = (c: string) => (c === " " ? "Space" : c);

export default function KeyPerformanceDetail({ analysis }: { analysis: KeyAnalysis | null }) {
  const now = useNow();
  if (!analysis) {
    return (
      <div className="grid min-h-48 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-mute">
        <div><p className="text-3xl" aria-hidden="true">👆</p><p className="mt-2">Select a key on the keyboard to see its accuracy, history and recommended exercises.</p></div>
      </div>
    );
  }
  const { language } = analysis;
  const khmer = language === "khmer";
  const chars = drillCharsFor(analysis);
  const exercises = exercisesFor(analysis, chars);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-live="polite" aria-label={`Details for key ${physicalKeyName(analysis.code)}`}>
      <div className="flex items-start gap-4">
        <div className={`grid h-16 w-16 flex-none place-items-center rounded-xl border-2 border-navy bg-slate-50 text-3xl font-extrabold text-navy ${khmer ? "font-khmer" : ""}`}>{keyCapGlyph(language, analysis.code)}</div>
        <div className="min-w-0">
          <h3 className="text-lg font-extrabold text-navy">Key {physicalKeyName(analysis.code)}</h3>
          <p className="text-xs text-mute">{languageName(language)} layout · physical key <code className="rounded bg-slate-100 px-1">{analysis.code}</code></p>
          <span className={`mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${BADGE[analysis.level]}`}>{MASTERY_META[analysis.level].label}</span>
        </div>
      </div>

      {analysis.total === 0 ? (
        <p className="mt-4 rounded-xl bg-slate-50 px-3 py-3 text-sm text-mute">You haven&apos;t typed this key in a finished session yet.</p>
      ) : (
        <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Fact label="Keystrokes" value={analysis.total} />
          <Fact label="Correct" value={analysis.correct} />
          <Fact label="Incorrect" value={analysis.incorrect} />
          <Fact label="Accuracy" value={`${analysis.accuracy}%`} />
          <Fact label="Last practiced" value={describeLastPracticed(analysis.lastPracticed, now)} />
          <Fact label="Mastery" value={MASTERY_META[analysis.level].label} />
        </dl>
      )}
      {analysis.level === "learning" && (
        <p className="mt-3 rounded-xl bg-blue-50 px-3 py-2 text-xs text-navy">Needs {analysis.samplesNeeded} more keystroke{analysis.samplesNeeded === 1 ? "" : "s"} (minimum {MIN_SAMPLES}) before this key is rated, so a few slips don&apos;t mislabel it.</p>
      )}

      <h4 className="mt-5 text-sm font-extrabold text-navy">{khmer ? "Characters on this key" : "What this key types"}</h4>
      {khmer && <p className="mt-0.5 text-xs text-mute">One physical key, different characters: the result depends on whether Shift is held.</p>}
      <ul className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200">
        {analysis.chars.map((c) => (
          <li key={c.char} className="flex items-center gap-3 px-3 py-2 text-sm">
            <span className={`grid h-9 min-w-9 place-items-center rounded-lg bg-slate-50 px-1 text-lg font-bold text-navy ${khmer ? "font-khmer" : ""}`}>{showChar(c.char)}</span>
            <span className="flex-1 text-xs text-mute">{c.layer === "shift" ? "With Shift" : "Base"} · <span className="tabular-nums">{unicodeOf(c.char)}</span></span>
            <span className="text-right text-xs">{c.total === 0 ? <span className="text-mute">not practiced</span> : <><strong className="tabular-nums text-navy">{c.accuracy}%</strong> <span className="text-mute">({c.total})</span></>}</span>
          </li>
        ))}
      </ul>

      <h4 className="mt-5 text-sm font-extrabold text-navy">Recommended exercises</h4>
      <ul className="mt-2 space-y-2">
        {exercises.map((e) => (
          <li key={e.href} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2">
            <div><p className="text-sm font-semibold text-navy">{e.title}</p><p className="text-xs text-mute">{e.why}</p></div>
            <Link href={e.href} className="rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white hover:brightness-110">{e.game ? "Play game" : "Start practice"}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-mute">{label}</dt>
      <dd className="mt-0.5 text-base font-extrabold tabular-nums text-navy">{value}</dd>
    </div>
  );
}

function exercisesFor(a: KeyAnalysis, chars: string[]) {
  const name = physicalKeyName(a.code);
  const lang = a.language;
  if (!chars.length) return [{ title: "Start a practice session", why: "Mix this key into regular typing.", href: `/learn/${lang}`, game: false }];
  const drill = { title: `Drill key ${name}`, href: drillHref(lang, { drill: chars.join("") }, { time: "120" }), game: false };
  const jump = { title: `Letter Jump on key ${name}`, href: letterJumpHref(lang, chars.length >= 2 ? chars : [...chars, ...chars]), game: true };
  switch (a.level) {
    case "weak": return [{ ...drill, why: `${a.accuracy}% accuracy, so slow, repeated reps help most.` }, { ...jump, why: "Game practice while the key stays in focus." }];
    case "good": return [{ ...drill, why: "A short drill can lift this key to excellent." }];
    case "excellent": return [{ title: "Keep it sharp", href: `/learn/${lang}`, game: false, why: "Strong mastery. Regular practice is enough." }];
    case "learning": return [{ ...drill, why: `${a.samplesNeeded} more keystrokes unlock a rating.` }];
    default: return [{ ...drill, why: "Not practiced yet. A quick drill builds your first data." }];
  }
}
