import { SkPage, SkHeading, SkTabs, SkStatRow, SkChart, SkCard, SkTable } from "@/components/skeleton/Skeleton";

export default function Loading() {
  return <SkPage><SkHeading actions /><SkTabs count={3} /><SkStatRow /><div className="grid gap-4 lg:grid-cols-3"><div className="lg:col-span-2"><SkChart /></div><SkCard lines={4} media="h-40" /></div><div className="mt-6"><SkTable /></div></SkPage>;
}
