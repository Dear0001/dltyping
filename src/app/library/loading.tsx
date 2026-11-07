import { SkPage, SkHeading, SkTabs, SkGrid } from "@/components/skeleton/Skeleton";

export default function Loading() {
  return <SkPage width="max-w-5xl"><SkHeading /><SkTabs count={4} /><SkGrid count={6} lines={3} media={null} /></SkPage>;
}
