export type Language = "english" | "khmer";

export type OSPlatform = "Windows" | "macOS" | "Unknown";

export interface SectionData {
  id: string;
  title: string;
  level: string;
  duration: string;
  text: string;
}

export interface LessonCategory {
  id: Language;
  name: string;
  nativeLabel: string;
  language: Language;
  sections: SectionData[];
}

export interface LessonConfig {
  language: Language;
  categoryId: string;
  timeLimit: number;
  activeSectionId: string;
}

// ---------- Curriculum types ----------

export type CurriculumLevel = "beginner" | "basic" | "intermediate" | "advanced" | "expert";

export type GameRecommendation = {
  gameId: string;
  reason: string;
};

export type CurriculumLesson = {
  id: string; // matches lesson ID in lessons.ts
  title: string;
  titleKm?: string;
  keyFocus: string[]; // keys or character groups being practised
  objectives: string[];
  instructions: string;
  tip?: string;
  gameRecommendations: GameRecommendation[];
  completionCriteria: {
    minAccuracy: number; // 0–100
    minWpm?: number;
  };
  xpReward: number;
};

export type CurriculumModule = {
  id: string;
  title: string;
  titleKm?: string;
  lessons: CurriculumLesson[];
};

export type CurriculumCourse = {
  id: string;
  level: CurriculumLevel;
  title: string;
  description: string;
  emoji: string;
  gradient: string; // Tailwind gradient classes
  modules: CurriculumModule[];
};

export type LanguageCurriculum = {
  language: Language;
  courses: CurriculumCourse[];
};

// ---------- Gamification ----------

export type Achievement = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  condition: (progress: UserProgressData) => boolean;
};

export type UserProgressData = {
  xp: number;
  completedLessons: Record<string, boolean>; // key = "language:lessonId"
  streak: number;
  lastActiveDate: string; // ISO date string YYYY-MM-DD
  achievements: string[]; // achievement IDs
};
