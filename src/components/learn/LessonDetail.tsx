"use client";

import Link from "next/link";
import SiteHeader from "@/components/shared/SiteHeader";
import { primaryBtn, secondaryBtn } from "@/components/games/shared/GameDialog";
import { curricula, findLesson, findLessonCourse, findLessonModule, nextLesson, prevLesson, levelLabels, levelColors } from "@/data/curriculum";
import { typingGames } from "@/data/games";
import { LessonStreakGuide } from "@/components/learn/StreakGuide";
import GameThumb from "@/components/games/shared/GameThumb";
import { useUserProgress } from "@/hooks/use-stored-value";
import { lessons as practiceLessons } from "@/data/lessons";
import type { Language } from "@/types";

type Props = { language: Language; lessonId: string };

function KeyBadge({ text }: { text: string }) {
  return (
    <span className={`inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold shadow-sm ${text.length > 4 ? "font-normal text-slate-600" : "font-bold text-navy"}`}>
      {text}
    </span>
  );
}

function ObjectiveList({ objectives }: { objectives: string[] }) {
  return (
    <ul className="space-y-2">
      {objectives.map((obj, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
          <span className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full bg-brand text-[10px] font-bold text-white">{i + 1}</span>
          {obj}
        </li>
      ))}
    </ul>
  );
}

