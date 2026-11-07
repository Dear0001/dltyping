import { Suspense } from "react";
import { connection } from "next/server";
import TypingPractice from "@/components/typing/typing-practice";
import { getOSPlatform } from "@/lib/os-detect";
import { resolveLessonId } from "@/lib/lesson-picker";
import { isPlainLesson, normalizeDuration, resolveArticle } from "@/lib/article-length";
import { buildDrillText } from "@/lib/progress/drill-params";

type KhmerPracticeProps = {
  searchParams: Promise<{ lesson?: string; time?: string; drill?: string; combo?: string; words?: string; goal?: string }>;
};

async function KhmerPracticeContent({ searchParams }: KhmerPracticeProps) {
  const { lesson, time, drill, combo, words, goal } = await searchParams;
  const timeLimit = normalizeDuration(Number(time));
  const platform = await getOSPlatform();
  // No lesson (direct visit) or "random" (plain link / new tab): draw one per request. Done here, once, so server and client agree.
  await connection(); // opt out of prerendering: the random pick must run per request
  // Dashboard recommendations link here with what to drill; built once on the server so the page and client agree.
  const initialDrill = buildDrillText("khmer", { drill, combo, words });
  // A generated article is sized to the chosen duration; a plain lesson id opens that lesson as written.
  const generated = resolveArticle("khmer", lesson, Number(goal) || 0, timeLimit);
  const article = generated && !isPlainLesson(generated) ? { title: generated.title, text: generated.text } : null;
  const lessonId = generated ? generated.ids[0] : resolveLessonId("khmer", lesson);

  return <TypingPractice language="khmer" platform={platform} initialLessonId={lessonId} initialArticle={article} timeLimit={timeLimit} initialDrill={initialDrill} />;
}

export default function KhmerPracticePage(props: KhmerPracticeProps) {
  return <Suspense fallback={<TypingPractice language="khmer" />}><KhmerPracticeContent {...props} /></Suspense>;
}
