"use client";

import Link from "next/link";
import { useNow } from "@/hooks/useTypingProgress";
import { drillCharsFor, keyCapGlyph, MIN_SAMPLES, type KeyAnalysis, type MasteryLevel } from "@/lib/progress/keyboard-analytics";
import { drillHref, letterJumpHref } from "@/lib/progress/drill-params";
import { useLocale } from "@/components/shared/LocaleProvider";
import { useProgressText } from "@/hooks/useProgressText";
import type { Translate } from "@/lib/i18n";

const BADGE: Record<MasteryLevel, string> = {
  excellent: "bg-blue-600 text-white",
  good: "bg-sky-200 text-sky-900",
  weak: "bg-red-100 text-red-800",
  learning: "border border-dashed border-slate-400 bg-white text-slate-700",
  none: "bg-slate-100 text-slate-600",
};

const unicodeOf = (char: string) => Array.from(char).map((c) => `U+${(c.codePointAt(0) ?? 0).toString(16).toUpperCase().padStart(4, "0")}`).join(" ");

export default function KeyPerformanceDetail({ analysis }: { analysis: KeyAnalysis | null }) {
  const { t } = useLocale();
  const pt = useProgressText();
  const showChar = (c: string) => (c === " " ? t("km.space") : c);
  const now = useNow();
  if (!analysis) {
    return (
      <div className="grid min-h-48 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-mute">
        <div><p className="text-3xl" aria-hidden="true">👆</p><p className="mt-2">{t("kd.select")}</p></div>
      </div>
    );
  }
  const { language } = analysis;
  const khmer = language === "khmer";
  const chars = drillCharsFor(analysis);
  const exercises = exercisesFor(analysis, chars, t, pt.keyName(analysis.code));

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-live="polite" aria-label={t("kd.detailsAria", { name: pt.keyName(analysis.code) })}>
      <div className="flex items-start gap-4">
        <div className={`grid h-16 w-16 flex-none place-items-center rounded-xl border-2 border-navy bg-slate-50 text-3xl font-extrabold text-navy ${khmer ? "font-khmer" : ""}`}>{keyCapGlyph(language, analysis.code)}</div>
        <div className="min-w-0">
          <h3 className="text-lg font-extrabold text-navy">{t("km.keyName", { name: pt.keyName(analysis.code) })}</h3>
          <p className="text-xs text-mute">{t("kd.layout", { lang: t(`category.${language}`) })}<code className="rounded bg-slate-100 px-1">{analysis.code}</code></p>
          <span className={`mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${BADGE[analysis.level]}`}>{pt.masteryLabel(analysis.level)}</span>
        </div>
      </div>

      {analysis.total === 0 ? (
        <p className="mt-4 rounded-xl bg-slate-50 px-3 py-3 text-sm text-mute">{t("kd.notTyped")}</p>
      ) : (
        <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Fact label={t("kd.keystrokes")} value={analysis.total} />
          <Fact label={t("kd.correct")} value={analysis.correct} />
          <Fact label={t("kd.incorrect")} value={analysis.incorrect} />
          <Fact label={t("kd.accuracy")} value={`${analysis.accuracy}%`} />
          <Fact label={t("kd.last")} value={pt.lastPracticed(analysis.lastPracticed, now)} />
          <Fact label={t("kd.mastery")} value={pt.masteryLabel(analysis.level)} />
        </dl>
      )}
      {analysis.level === "learning" && (
        <p className="mt-3 rounded-xl bg-blue-50 px-3 py-2 text-xs text-navy">{t("kd.needsMore", { n: analysis.samplesNeeded, min: MIN_SAMPLES })}</p>
      )}

      <h4 className="mt-5 text-sm font-extrabold text-navy">{t(khmer ? "kd.charsOnKey" : "kd.whatTypes")}</h4>
      {khmer && <p className="mt-0.5 text-xs text-mute">{t("kd.shiftNote")}</p>}
      <ul className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200">
        {analysis.chars.map((c) => (
          <li key={c.char} className="flex items-center gap-3 px-3 py-2 text-sm">
            <span className={`grid h-9 min-w-9 place-items-center rounded-lg bg-slate-50 px-1 text-lg font-bold text-navy ${khmer ? "font-khmer" : ""}`}>{showChar(c.char)}</span>
            <span className="flex-1 text-xs text-mute">{t(c.layer === "shift" ? "kd.withShift" : "kd.base")} · <span className="tabular-nums">{unicodeOf(c.char)}</span></span>
            <span className="text-right text-xs">{c.total === 0 ? <span className="text-mute">{t("kd.notPracticed")}</span> : <><strong className="tabular-nums text-navy">{c.accuracy}%</strong> <span className="text-mute">({c.total})</span></>}</span>
          </li>
        ))}
      </ul>

      <h4 className="mt-5 text-sm font-extrabold text-navy">{t("kd.recommended")}</h4>
      <ul className="mt-2 space-y-2">
        {exercises.map((e) => (
          <li key={e.href} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2">
            <div><p className="text-sm font-semibold text-navy">{e.title}</p><p className="text-xs text-mute">{e.why}</p></div>
            <Link href={e.href} className="rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-white hover:brightness-110">{t(e.game ? "kd.playGame" : "kd.startPractice")}</Link>
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

function exercisesFor(a: KeyAnalysis, chars: string[], t: Translate, name: string) {
  const lang = a.language;
  if (!chars.length) return [{ title: t("kd.exStart"), why: t("kd.exStartWhy"), href: `/learn/${lang}`, game: false }];
  const drill = { title: t("kd.exDrill", { name }), href: drillHref(lang, { drill: chars.join("") }, { time: "120" }), game: false };
  const jump = { title: t("kd.exJump", { name }), href: letterJumpHref(lang, chars.length >= 2 ? chars : [...chars, ...chars]), game: true };
  switch (a.level) {
    case "weak": return [{ ...drill, why: t("kd.whyWeak", { acc: a.accuracy ?? 0 }) }, { ...jump, why: t("kd.whyJump") }];
    case "good": return [{ ...drill, why: t("kd.whyGood") }];
    case "excellent": return [{ title: t("kd.keepSharp"), href: `/learn/${lang}`, game: false, why: t("kd.whyExcellent") }];
    case "learning": return [{ ...drill, why: t("kd.whyLearning", { n: a.samplesNeeded }) }];
    default: return [{ ...drill, why: t("kd.whyNone") }];
  }
}
