"use client";

import type { KeyboardSettings as Settings, KeyboardSize } from "@/hooks/useKeyboardSettings";
import type { KeyboardLabels } from "./labels";

type Props = { settings: Settings; labels: KeyboardLabels; onChange: (patch: Partial<Settings>) => void };

/** Compact secondary-settings panel: size and helper toggles. */
export default function KeyboardSettings({ settings, labels, onChange }: Props) {
  const sizes: [KeyboardSize, string][] = [["sm", labels.small], ["md", labels.medium], ["lg", labels.large]];
  return (
    <div className="vk-settings" role="group" aria-label={labels.settings}>
      <div className="vk-setting">
        <span>{labels.size}</span>
        <div className="vk-seg" role="radiogroup" aria-label={labels.size}>
          {sizes.map(([value, text]) => (
            <button key={value} type="button" role="radio" aria-checked={settings.size === value} className={settings.size === value ? "on" : ""} onClick={() => onChange({ size: value })}>{text}</button>
          ))}
        </div>
      </div>
      <label className="vk-check"><input type="checkbox" checked={settings.showNext} onChange={(e) => onChange({ showNext: e.target.checked })} />{labels.next}</label>
      <label className="vk-check"><input type="checkbox" checked={settings.hints} onChange={(e) => onChange({ hints: e.target.checked })} />{labels.tips}</label>
    </div>
  );
}
