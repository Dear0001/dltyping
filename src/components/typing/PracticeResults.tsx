"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { GameDialog } from "@/components/games/shared/GameDialog";
import { useLocale } from "@/components/shared/LocaleProvider";
import WeakKeysReport from "@/components/typing/WeakKeysReport";
import { Badge, Icon, ProgressRing, btn, cx, type Tone } from "@/components/ui/ui";
import type { IconName } from "@/components/ui/Icon";
import { QUALIFYING_MIN_CORRECT } from "@/lib/progress/progress-analytics";
import type { PracticeHighlight, PracticeOutcome } from "@/lib/practice-results";
import type { Language } from "@/types";

/** Everything the results screen shows, captured once when the session ends (so it never changes underneath the learner). */
export type PracticeResult = {
  language: Language;
  title: string;
  wpm: number;
  accuracy: number;
  /** Characters that match the text at the end. */
  correct: number;
  /** Every wrong keystroke, including ones fixed with backspace. */
  wrongKeys: number;
  /** Every keystroke judged against the text. */
  keystrokes: number;
  /** Mistakes still in the text at the end. */
  uncorrected: number;
  durationSec: number;
  /** "lesson": the curriculum lesson was completed; "repeat": completed before; "missed": the rule was not met; "none": no XP for this kind of text. */
  xp: { kind: "lesson" | "repeat" | "missed" | "none"; amount: number; minAccuracy?: number; minWpm?: number };
  outcome: PracticeOutcome;
  best: { wpm: number; accuracy: number } | null;
  mistakes: { index: number; expected: string; typed: string }[];
};

const HIGHLIGHT: Record<PracticeHighlight, { icon: IconName; tone: Tone }> = {
  "new-best": { icon: "trophy", tone: "new" },
  "first-result": { icon: "star", tone: "brand" },
  "speed-up": { icon: "bolt", tone: "brand" },
  "accuracy-up": { icon: "target", tone: "success" },
  "lesson-done": { icon: "check", tone: "success" },
  "day-counted": { icon: "flame", tone: "warning" },
};

type Props = {
  result: PracticeResult;
  hasNextLesson: boolean;
  onRetry: () => void;
  onNextLesson: () => void;
  onNewText: () => void;
  onDrill: (text: string) => void;
  onClose: () => void;
};

