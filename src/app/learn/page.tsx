import type { Metadata } from "next";
import CurriculumHub from "@/components/learn/CurriculumHub";

export const metadata: Metadata = {
  title: "Learn — DL Typing",
  description: "Follow a structured English and Khmer typing curriculum with five levels, 13 lessons per language and a typing game for every skill. Learn to type faster, step by step, for free.",
};

export default function LearnPage() {
  return <CurriculumHub />;
}
