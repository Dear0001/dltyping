import { SkPage, SkHeading, SkGrid, Sk } from "@/components/skeleton/Skeleton";

export default function Loading() {
  return <SkPage><SkHeading /><div className="mb-6 flex flex-wrap gap-2">{Array.from({ length: 4 }, (_, i) => <Sk key={i} className="h-9 w-28 rounded-full" />)}</div><SkGrid count={6} media="h-40" /></SkPage>;
}
