import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import LessonDetail from "@/components/learn/LessonDetail";
import { khmerCurriculum, findLesson } from "@/data/curriculum";

type Props = { params: Promise<{ lessonId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lessonId } = await params;
  const lesson = findLesson(khmerCurriculum, lessonId);
  if (!lesson) return { title: "Lesson not found — Keyflow" };
  return {
    title: `${lesson.titleKm ?? lesson.title} — Keyflow`,
    description: lesson.objectives[0] ?? "Khmer typing lesson",
  };
}

async function KhmerLessonContent({ params }: Props) {
  await connection(); // opt out of prerendering — lesson content is per-request
  const { lessonId } = await params;
  const lesson = findLesson(khmerCurriculum, lessonId);
  if (!lesson) notFound();
  return <LessonDetail language="khmer" lessonId={lessonId} />;
}

export default function KhmerLessonPage(props: Props) {
  return <Suspense fallback={null}><KhmerLessonContent {...props} /></Suspense>;
}
