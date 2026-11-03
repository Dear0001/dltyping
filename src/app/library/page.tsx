import type { Metadata } from "next";
import LessonLibrary from "@/components/library/LessonLibrary";

export const metadata: Metadata = {
  title: "Library — Keyflow",
  description: "Browse, search and filter every English and Khmer typing lesson in one place.",
};

export default function LibraryPage() {
  return <LessonLibrary />;
}
