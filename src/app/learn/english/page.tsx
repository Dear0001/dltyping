import { Suspense } from "react";
import TypingPractice from "@/components/typing/typing-practice";
import { getOSPlatform } from "@/lib/os-detect";

type EnglishPracticeProps = {
  searchParams: Promise<{ lesson?: string; time?: string }>;
};

async function EnglishPracticeContent({ searchParams }: EnglishPracticeProps) {
  const { lesson, time } = await searchParams;
  const allowedTimes = [60, 120, 300];
  const requestedTime = Number(time);
  const timeLimit = allowedTimes.includes(requestedTime) ? requestedTime : 60;
  const platform = await getOSPlatform();

  return <TypingPractice language="english" platform={platform} initialLessonId={lesson} timeLimit={timeLimit} />;
}

export default function EnglishPracticePage(props: EnglishPracticeProps) {
  return <Suspense fallback={<TypingPractice language="english" />}><EnglishPracticeContent {...props} /></Suspense>;
}
