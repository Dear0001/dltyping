import type { Metadata } from "next";
import CurriculumHub from "@/components/learn/CurriculumHub";

export const metadata: Metadata = {
  title: "Learn — DL Typing",
  description: "Follow a structured English and Khmer typing curriculum with five levels, 13 lessons per language and a typing game for every skill. Free and step by step.",
};

export default function LearnPage() {
  return <CurriculumHub />;
}
