import { SkPage, Sk } from "@/components/skeleton/Skeleton";

export default function Loading() {
  return <SkPage width="max-w-5xl"><Sk className="mb-4 h-3 w-40" /><Sk className="mb-6 h-9 w-1/2 max-w-sm" /><div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <Sk key={i} className="h-14" />)}</div><Sk className="mb-4 h-80 w-full" /><Sk className="h-40 w-full" /></SkPage>;
}
