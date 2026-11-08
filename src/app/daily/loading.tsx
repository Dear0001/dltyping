import { SkPage, SkHeading, SkChart, SkKeyboard } from "@/components/skeleton/Skeleton";

export default function Loading() {
  return <SkPage width="max-w-5xl"><SkHeading /><SkChart className="h-56" /><div className="mt-4"><SkKeyboard /></div></SkPage>;
}
