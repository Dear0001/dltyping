import { Suspense } from "react";
import { connection } from "next/server";
import TypingPractice from "@/components/typing/typing-practice";
import { getOSPlatform } from "@/lib/os-detect";
import { resolveLessonId } from "@/lib/lesson-picker";

type KhmerPracticeProps = {
  searchParams: Promise<{ lesson?: string; time?: string }>;
};

async function KhmerPracticeContent({ searchParams }: KhmerPracticeProps) {
  const { lesson, time } = await searchParams;
  const allowedTimes = [60, 120, 300];
  const requestedTime = Number(time);
  const timeLimit = allowedTimes.includes(requestedTime) ? requestedTime : 60;
  const platform = await getOSPlatform();
  // No lesson (direct visit) or "random" (plain link / new tab): draw one per request. Done here, once, so server and client agree.
  await connection(); // opt out of prerendering: the random pick must run per request
  const lessonId = resolveLessonId("khmer", lesson);

  return <TypingPractice language="khmer" platform={platform} initialLessonId={lessonId} timeLimit={timeLimit} />;
}

export default function KhmerPracticePage(props: KhmerPracticeProps) {
  return <Suspense fallback={<TypingPractice language="khmer" />}><KhmerPracticeContent {...props} /></Suspense>;
}