export default function LessonDetail({ language, lessonId }: Props) {
  const curriculum = curricula[language];
  const lesson = findLesson(curriculum, lessonId);
  const course = findLessonCourse(curriculum, lessonId);
  const mod = findLessonModule(curriculum, lessonId);
  const next = nextLesson(curriculum, lessonId);
  const prev = prevLesson(curriculum, lessonId);

  const progress = useUserProgress();
  const isCompleted = !!progress.completedLessons[`${language}:${lessonId}`];
  const practiceLesson = practiceLessons[language].find((l) => l.id === lessonId);
  const previewText = practiceLesson?.text?.slice(0, 180) ?? "";

  if (!lesson || !course || !mod) {
    return (
      <div className="min-h-screen bg-surface text-navy">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 py-16 text-center">
          <p className="text-4xl" aria-hidden="true">🔍</p>
          <h1 className="mt-4 text-2xl font-extrabold">Lesson not found</h1>
          <p className="mt-2 text-mute">This lesson doesn&apos;t exist in the {language} curriculum.</p>
          <Link href="/learn" className={`${primaryBtn} mt-6 inline-flex`}>Back to Learn</Link>
        </main>
      </div>
    );
  }

  const recommendedGames = lesson.gameRecommendations
    .map((rec) => ({ ...rec, game: typingGames.find((g) => g.id === rec.gameId) }))
    .filter((r) => r.game);

  const practiceUrl = `/${language === "english" ? "learn/english" : "learn/khmer"}?lesson=${lessonId}`;

  return (
    <div className="min-h-screen bg-surface text-navy">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6">

        {/* Breadcrumb */}
        <nav className="mb-5 flex flex-wrap items-center gap-1.5 text-xs text-mute" aria-label="Breadcrumb">
          <Link href="/learn" className="hover:text-brand">Learn</Link>
          <span>/</span>
          <span>{language === "english" ? "English" : "ខ្មែរ Khmer"}</span>
          <span>/</span>
          <span className="font-semibold text-navy">{lesson.titleKm ?? lesson.title}</span>
        </nav>

        {/* Level + Course badge */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${levelColors[course.level]}`}>
            {levelLabels[course.level]}
          </span>
          <span className="text-xs text-mute">{course.title}</span>
          <span className="text-xs text-mute">·</span>
          <span className="text-xs text-mute">{mod.titleKm ?? mod.title}</span>
        </div>

        {/* Lesson header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            {lesson.titleKm ?? lesson.title}
          </h1>
          <span className="flex-none rounded-2xl bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 ring-1 ring-amber-200">
            +{lesson.xpReward} XP
          </span>
        </div>

        {/* Two-column layout on medium+ */}
        <div className="space-y-5">

          {/* Objectives */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-extrabold uppercase tracking-wider text-brand">Learning Objectives</h2>
            <ObjectiveList objectives={lesson.objectives} />
          </section>

          {/* Key focus */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wider text-brand">Key Focus</h2>
            <div className="flex flex-wrap gap-2">
              {lesson.keyFocus.map((k) => <KeyBadge key={k} text={k} />)}
            </div>
          </section>

          {/* Instructions */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wider text-brand">Instructions</h2>
            <p className={`text-sm leading-relaxed text-slate-700 ${language === "khmer" ? "font-khmer text-base" : ""}`}>
              {lesson.instructions}
            </p>
            {lesson.tip && (
              <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-blue-50 p-3.5">
                <span className="text-base" aria-hidden="true">💡</span>
                <p className="text-xs leading-relaxed text-blue-800">{lesson.tip}</p>
              </div>
            )}
          </section>

          {/* Completion criteria */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wider text-brand">Completion Criteria</h2>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5">
                <span className="text-xl" aria-hidden="true">🎯</span>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-mute">Min Accuracy</p>
                  <p className="text-lg font-extrabold text-navy">{lesson.completionCriteria.minAccuracy}%</p>
                </div>
              </div>
              {lesson.completionCriteria.minWpm && (
                <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5">
                  <span className="text-xl" aria-hidden="true">⚡</span>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-mute">Min WPM</p>
                    <p className="text-lg font-extrabold text-navy">{lesson.completionCriteria.minWpm}</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          <LessonStreakGuide criteria={lesson.completionCriteria} xp={lesson.xpReward} />

          {/* Practice preview */}
          {previewText && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wider text-brand">Practice Text Preview</h2>
              <p className={`text-sm leading-relaxed text-slate-500 italic ${language === "khmer" ? "font-khmer text-base not-italic" : ""}`}>
                &ldquo;{previewText}{previewText.length < (practiceLesson?.text?.length ?? 0) ? "…" : ""}&rdquo;
              </p>
              <div className="mt-4">
                <Link href={practiceUrl} className={primaryBtn}>
                  Practice This Lesson →
                </Link>
              </div>
            </section>
          )}

          {/* Recommended games */}
          {recommendedGames.length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-1 text-sm font-extrabold uppercase tracking-wider text-brand">Reinforce with a Game</h2>
              <p className="mb-4 text-xs text-mute">Play these games to practise the same skills in an interactive format.</p>
              <div className="space-y-3">
                {recommendedGames.map(({ gameId, reason, game }) => (
                  <div key={gameId} className="flex items-center gap-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                    <div className={`h-16 w-20 flex-none overflow-hidden bg-gradient-to-br ${game!.gradient}`}>
                      <GameThumb id={game!.id} />
                    </div>
                    <div className="flex-1 min-w-0 py-2 pr-2">
                      <p className="font-bold text-sm">{game!.title}</p>
                      <p className="mt-0.5 text-xs text-mute leading-snug">{reason}</p>
                    </div>
                    <Link href={game!.href} className={`${primaryBtn} mr-3 flex-none !py-2 !px-4 text-xs`}>
                      Play →
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Completion is automatic: finishing the practice within the limits above completes the lesson. */}
          <section className={`rounded-2xl border p-5 shadow-sm ${isCompleted ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"}`}>
            {isCompleted ? (
              <div className="flex items-center gap-3">
                <span className="text-3xl" aria-hidden="true">🏆</span>
                <div>
                  <p className="font-extrabold text-emerald-800">Lesson Complete!</p>
                  <p className="text-sm text-emerald-700">You earned {lesson.xpReward} XP for this lesson.</p>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="mb-1 text-sm font-extrabold uppercase tracking-wider text-brand">Complete by practising</h2>
                <p className="mb-4 text-xs text-mute">Type the whole practice text and reach the accuracy{lesson.completionCriteria.minWpm ? " and speed" : ""} above. The lesson completes by itself and you earn +{lesson.xpReward} XP. No button needed.</p>
                <Link href={practiceUrl} className={`${primaryBtn} inline-flex`}>Start practice →</Link>
              </div>
            )}
          </section>

          {/* Navigation: prev / next */}
          <nav className="flex items-center justify-between gap-3 pt-2">
            {prev ? (
              <Link href={`/learn/${language}/${prev.id}`} className={`${secondaryBtn} flex items-center gap-2 !py-2 text-xs`}>
                ← {prev.titleKm ?? prev.title}
              </Link>
            ) : (
              <Link href="/learn" className={`${secondaryBtn} !py-2 text-xs`}>← All courses</Link>
            )}
            {next && (
              <Link href={`/learn/${language}/${next.id}`} className={`${primaryBtn} flex items-center gap-2 !py-2 text-xs`}>
                {next.titleKm ?? next.title} →
              </Link>
            )}
          </nav>

        </div>
      </main>
    </div>
  );
}
