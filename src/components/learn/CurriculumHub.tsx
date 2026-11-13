"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StreakGuide } from "@/components/learn/StreakGuide";
import { curricula, levelColors, courseProgress, getAllLessons, firstIncompleteLesson } from "@/data/curriculum";
import { useLocale } from "@/components/shared/LocaleProvider";
import { useCurriculumText } from "@/hooks/useCurriculumText";
import { useUserProgress } from "@/hooks/use-stored-value";
import { useHydrated, useStreak, useTypingProgress } from "@/hooks/useTypingProgress";
import { useTrainingRecommendations } from "@/hooks/useTrainingRecommendations";
import { THRESHOLDS } from "@/lib/progress/training-recommendations";
import { averageWpm } from "@/lib/article-length";
import { lessons as passages } from "@/data/lessons";
import { useAccount } from "@/lib/account";
import { levelFromXp, xpForLevel } from "@/lib/local-progress";
import { Sk } from "@/components/skeleton/Skeleton";
import { Badge, Icon, PageHeader, ProgressBar, ProgressRing, Segmented, btn, cardClass, cx } from "@/components/ui/ui";
import type { CurriculumLesson, Language } from "@/types";

const LANG_CONFIG = {
  english: { icon: "Aa", tile: "bg-blue-50 text-brand", practiceHref: "/learn/english", ring: "text-brand", bar: "brand" as const },
  khmer: { icon: "ក", tile: "bg-emerald-50 text-emerald-700", practiceHref: "/learn/khmer", ring: "text-emerald-500", bar: "success" as const },
} as const;

type LessonState = "completed" | "current" | "available" | "locked";

/** Minutes to type a lesson's passage once at the learner's own average speed (a default speed until there is history). */
function useLessonMinutes(lang: Language) {
  const { store } = useTypingProgress();
  const wpm = averageWpm(store, lang);
  return (lessonId: string) => {
    const text = passages[lang].find((p) => p.id === lessonId)?.text ?? "";
    return Math.max(1, Math.round(Array.from(text).length / 5 / Math.max(wpm, 1)));
  };
}

