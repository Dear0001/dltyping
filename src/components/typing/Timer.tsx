type TimerProps = {
  seconds: number;
  label?: string;
};

export default function Timer({ seconds, label = "SESSION LENGTH" }: TimerProps) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");

  return (
    <div className="rounded-xl border border-[#eff6ff] bg-white px-4 py-3">
      <span className="block text-[9px] font-bold tracking-[0.14em] text-[#64748b]">{label}</span>
      <span className="mt-1 block font-serif text-2xl text-[#2563eb]">{minutes}:{remainder}</span>
    </div>
  );
}