export default function PracticeResults({ result, hasNextLesson, onRetry, onNextLesson, onNewText, onDrill, onClose }: Props) {
  const { t } = useLocale();
  const { outcome } = result;
  const clock = `${Math.floor(result.durationSec / 60)}:${String(result.durationSec % 60).padStart(2, "0")}`;
  const title = result.xp.kind === "lesson" || result.xp.kind === "repeat" ? t("practice.lessonCompleteTitle") : t("results.title");
  const space = (c: string) => (c === " " ? t("practice.space") : c);
  const delta = outcome.bestDelta;

  return (
    <GameDialog title={title} subtitle={result.title} icon={outcome.highlights.includes("new-best") ? "🏆" : result.xp.kind === "lesson" ? "🎉" : "✅"} onEscape={onClose} wide>
      <div className="pr">
        {outcome.highlights.length > 0 && (
          <ul className="pr-highlights" aria-label={t("results.highlights")}>
            {outcome.highlights.map((h) => <li key={h}><Badge tone={HIGHLIGHT[h].tone} icon={HIGHLIGHT[h].icon} className="pr-badge">{t(`results.hl.${h}`)}</Badge></li>)}
          </ul>
        )}

        <div className="pr-hero">
          <div className="pr-speed">
            <span className="pr-label">{t("results.speed")}</span>
            <strong>{result.wpm}<small>WPM</small></strong>
            <span className={cx("pr-compare", delta !== null && delta > 0 && "is-up", delta !== null && delta < 0 && "is-down")}>
              {delta === null ? t("results.noBest") : delta > 0 ? t("results.aboveBest", { n: delta, best: result.best?.wpm ?? 0 }) : delta === 0 ? t("results.equalBest") : t("results.belowBest", { n: -delta, best: result.best?.wpm ?? 0 })}
            </span>
          </div>
          <div className="pr-accuracy">
            <ProgressRing value={result.accuracy} size={96} stroke={9} fillClass={result.accuracy >= 95 ? "text-emerald-500" : result.accuracy >= 85 ? "text-brand" : "text-amber-500"}>
              <span className="pr-ring-value">{result.accuracy}<small>%</small></span>
            </ProgressRing>
            <span className="pr-label">{t("practice.accuracy")}</span>
          </div>
        </div>

        <dl className="pr-grid">
          <Stat label={t("results.correctChars")} value={result.correct} tone="good" />
          <Stat label={t("results.wrongKeys")} value={result.wrongKeys} tone={result.wrongKeys ? "bad" : undefined} hint={result.uncorrected ? t("results.uncorrected", { n: result.uncorrected }) : undefined} />
          <Stat label={t("results.keystrokes")} value={result.keystrokes} />
          <Stat label={t("practice.timeStat")} value={clock} />
          <Stat label={t("results.language")} value={t(result.language === "khmer" ? "results.khmer" : "results.english")} />
          <Stat label="XP" value={result.xp.kind === "lesson" ? `+${result.xp.amount}` : "0"} tone={result.xp.kind === "lesson" ? "good" : undefined} />
        </dl>

        <p className={cx("pr-feedback", `is-${outcome.feedback}`)}><Icon name="sparkle" size={16} />{t(`results.fb.${outcome.feedback}`)}</p>
        <p className="pr-xp">
          {result.xp.kind === "lesson" && t("results.xp.lesson", { xp: result.xp.amount })}
          {result.xp.kind === "repeat" && t("results.xp.repeat")}
          {result.xp.kind === "missed" && (result.xp.minWpm ? t("results.xp.missedWpm", { acc: result.xp.minAccuracy ?? 0, wpm: result.xp.minWpm, xp: result.xp.amount }) : t("results.xp.missed", { acc: result.xp.minAccuracy ?? 0, xp: result.xp.amount }))}
          {result.xp.kind === "none" && t("results.xp.none")}
          {!outcome.qualifies && <> {t("results.notCounted", { n: QUALIFYING_MIN_CORRECT })}</>}
        </p>

        {result.mistakes.length > 0 && (
          <details className="pr-mistakes">
            <summary>{t("practice.mistakes", { n: result.mistakes.length })}</summary>
            <ul>{result.mistakes.slice(0, 60).map((m) => <li key={m.index}>{t("practice.expected")} <b>{space(m.expected)}</b> · {t("practice.typed")} <b>{space(m.typed)}</b></li>)}</ul>
          </details>
        )}

        <div className="pr-actions">
          <button data-autofocus type="button" className={btn("secondary", "md")} onClick={onRetry}><Icon name="restart" size={16} />{t("results.tryAgain")}</button>
          {hasNextLesson && <button type="button" className={btn("primary", "md")} onClick={onNextLesson}>{t("results.nextLesson")}<Icon name="arrow" size={16} /></button>}
          <button type="button" className={btn(hasNextLesson ? "secondary" : "primary", "md")} onClick={onNewText}><Icon name="sparkle" size={16} />{t("results.practiceAgain")}</button>
          <Link href="/dashboard" className={btn("ghost", "md")}><Icon name="progress" size={16} />{t("results.viewProgress")}</Link>
        </div>
        <p className="pr-keys"><kbd>esc</kbd> {t("results.escHint")}</p>

        <WeakKeysReport language={result.language} onDrill={onDrill} />
      </div>
    </GameDialog>
  );
}

function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: string; tone?: "good" | "bad" }) {
  return (
    <div className={cx("pr-stat", tone && `is-${tone}`)}>
      <dt>{label}</dt>
      <dd>{value}</dd>
      {hint && <small>{hint}</small>}
    </div>
  );
}
