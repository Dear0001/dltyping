"use client";

import { useLocale } from "@/components/shared/LocaleProvider";

const rows = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
];

export default function WindowsKeyboardLayout() {
  const { t } = useLocale();
  return (
    <div className="keyboard-card keyboard-preview" aria-label={`${t("keyboard.windows")} · ${t("keyboard.preview")}`}>
      <div className="keyboard-topline">
        <span>{t("keyboard.windows")}</span><span className="layout-chip">QWERTY</span>
      </div>
      <div className="keyboard">
        {rows.map((row, index) => <div key={index} className={`key-row row-${index}`}>{row.map((key) => <span key={key} className="key preview-key">{key}</span>)}</div>)}
        <div className="key-row modifier-row"><span className="key special-key preview-key">Ctrl</span><span className="key special-key preview-key">Alt</span><span className="key special-key preview-key">⊞ Win</span><span className="key space-key preview-key" aria-label={t("practice.keyboardSpace")} /></div>
      </div>
    </div>
  );
}
