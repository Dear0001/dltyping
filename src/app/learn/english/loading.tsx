import { SkPage, Sk, SkCard, SkKeyboard } from "@/components/skeleton/Skeleton";

export default function Loading() {
  return <SkPage width="max-w-5xl"><Sk className="mb-4 h-3 w-48" /><div className="grid gap-4 md:grid-cols-[1fr_260px]"><div><Sk className="mb-3 h-14 w-full" /><Sk className="mb-4 h-56 w-full" /><SkKeyboard /></div><div className="space-y-3"><SkCard lines={4} media={null} /><SkCard lines={2} media={null} /></div></div></SkPage>;
}
