import type { Metadata } from "next";
import CurriculumHub from "@/components/learn/CurriculumHub";
import { SITE_FACTS as F } from "@/lib/site-facts";

export const metadata: Metadata = {
  title: "Learn — DL Typing",
  description: `Follow a structured typing curriculum: ${F.enLessons} English lessons in ${F.enLevels} levels and ${F.kmLessons} Khmer lessons in ${F.kmLevels} levels, with a typing game for every skill. Free and step by step.`,
};

export default function LearnPage() {
  return <CurriculumHub />;
}
