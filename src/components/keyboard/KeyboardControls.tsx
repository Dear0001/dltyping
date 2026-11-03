"use client";

import type { OSChoice } from "@/hooks/useKeyboardSettings";
import type { Language } from "@/types";
import type { KeyboardLabels } from "./labels";

type Props = {
  labels: KeyboardLabels;
  language: Language;
  languageSelectable: boolean;
  onLanguage: (l: Language) => void;
  osChoice: OSChoice;
  onOS: (o: OSChoice) => void;
  visible: boolean;
  onToggleVisible: () => void;
  settingsOpen: boolean;
  onToggleSettings: () => void;
};

/** Header row: language, OS selector, settings + show/hide. */
export default function KeyboardControls({ labels, language, languageSelectable, onLanguage, osChoice, onOS, visible, onToggleVisible, settingsOpen, onToggleSettings }: Props) {
  const oses: [OSChoice, string][] = [["auto", labels.auto], ["mac", labels.mac], ["windows", labels.windows]];
  return (
    <div className="vk-controls">
      <div className="vk-title">
        <span className="vk-dot" aria-hidden />
        <strong>{labels.keyboard}</strong>
        {!languageSelectable && <span className="vk-chip">{language === "khmer" ? "Khmer NiDA" : "English QWERTY"}</span>}
      </div>
      <div className="vk-actions">
        {languageSelectable && (
          <div className="vk-seg" role="radiogroup" aria-label={labels.language}>
            {(["english", "khmer"] as const).map((l) => (
              <button key={l} type="button" role="radio" aria-checked={language === l} className={language === l ? "on" : ""} onClick={() => onLanguage(l)}>{l === "english" ? labels.english : labels.khmer}</button>
            ))}
          </div>
        )}
        <div className="vk-seg" role="radiogroup" aria-label={labels.os}>
          {oses.map(([value, text]) => (
            <button key={value} type="button" role="radio" aria-checked={osChoice === value} className={osChoice === value ? "on" : ""} onClick={() => onOS(value)}>{text}</button>
          ))}
        </div>
        <button type="button" className="vk-icon" aria-expanded={settingsOpen} aria-label={labels.settings} title={labels.settings} onClick={onToggleSettings}>⚙</button>
        <button type="button" className="vk-icon" aria-pressed={visible} aria-label={visible ? labels.hide : labels.show} title={visible ? labels.hide : labels.show} onClick={onToggleVisible}>{visible ? "⌄" : "⌃"}</button>
      </div>
    </div>
  );
}
