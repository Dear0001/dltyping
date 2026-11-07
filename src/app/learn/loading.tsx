import { SkPage, SkHeading, SkCard, SkGrid } from "@/components/skeleton/Skeleton";

export default function Loading() {
  return <SkPage width="max-w-5xl"><SkHeading /><SkCard lines={2} media={null} className="mb-6" /><SkGrid count={4} cols="sm:grid-cols-2" lines={3} media="h-16" /></SkPage>;
}
