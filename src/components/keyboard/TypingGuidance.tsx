"use client";

import HandGuide from "./HandGuide";
import type { KeyboardLabels } from "./labels";
import { colorOfFinger, FINGER_COLORS, FINGER_NAMES, type FingerName } from "@/lib/keyboard/finger-mapping";
import { describeGuidance, describeOutput, GUIDANCE_MODES, homeInstruction, noKeyInstruction, type GuidanceMode } from "@/lib/keyboard/typing-guidance";
import { legendGlyph } from "@/lib/keyboard/keyboard-utils";
import type { TypingGuidanceState } from "@/hooks/useTypingGuidance";
import type { Language } from "@/types";

type Props = {
  language: Language;
  locale: "en" | "km";
  labels: KeyboardLabels;
  state: TypingGuidanceState;
  expected: string | null;
  mode: GuidanceMode;
  onMode: (m: GuidanceMode) => void;
  showHands: boolean;
  onToggleHands: () => void;
};

const MODE_LABEL: Record<GuidanceMode, keyof KeyboardLabels> = { learning: "modeLearning", practice: "modePractice", challenge: "modeChallenge" };

/** Finger guide under the keyboard: both hands, the instruction, feedback, mode switch and colour legend. */
export default function TypingGuidance({ language, locale, labels, state, expected, mode, onMode, showHands, onToggleHands }: Props) {
  const { guidance, unmapped, visible, feedback } = state;
  const khmer = language === "khmer";
  const shown = visible ? guidance : null;
  const names = {
    hand: { left: labels.leftHand, right: labels.rightHand },
    finger: Object.fromEntries(FINGER_NAMES.map((n) => [n, labels[n]])) as Record<FingerName, string>,
  };

  let instruction: string;
  if (unmapped && expected) instruction = noKeyInstruction(expected, locale);
  else if (shown) instruction = describeGuidance(shown, locale, mode === "practice" ? "short" : "full");
  else if (guidance && !visible) instruction = labels.hintsHidden;
  else instruction = homeInstruction(locale);
  const output = shown && mode !== "challenge" ? describeOutput(language, shown, locale) : null;
  const color = shown ? colorOfFinger(shown.finger) : undefined;
  const handLabel = shown ? `${names.hand[shown.finger.startsWith("left") ? "left" : "right"]} ${names.finger[shown.finger.slice(shown.finger.indexOf("-") + 1) as FingerName]}` : "";

  return (
    <div className="vg" data-mode={mode}>
      <div className="vg-head">
        <strong>{labels.guide}</strong>
        <div className="vg-actions">
          <div className="vk-seg" role="radiogroup" aria-label={labels.mode}>
            {GUIDANCE_MODES.map((m) => (
              <button key={m} type="button" role="radio" aria-checked={mode === m} className={mode === m ? "on" : ""} onClick={() => onMode(m)}>{labels[MODE_LABEL[m]]}</button>
            ))}
          </div>
          <button type="button" className="vg-toggle" aria-pressed={showHands} onClick={onToggleHands}>{showHands ? labels.hideHands : labels.showHands}</button>
        </div>
      </div>

      <div className={`vg-body ${showHands ? "" : "vg-compact"}`}>
        {showHands && (
          <HandGuide
            target={shown?.finger ?? null}
            targetBadge={shown ? (khmer ? legendGlyph(shown.expected) : shown.keyName) : null}
            khmer={khmer}
            shift={shown?.shift?.finger ?? null}
            wrong={feedback?.kind === "wrong" ? feedback.wrongFinger : null}
            names={names}
            ariaLabel={labels.handsAria}
          />
        )}
        <div className="vg-info">
          {shown && (
            <div className="vg-expected">
              <span className="vg-cap" style={{ background: color }} aria-hidden="true">{khmer ? legendGlyph(shown.expected) : shown.keyName}</span>
              <span className="vg-expected-text"><small>{labels.expectedKey}</small><strong>{handLabel}</strong></span>
            </div>
          )}
          {/* Not a live region: it changes on every keystroke. Feedback below is the announced one. */}
          <p className="vg-instruction">{instruction}</p>
          {output && <p className={`vg-output ${khmer ? "font-khmer" : ""}`}>{output}</p>}
          {guidance && !visible && <button type="button" className="vg-hint" onClick={state.reveal}>{labels.showHint}</button>}
          <p className={`vg-feedback ${feedback ? `is-${feedback.kind}` : ""}`} role="status" aria-live="polite">
            {feedback && <><span aria-hidden="true">{feedback.kind === "correct" ? "✓ " : "✕ "}</span>{feedback.text}</>}
          </p>
          <ul className="vg-legend" aria-label={labels.fingerColors}>
            {FINGER_NAMES.map((n) => (
              <li key={n}><span className="vg-swatch" style={{ background: FINGER_COLORS[n] }} aria-hidden="true" />{labels[n]}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
