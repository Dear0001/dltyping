import type { Metadata } from "next";
import LessonLibrary from "@/components/library/LessonLibrary";

export const metadata: Metadata = {
  title: "Library — DL Typing",
  description: "Browse, search and filter every English and Khmer typing lesson in one place. Pick a level, language or skill and start the lesson you want to practise today.",
};

export default function LibraryPage() {
  return <LessonLibrary />;
}
