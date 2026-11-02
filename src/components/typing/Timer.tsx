type TimerProps = {
  seconds: number;
  label?: string;
};

export default function Timer({ seconds, label = "SESSION LENGTH" }: TimerProps) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");

  return (
    <div className="rounded-xl border border-[#e9ebe4] bg-white px-4 py-3">
      <span className="block text-[9px] font-bold tracking-[0.14em] text-[#92978d]">{label}</span>
      <span className="mt-1 block font-serif text-2xl text-[#365b40]">{minutes}:{remainder}</span>
    </div>
  );
}
