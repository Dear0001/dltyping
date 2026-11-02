import { Suspense } from "react";
import TypingPractice from "@/components/typing/typing-practice";
import { getOSPlatform } from "@/lib/os-detect";

type KhmerPracticeProps = {
  searchParams: Promise<{ lesson?: string; time?: string }>;
};

async function KhmerPracticeContent({ searchParams }: KhmerPracticeProps) {
  const { lesson, time } = await searchParams;
  const allowedTimes = [60, 120, 300];
  const requestedTime = Number(time);
  const timeLimit = allowedTimes.includes(requestedTime) ? requestedTime : 60;
  const platform = await getOSPlatform();

  return <TypingPractice language="khmer" platform={platform} initialLessonId={lesson} timeLimit={timeLimit} />;
}

export default function KhmerPracticePage(props: KhmerPracticeProps) {
  return <Suspense fallback={<TypingPractice language="khmer" />}><KhmerPracticeContent {...props} /></Suspense>;
}
