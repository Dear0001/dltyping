import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import LessonDetail from "@/components/learn/LessonDetail";
import { englishCurriculum, findLesson } from "@/data/curriculum";

type Props = { params: Promise<{ lessonId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lessonId } = await params;
  const lesson = findLesson(englishCurriculum, lessonId);
  if (!lesson) return { title: "Lesson not found — DL Typing" };
  return {
    title: `${lesson.title} — DL Typing`,
    description: lesson.objectives[0] ?? "English typing lesson",
  };
}

async function EnglishLessonContent({ params }: Props) {
  await connection(); // opt out of prerendering — lesson content is per-request
  const { lessonId } = await params;
  const lesson = findLesson(englishCurriculum, lessonId);
  if (!lesson) notFound();
  return <LessonDetail language="english" lessonId={lessonId} />;
}

export default function EnglishLessonPage(props: Props) {
  return <Suspense fallback={null}><EnglishLessonContent {...props} /></Suspense>;
}
