import { SkPage, SkHeading, SkStatRow, SkCard } from "@/components/skeleton/Skeleton";

export default function Loading() {
  return <SkPage width="max-w-4xl"><SkHeading /><SkStatRow count={3} /><SkCard lines={3} media={null} className="mb-4" /><SkCard lines={3} media={null} /></SkPage>;
}
