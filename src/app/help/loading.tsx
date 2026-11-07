import { SkPage, Sk } from "@/components/skeleton/Skeleton";

export default function Loading() {
  return <SkPage width="max-w-3xl"><Sk className="mb-6 h-9 w-1/2" />{Array.from({ length: 5 }, (_, i) => <div key={i} className="mb-6"><Sk className="mb-3 h-5 w-1/3" /><Sk className="mb-2 h-3 w-full" /><Sk className="h-3 w-4/5" /></div>)}</SkPage>;
}
