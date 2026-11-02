"use client";

import { useLocale } from "@/components/shared/LocaleProvider";

const rows = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
];

export default function MacKeyboardLayout() {
  const { t } = useLocale();
  return (
    <div className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-sm" aria-label={`${t("keyboard.mac")} · ${t("keyboard.preview")}`}>
      <div className="mb-4 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em] text-[#64748b]">
        <span>{t("keyboard.mac")}</span><span className="rounded-full bg-[#ebeff4] px-3 py-1 text-[10px] tracking-normal text-[#576376]">QWERTY</span>
      </div>
      <div className="mx-auto max-w-[390px] space-y-2">
        {rows.map((row, index) => <div key={index} className="flex justify-center gap-1.5">{row.map((key) => <span key={key} className="grid h-9 min-w-8 flex-1 place-items-center rounded-md border border-[#dee2e8] bg-[#eff6ff] text-xs text-[#5e636b] shadow-[0_2px_0_#e0e4e9]">{key}</span>)}</div>)}
        <div className="flex justify-center gap-1.5 pt-1"><span className="grid h-8 min-w-16 place-items-center rounded-md border border-[#dee2e8] bg-[#f1f2f5] px-2 text-[10px] text-[#6e737a]">⌃ Control</span><span className="grid h-8 min-w-16 place-items-center rounded-md border border-[#dee2e8] bg-white px-2 text-[10px] text-[#6e737a]">⌥ Option</span><span className="grid h-8 min-w-24 place-items-center rounded-md border border-[#d6dce6] bg-[#eef2f7] px-2 text-[10px] text-[#536076]">⌘ Command</span><span className="h-8 flex-1 rounded-md border border-[#dee2e8] bg-white" aria-label={t("practice.keyboardSpace")} /></div>
      </div>
    </div>
  );
}
