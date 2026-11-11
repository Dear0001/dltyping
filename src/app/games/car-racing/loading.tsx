import { SkPage, Sk } from "@/components/skeleton/Skeleton";

export default function Loading() {
  return <SkPage width="max-w-5xl"><Sk className="mb-4 h-3 w-40" /><Sk className="mb-5 h-44 w-full" /><div className="mb-5 grid gap-5 lg:grid-cols-2"><Sk className="h-80" /><Sk className="h-80" /></div><div className="grid gap-5 lg:grid-cols-3">{Array.from({ length: 3 }, (_, i) => <Sk key={i} className="h-56" />)}</div></SkPage>;
}
