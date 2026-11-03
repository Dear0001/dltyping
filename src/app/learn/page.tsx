import type { Metadata } from "next";
import CurriculumHub from "@/components/learn/CurriculumHub";

export const metadata: Metadata = {
  title: "Learn — Keyflow",
  description: "Structured English and Khmer typing curriculum — levels, lessons and game-based reinforcement.",
};

export default function LearnPage() {
  return <CurriculumHub />;
}