/** Up to two suggestions for this language from the real recommendation engine; honest when there is not enough data yet. */
function LearnRecommendations({ lang }: { lang: Language }) {
  const { t } = useLocale();
  const { hydrated, recommendations } = useTrainingRecommendations();
  const { store } = useTypingProgress();
  if (!hydrated) return null;
  const mine = recommendations.filter((r) => r.language === lang).slice(0, 2);
  const sessions = store.sessions.filter((s) => s.language === lang).length;
  const name = t(`category.${lang}`);
  return (
    <section className={cx(cardClass, "mt-5 p-5")} aria-labelledby="rec-heading">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="rec-heading" className="flex items-center gap-2 text-base font-extrabold text-navy"><Icon name="target" size={18} className="text-brand" />{t("ui.learn.recTitle")}</h2>
          <p className="text-xs text-mute">{t("ui.learn.recSub", { lang: name })}</p>
        </div>
        <Link href="/dashboard/training" className="text-xs font-bold text-brand hover:underline">{t("ui.learn.recAll")} →</Link>
      </div>
      {mine.length ? (
        <ul className="mt-3 grid gap-3 md:grid-cols-2">
          {mine.map((r) => (
            <li key={r.id} className="flex flex-col gap-2 rounded-xl border border-line bg-slate-50/60 p-3.5">
              <div className="flex items-start justify-between gap-2">
                <p className="font-bold leading-snug text-navy">{r.title}</p>
                <Badge tone={r.priority === "high" ? "danger" : r.priority === "medium" ? "warning" : "brand"}>{t("ui.learn.minutes", { n: r.minutes })}</Badge>
              </div>
              <p className="text-xs leading-relaxed text-mute">{r.reason}</p>
              <div className="mt-auto flex flex-wrap gap-2 pt-1">
                {r.actions.map((a, i) => <Link key={a.href} href={a.href} className={btn(i === 0 ? "primary" : "secondary", "sm")}>{a.label}</Link>)}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 rounded-xl bg-slate-50 px-3.5 py-3 text-sm text-mute">
          {sessions < THRESHOLDS.minSessions ? t("ui.learn.recEmpty", { n: THRESHOLDS.minSessions - sessions, lang: name }) : t("ui.learn.recNone")}
        </p>
      )}
    </section>
  );
}

/** XP level, progress to the next level and streak, in one compact card. */
function LevelCard({ xp, streak }: { xp: number; streak: number }) {
  const { t } = useLocale();
  const signedIn = useAccount().status === "user";
  const level = levelFromXp(xp);
  const currentMin = xpForLevel(level);
  const nextMin = xpForLevel(level + 1);
  const pct = nextMin > currentMin ? Math.min(100, Math.round(((xp - currentMin) / (nextMin - currentMin)) * 100)) : 100;
  const title = t(`typist.${level}`) === `typist.${level}` ? t("typist.default") : t(`typist.${level}`);
  return (
    <div className={cx(cardClass, "flex flex-col gap-4 p-5")}>
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 flex-none place-items-center rounded-2xl bg-gradient-to-br from-brand to-sky-400 text-lg font-extrabold text-white shadow-sm">{level}</span>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-mute">{t("ui.home.level", { n: level })}</p>
          <p className="truncate font-extrabold text-navy">{title}</p>
        </div>
      </div>
      <div>
        <div className="mb-1.5 flex justify-between text-xs font-semibold"><span className="text-navy">{xp} XP</span><span className="text-mute">{nextMin > xp ? t("ui.learn.toNext", { n: nextMin - xp }) : t("learn.maxLevel").replace(" · ", "")}</span></div>
        <ProgressBar value={pct} tone="amber" label={`${xp} XP`} />
      </div>
      <div className="flex flex-wrap gap-2 border-t border-line pt-3">
        {signedIn
          ? <Badge tone={streak ? "warning" : "neutral"} icon="flame">{streak ? t("learn.streakDays", { n: streak }).replace("🔥 ", "") : t("ui.learn.noStreak")}</Badge>
          : <Link href="/learn#streak" className="text-xs font-semibold text-mute hover:text-brand">{t("learn.signInStreak")}</Link>}
      </div>
    </div>
  );
}

/** The big "Continue learning" card for the selected language. */
function ContinueHero({ lang, minutes }: { lang: Language; minutes: (id: string) => number }) {
  const { t } = useLocale();
  const ct = useCurriculumText();
  const progress = useUserProgress();
  const curriculum = curricula[lang];
  const all = getAllLessons(curriculum);
  const done = all.filter((l) => progress.completedLessons[`${lang}:${l.id}`]).length;
  const pct = Math.round((done / all.length) * 100);
  const next = firstIncompleteLesson(curriculum, progress.completedLessons);
  const cfg = LANG_CONFIG[lang];
  const label = t(`category.${lang}`);

  return (
    <div className={cx(cardClass, "relative overflow-hidden p-6 sm:p-7")}>
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-sky-100/70 blur-2xl" aria-hidden="true" />
      <div className="relative flex flex-wrap items-center gap-6">
        <ProgressRing value={pct} size={92} stroke={8} fillClass={cfg.ring}>
          <span><span className="block text-xl font-extrabold tabular-nums text-navy">{pct}%</span><span className="block text-[10px] font-semibold text-mute">{done}/{all.length}</span></span>
        </ProgressRing>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">{next ? t(done ? "learn.continueLabel" : "ui.learn.startHere") : t("learn.langComplete", { lang: label })}</p>
          {next ? <>
            <h2 className={cx("mt-1 text-2xl font-extrabold tracking-tight text-navy", lang === "khmer" && "font-khmer")}>{ct.lessonTitle(next.lesson)}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${levelColors[next.course.level]}`}>{ct.level(next.course.level)}</span>
              <Badge tone="warning" icon="star">+{next.lesson.xpReward} XP</Badge>
              <Badge icon="target">{next.lesson.completionCriteria.minAccuracy}%{next.lesson.completionCriteria.minWpm ? ` · ${next.lesson.completionCriteria.minWpm} WPM` : ""}</Badge>
              <Badge icon="clock">{t("ui.learn.minutes", { n: minutes(next.lesson.id) })}</Badge>
              <span className="text-xs text-mute">{ct.moduleTitle(next.module)}</span>
            </div>
          </> : <h2 className="mt-1 text-2xl font-extrabold text-navy">{t("learn.allFinished", { total: all.length })}</h2>}
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          {next && <Link href={`/learn/${lang}/${next.lesson.id}`} className={btn("primary", "lg", "flex-1 sm:flex-none")}>{t(done ? "learn.continue" : "learn.start")}<Icon name="arrow" size={18} /></Link>}
          <Link href={cfg.practiceHref} className={btn("secondary", "lg", "flex-1 sm:flex-none")}>{t("ui.home.freePractice")}</Link>
        </div>
      </div>
    </div>
  );
}

const STATE_STYLE: Record<LessonState, string> = {
  completed: "border-emerald-200 bg-emerald-50/50 hover:border-emerald-300",
  current: "border-brand bg-card ring-4 ring-brand/10 hover:shadow-[var(--shadow-md)]",
  available: "border-line bg-card hover:border-slate-300 hover:shadow-[var(--shadow-md)]",
  locked: "border-dashed border-slate-300 bg-slate-50/60 text-mute hover:border-slate-400",
};

function LessonCard({ lesson, lang, state, index, lockedHint, minutes }: { lesson: CurriculumLesson; lang: Language; state: LessonState; index: number; lockedHint: string; minutes: number }) {
  const { t } = useLocale();
  const ct = useCurriculumText();
  const marker = {
    completed: <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-emerald-500 text-white"><Icon name="check" size={18} strokeWidth={2.6} /></span>,
    current: <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-brand text-white shadow-sm shadow-brand/30"><Icon name="play" size={15} /></span>,
    available: <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-slate-100 text-sm font-extrabold text-slate-600">{index}</span>,
    locked: <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-slate-100 text-slate-400"><Icon name="lock" size={16} /></span>,
  }[state];
  const stateLabel = { completed: t("ui.learn.completed"), current: t("ui.learn.upNext"), available: t("ui.learn.available"), locked: t("ui.learn.locked") }[state];
  return (
    <Link href={`/learn/${lang}/${lesson.id}`} title={state === "locked" ? lockedHint : undefined}
      className={cx("group flex h-full items-start gap-3 rounded-xl border p-3.5 transition duration-150 hover:-translate-y-0.5", STATE_STYLE[state])}>
      {marker}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className={cx("font-bold leading-snug", state === "locked" ? "text-slate-500" : "text-navy", lang === "khmer" && "font-khmer")}>{ct.lessonTitle(lesson)}</p>
          <span className={cx("flex-none text-xs font-extrabold", state === "completed" ? "text-emerald-600" : state === "locked" ? "text-slate-400" : "text-amber-600")}>+{lesson.xpReward} XP</span>
        </div>
        <p className="mt-0.5 truncate text-xs text-mute">{lesson.keyFocus.slice(0, 4).map(ct.keyFocus).join(" · ")}{lesson.keyFocus.length > 4 ? " …" : ""}</p>
        <p className="mt-1.5 flex items-center gap-2 text-[11px] font-semibold">
          <span className={cx(state === "current" ? "text-brand" : state === "completed" ? "text-emerald-700" : "text-mute")}>{stateLabel}</span>
          <span className="text-slate-300">•</span>
          <span className="text-mute" title={t("learn.minTitle")}>{lesson.completionCriteria.minAccuracy}%{lesson.completionCriteria.minWpm ? ` · ${lesson.completionCriteria.minWpm} WPM` : ""}</span>
          <span className="text-slate-300">•</span>
          <span className="flex items-center gap-1 text-mute" title={t("ui.learn.minutesTitle")}><Icon name="clock" size={11} />{t("ui.learn.minutes", { n: minutes })}</span>
        </p>
      </div>
    </Link>
  );
}

export default function CurriculumHub() {
  const { t } = useLocale();
  const ct = useCurriculumText();
  const hydrated = useHydrated();
  const [activeLang, setActiveLang] = useState<Language>("english");
  const progress = useUserProgress();
  const streak = useStreak();
  const minutes = useLessonMinutes(activeLang);

  // The home page links to /learn?lang=khmer; read it once on the client (search params are request data).
  useEffect(() => {
    const lang = new URLSearchParams(window.location.search).get("lang");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (lang === "khmer" || lang === "english") setActiveLang(lang);
  }, []);

  const curriculum = curricula[activeLang];
  const next = firstIncompleteLesson(curriculum, progress.completedLessons);
  const currentCourseIndex = next ? curriculum.courses.findIndex((c) => c.id === next.course.id) : curriculum.courses.length;
  const cfg = LANG_CONFIG[activeLang];

  const langTab = (lang: Language) => {
    const total = getAllLessons(curricula[lang]).length;
    return <span className="flex items-center gap-2"><span className={cx("grid h-6 w-6 place-items-center rounded-md text-xs font-extrabold", LANG_CONFIG[lang].tile, lang === "khmer" && "font-khmer")}>{LANG_CONFIG[lang].icon}</span>{t(`category.${lang}`)}<span className="text-xs font-semibold text-mute">{total}</span></span>;
  };

  return (
    <div className="min-h-screen bg-surface text-navy">
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6">
        <PageHeader kicker={t("learn.kicker")} title={t("learn.title")} subtitle={t("learn.subtitle")}
          actions={<Segmented label={t("ui.learn.language")} value={activeLang} onChange={setActiveLang} options={(["english", "khmer"] as const).map((l) => ({ value: l, label: langTab(l) }))} />} />

        {/* Continue learning + level */}
        <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          {hydrated ? <ContinueHero lang={activeLang} minutes={minutes} /> : <div className={cx(cardClass, "flex items-center gap-6 p-7")}><Sk className="h-[92px] w-[92px] rounded-full" /><div className="flex-1"><Sk className="mb-3 h-3 w-32" /><Sk className="mb-3 h-7 w-2/3" /><Sk className="h-4 w-1/2" /></div></div>}
          {hydrated ? <LevelCard xp={progress.xp} streak={streak} /> : <div className={cx(cardClass, "p-5")}><Sk className="mb-4 h-12 w-40" /><Sk className="h-3 w-full" /></div>}
        </div>

        <LearnRecommendations lang={activeLang} />

        <div id="streak" className="mt-5 scroll-mt-24"><StreakGuide /></div>

        {/* Level path */}
        <section className="mt-10" aria-labelledby="path-heading">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="path-heading" className="text-xl font-extrabold tracking-tight text-navy sm:text-2xl">{t("ui.learn.pathTitle", { lang: t(`category.${activeLang}`) })}</h2>
              <p className="mt-1 text-sm text-mute">{t("ui.learn.pathSub", { levels: curriculum.courses.length, n: getAllLessons(curriculum).length })}</p>
            </div>
            <div className="flex flex-wrap gap-3 text-xs font-semibold text-mute" aria-hidden="true">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />{t("ui.learn.completed")}</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-brand" />{t("ui.learn.upNext")}</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-slate-300" />{t("ui.learn.available")}</span>
              <span className="flex items-center gap-1.5"><Icon name="lock" size={11} />{t("ui.learn.locked")}</span>
            </div>
          </div>

          <ol className="relative space-y-4 before:absolute before:bottom-6 before:left-[27px] before:top-6 before:w-0.5 before:bg-line sm:before:left-[31px]">
            {curriculum.courses.map((course, courseIndex) => {
              const { done, total } = courseProgress(course, progress.completedLessons, activeLang);
              const pct = total ? Math.round((done / total) * 100) : 0;
              const isComplete = done === total && total > 0;
              const isCurrent = hydrated && courseIndex === currentCourseIndex;
              const isLocked = hydrated && courseIndex > currentCourseIndex;
              const prevTitle = courseIndex > 0 ? ct.courseTitle(curriculum.courses[courseIndex - 1]) : "";
              let n = 0;
              return (
                <li key={`${activeLang}-${course.id}`} className="relative pl-[68px] sm:pl-20">
                  <span className={cx("absolute left-0 top-4 grid h-14 w-14 place-items-center rounded-2xl border-4 border-surface text-xl font-extrabold shadow-sm sm:h-16 sm:w-16",
                    isComplete ? "bg-emerald-500 text-white" : isCurrent ? `bg-gradient-to-br ${course.gradient} text-white` : isLocked ? "bg-slate-100 text-slate-400" : "bg-card text-navy ring-1 ring-line")} aria-hidden="true">
                    {isComplete ? <Icon name="check" size={26} strokeWidth={2.6} /> : isLocked ? <Icon name="lock" size={22} /> : <span className={course.level === "beginner" && activeLang === "khmer" ? "font-khmer" : ""}>{course.emoji}</span>}
                  </span>
                  <details open={isCurrent || undefined} className={cx(cardClass, "group overflow-hidden", isCurrent && "border-brand/40 shadow-[var(--shadow-md)]")}>
                    <summary className="flex cursor-pointer list-none items-center gap-4 p-5 hover:bg-slate-50/70 [&::-webkit-details-marker]:hidden">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-mute">{t("ui.learn.levelN", { n: courseIndex + 1 })}</span>
                          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${levelColors[course.level]}`}>{ct.level(course.level)}</span>
                          {isComplete && <Badge tone="success" icon="check">{t("ui.learn.completed")}</Badge>}
                          {isCurrent && !isComplete && <Badge tone="brand" icon="play">{t("ui.learn.current")}</Badge>}
                          {isLocked && <Badge icon="lock">{t("ui.learn.locked")}</Badge>}
                        </div>
                        <h3 className="mt-1 text-lg font-extrabold tracking-tight text-navy">{ct.courseTitle(course)}</h3>
                        <p className="mt-0.5 line-clamp-1 text-sm text-mute">{ct.courseDescription(course)}</p>
                        <div className="mt-3 flex items-center gap-3">
                          <ProgressBar value={pct} size="sm" tone={isComplete ? "success" : cfg.bar} className="max-w-xs flex-1" label={t("learn.lessonsDone", { done, total })} />
                          <span className="text-xs font-semibold tabular-nums text-mute">{t("learn.lessonsDone", { done, total })}</span>
                        </div>
                      </div>
                      <Icon name="chevron" size={20} className="text-mute transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="border-t border-line bg-slate-50/40 px-5 pb-5 pt-4">
                      {course.modules.map((mod) => (
                        <div key={mod.id} className="mb-5 last:mb-0">
                          <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-mute">{ct.moduleTitle(mod)}</p>
                          <ul className="grid gap-2.5 sm:grid-cols-2">
                            {mod.lessons.map((lesson) => {
                              n += 1;
                              const state: LessonState = progress.completedLessons[`${activeLang}:${lesson.id}`] ? "completed" : hydrated && next?.lesson.id === lesson.id ? "current" : isLocked ? "locked" : "available";
                              return <li key={lesson.id}><LessonCard lesson={lesson} lang={activeLang} state={state} index={n} lockedHint={t("ui.learn.lockedHint", { level: prevTitle })} minutes={minutes(lesson.id)} /></li>;
                            })}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </details>
                </li>
              );
            })}
          </ol>
        </section>

        {/* Footer CTA */}
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-navy p-6 text-white">
          <div>
            <p className="font-bold">{t("learn.ctaTitle")}</p>
            <p className="text-sm text-slate-300">{t("learn.ctaText")}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/learn/english" className={btn("inverse", "md")}>{t("category.english")}</Link>
            <Link href="/learn/khmer" className={btn("outlineLight", "md")}>{t("category.khmer")}</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
