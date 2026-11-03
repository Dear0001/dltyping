"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { useLocale } from "@/components/shared/LocaleProvider";
import { useKeyboardInput } from "@/hooks/useKeyboardInput";
import { useKeyboardSettings } from "@/hooks/useKeyboardSettings";
import { useTypingGuidance } from "@/hooks/useTypingGuidance";
import { useOperatingSystem } from "@/hooks/useOperatingSystem";
import { FINGER_COLOR_BY_CODE } from "@/lib/keyboard/finger-mapping";
import { charForCode } from "@/lib/keyboard/keyboard-mapping";
import { isLetterKey } from "@/lib/keyboard/keyboard-utils";
import type { Language } from "@/types";
import KeyboardControls from "./KeyboardControls";
import KeyboardLayout from "./KeyboardLayout";
import type { KeyMastery } from "./KeyboardKey";
import KeyboardSettings from "./KeyboardSettings";
import TypingGuidance from "./TypingGuidance";
import { macLayout } from "./layouts/mac";
import { windowsLayout } from "./layouts/windows";
import type { KeyboardOS } from "./layouts/types";
import { keyboardLabels } from "./labels";
import "./keyboard.css";

type Props = {
  language: Language;
  /** Next character the learner must type. Enables next-key highlight and correct/incorrect feedback. */
  expected?: string | null;
  /** Provide to make on-screen keys tappable. */
  onChar?: (char: string) => void;
  onBackspace?: () => void;
  /** Disables tapping and correct/incorrect judging (physical highlighting still works). */
  disabled?: boolean;
  /** Server-side OS guess used for the first paint. */
  osHint?: KeyboardOS | null;
  /** Let the user switch English/Khmer on the keyboard itself (e.g. the setup preview). */
  languageSelectable?: boolean;
  /** Per-key 0..1 "trouble" level (by event.code) drawn as a red tint, e.g. a weak-keys report. */
  heat?: Record<string, number>;
  /** Heatmap mode: colour keys by mastery. Pair with `onKeySelect` to make keys selectable. */
  keyStatus?: Record<string, { level: KeyMastery; tip?: string }>;
  selectedKey?: string | null;
  /** Show the finger guide (hands, instruction, feedback). Off for the dashboard heatmap. */
  guidance?: boolean;
  /** Called with the physical key code (KeyboardEvent.code) when a key is chosen. Replaces typing on tap. */
  onKeySelect?: (code: string) => void;
  className?: string;
  controls?: ReactNode;
};

const WIDTH = { sm: "34rem", md: "46rem", lg: "58rem" } as const;

export default function VirtualKeyboard({ language, expected = null, onChar, onBackspace, disabled = false, osHint = null, languageSelectable = false, className = "", heat, keyStatus, selectedKey, guidance: showGuidance = true, onKeySelect, controls }: Props) {
  const { locale } = useLocale();
  const labels = keyboardLabels(locale);
  const [settings, update] = useKeyboardSettings();
  const { os, detected } = useOperatingSystem(settings.os, osHint);
  const [langOverride, setLangOverride] = useState<Language | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [vShift, setVShift] = useState(false);
  const [vCaps, setVCaps] = useState(false);

  const lang = languageSelectable && langOverride ? langOverride : language;
  const { pressed, mods, flash, showFlash } = useKeyboardInput({ language: lang, expected: disabled ? null : expected });

  const shift = mods.shift || vShift;
  const caps = mods.caps !== vCaps;
  const layout = os === "mac" ? macLayout : windowsLayout;
  const interactive = (Boolean(onChar) && !disabled) || Boolean(onKeySelect);

  // One source of truth: the key highlight and the hand illustration both read this guidance.
  const activeExpected = disabled ? null : expected;
  const guide = useTypingGuidance({ language: lang, expected: activeExpected, caps, mode: settings.mode, flash, locale: locale === "km" ? "km" : "en" });
  const next = new Set<string>();
  if (settings.showNext && guide.visible && guide.guidance) {
    next.add(guide.guidance.code);
    if (guide.guidance.shift && !shift) next.add(guide.guidance.shift.code);
  }

  function tap(code: string) {
    if (!interactive) return;
    if (onKeySelect) {
      if (code === "Space" || charForCode(lang, code, false)) onKeySelect(code);
      return;
    }
    if (code === "ShiftLeft" || code === "ShiftRight") return setVShift((v) => !v);
    if (code === "CapsLock") return setVCaps((v) => !v);
    if (code === "Backspace") return onBackspace?.();
    const upper = lang === "english" && isLetterKey(code) ? shift !== caps : shift;
    const char = charForCode(lang, code, upper);
    if (!char || code === "Enter" || code === "Tab") return;
    setVShift(false);
    // Taps get the same correct/incorrect feedback as physical presses.
    if (activeExpected) showFlash(code, char === activeExpected || char.startsWith(activeExpected));
    onChar?.(char);
  }

  const osNote = settings.os === "auto" ? (detected ? labels.detected : "") : labels.manual;
  const desc = lang === "khmer" ? labels.descKhmer : labels.descEnglish;
  const tip = lang === "khmer" ? labels.tipKhmer : labels.tipEnglish;

  return (
    <section className={`vk ${className}`} data-os={os} data-lang={lang} data-mode={settings.mode} aria-label={labels.keyboard}>
      <KeyboardControls
        labels={labels} language={lang} languageSelectable={languageSelectable} onLanguage={setLangOverride}
        osChoice={settings.os} onOS={(o) => update({ os: o })}
        visible={settings.visible} onToggleVisible={() => update({ visible: !settings.visible })}
        settingsOpen={settingsOpen} onToggleSettings={() => setSettingsOpen((v) => !v)}
      />
      {controls && <div className="vk-game-controls">{controls}</div>}
      {settingsOpen && <KeyboardSettings settings={settings} labels={labels} onChange={update} />}
      {settings.visible && (
        <>
          <div className="vk-wrap" style={{ maxWidth: WIDTH[settings.size] }}>
            <KeyboardLayout
              layout={layout} language={lang} shift={shift} caps={caps} pressed={pressed} flash={flash} next={next}
              mods={mods} heat={heat} keyStatus={keyStatus} selectedKey={selectedKey} fingerColors={showGuidance ? FINGER_COLOR_BY_CODE : undefined} zones={showGuidance && settings.mode === "learning"} interactive={interactive} onTap={tap}
            />
          </div>
          <p className="vk-desc">{desc}{osNote && <span className="vk-os-note"> · {osNote}</span>}</p>
          {settings.hints && <p className="vk-tip">{tip}</p>}
        </>
      )}
      {showGuidance && (
        <TypingGuidance
          language={lang} locale={locale === "km" ? "km" : "en"} labels={labels} state={guide} expected={activeExpected}
          mode={settings.mode} onMode={(mode) => update({ mode })} showHands={settings.guide} onToggleHands={() => update({ guide: !settings.guide })}
        />
      )}
    </section>
  );
}
