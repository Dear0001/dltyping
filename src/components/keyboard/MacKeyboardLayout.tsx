const rows = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
];

export default function MacKeyboardLayout() {
  return (
    <div className="rounded-2xl border border-[#e8e9e2] bg-white p-5 shadow-sm" aria-label="Mac keyboard layout preview">
      <div className="mb-4 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em] text-[#858b80]">
        <span>Mac keyboard</span><span className="rounded-full bg-[#f0f3ec] px-3 py-1 text-[10px] tracking-normal text-[#59745b]">QWERTY</span>
      </div>
      <div className="mx-auto max-w-[390px] space-y-2">
        {rows.map((row, index) => <div key={index} className="flex justify-center gap-1.5">{row.map((key) => <span key={key} className="grid h-9 min-w-8 flex-1 place-items-center rounded-md border border-[#e5e7df] bg-[#fafbf8] text-xs text-[#626a5f] shadow-[0_2px_0_#e6e8e1]">{key}</span>)}</div>)}
        <div className="flex justify-center gap-1.5 pt-1"><span className="grid h-8 min-w-16 place-items-center rounded-md border border-[#e5e7df] bg-[#f4f5f1] px-2 text-[10px] text-[#72796f]">⌃ Control</span><span className="grid h-8 min-w-16 place-items-center rounded-md border border-[#e5e7df] bg-white px-2 text-[10px] text-[#72796f]">⌥ Option</span><span className="grid h-8 min-w-24 place-items-center rounded-md border border-[#dce5d7] bg-[#f2f6ef] px-2 text-[10px] text-[#55745a]">⌘ Command</span><span className="h-8 flex-1 rounded-md border border-[#e5e7df] bg-white" aria-label="Space bar" /></div>
      </div>
    </div>
  );
}
