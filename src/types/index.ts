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
