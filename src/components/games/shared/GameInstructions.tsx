export type Instruction = { icon: string; title: string; text: string };

/** How-to-play list. Open by default for first-time players, collapsed afterwards. */
export default function GameInstructions({ steps, firstTime }: { steps: Instruction[]; firstTime: boolean }) {
  return <details open={firstTime} className="group rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
    <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold text-navy focus-visible:outline-2 focus-visible:outline-brand">
      <span>{firstTime ? "👋 New here? Quick tutorial" : "How to play"}</span>
      <span className="text-mute transition group-open:rotate-180" aria-hidden="true">⌄</span>
    </summary>
    <ol className="mt-3 space-y-2.5">
      {steps.map((step, n) => <li key={n} className="flex gap-3 text-sm">
        <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-white text-lg shadow-sm" aria-hidden="true">{step.icon}</span>
        <span><strong className="text-navy">{step.title}.</strong> <span className="text-slate-600">{step.text}</span></span>
      </li>)}
    </ol>
  </details>;
}
