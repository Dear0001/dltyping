"use client";

import { curricula, getAllLessons } from "@/data/curriculum";
import { useArcadeStore } from "@/hooks/use-arcade";
import { useUserProgress } from "@/hooks/use-stored-value";
import { useTypingProgress } from "@/hooks/useTypingProgress";
import { ACHIEVEMENTS as ARCADE_BADGES } from "@/lib/arcade/progress";
import { achievementStatuses } from "@/lib/achievements";

const LESSON_TOTALS = { english: getAllLessons(curricula.english).length, khmer: getAllLessons(curricula.khmer).length };

/** Every achievement with its live status, computed from saved data (achievements are never stored). */
export function useAchievements() {
  const progress = useUserProgress();
  const { store } = useTypingProgress();
  const arcade = useArcadeStore();
  return achievementStatuses({
    sessions: store.sessions,
    xp: progress.xp,
    completedLessons: progress.completedLessons,
    lessonTotals: LESSON_TOTALS,
    arcadeBadges: { earned: Object.keys(arcade.achievements).length, total: ARCADE_BADGES.length },
  });
}
