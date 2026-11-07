import { SkPage, SkHeading, SkStatRow, SkGrid } from "@/components/skeleton/Skeleton";

export default function Loading() {
  return <SkPage><SkHeading /><SkStatRow count={3} /><SkGrid count={8} cols="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" lines={1} media="h-28" /></SkPage>;
}
