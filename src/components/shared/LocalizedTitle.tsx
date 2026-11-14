"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useLocale } from "@/components/shared/LocaleProvider";
import { useCurriculumText } from "@/hooks/useCurriculumText";
import { curricula, findLesson } from "@/data/curriculum";
import { typingGames } from "@/data/games";

const SUFFIX = " — DL Typing";
/** Routes whose browser-tab title has a Khmer version (`title.<key>`). Games and lessons are resolved separately. */
const ROUTES: Record<string, string> = {
  "/": "home", "/learn": "learn", "/learn/english": "learnEn", "/learn/khmer": "learnKm", "/setup": "setup", "/test": "test", "/daily": "daily",
  "/library": "library", "/games": "games", "/progress": "progress", "/dashboard": "dashboard", "/dashboard/keyboard-mastery": "mastery",
  "/dashboard/training": "training", "/pets": "pets", "/help": "help", "/support": "support", "/support/contact": "contact",
  "/support/feedback": "feedback", "/support/report": "report", "/privacy": "privacy", "/terms": "terms",
};

/**
 * Page titles come from server metadata in English (the server cannot see the locale, which lives in
 * localStorage, and English titles serve search engines). In Khmer mode this swaps the browser-tab title on the
 * client and keeps it swapped when Next rewrites <title> on navigation; switching back restores the English title.
 */
export default function LocalizedTitle() {
  const { t, locale } = useLocale();
  const ct = useCurriculumText();
  const pathname = usePathname();

  let khmer: string | null = null;
  if (locale === "km") {
    const game = typingGames.find((g) => g.href === pathname);
    const lesson = /^\/learn\/(english|khmer)\/([^/]+)$/.exec(pathname);
    const found = lesson ? findLesson(curricula[lesson[1] as "english" | "khmer"], decodeURIComponent(lesson[2])) : undefined;
    if (game) khmer = t(`game.${game.id}.title`) + SUFFIX;
    else if (found) khmer = ct.lessonTitle(found) + SUFFIX;
    else if (ROUTES[pathname]) khmer = t(`title.${ROUTES[pathname]}`);
  }

  useEffect(() => {
    if (!khmer) return;
    let english = document.title;
    const apply = () => {
      if (document.title === khmer) return;
      english = document.title;
      document.title = khmer;
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => {
      observer.disconnect();
      if (document.title === khmer) document.title = english;
    };
  }, [khmer]);

  return null;
}
