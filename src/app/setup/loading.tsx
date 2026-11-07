import { SkPage, SkHeading, SkForm, SkKeyboard } from "@/components/skeleton/Skeleton";

export default function Loading() {
  return <SkPage><SkHeading /><SkForm fields={3} /><div className="mt-6"><SkKeyboard /></div></SkPage>;
}
