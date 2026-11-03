import { Suspense } from "react";
import { connection } from "next/server";
import TypingPractice from "@/components/typing/typing-practice";
import { getOSPlatform } from "@/lib/os-detect";
import { resolveLessonId } from "@/lib/lesson-picker";

type EnglishPracticeProps = {
  searchParams: Promise<{ lesson?: string; time?: string }>;
};

async function EnglishPracticeContent({ searchParams }: EnglishPracticeProps) {
  const { lesson, time } = await searchParams;
  const allowedTimes = [60, 120, 300];
  const requestedTime = Number(time);
  const timeLimit = allowedTimes.includes(requestedTime) ? requestedTime : 60;
  const platform = await getOSPlatform();
  // No lesson (direct visit) or "random" (plain link / new tab): draw one per request. Done here, once, so server and client agree.
  await connection(); // opt out of prerendering: the random pick must run per request
  const lessonId = resolveLessonId("english", lesson);

  return <TypingPractice language="english" platform={platform} initialLessonId={lessonId} timeLimit={timeLimit} />;
}

export default function EnglishPracticePage(props: EnglishPracticeProps) {
  return <Suspense fallback={<TypingPractice language="english" />}><EnglishPracticeContent {...props} /></Suspense>;
}
