import { lessons } from "@/data/lessons";
import type { LessonCategory } from "@/types";

export const lessonCategories: LessonCategory[] = [
  {
    id: "english",
    name: "English",
    nativeLabel: "English · QWERTY",
    language: "english",
    sections: lessons.english,
  },
  {
    id: "khmer",
    name: "Khmer",
    nativeLabel: "ភាសាខ្មែរ · NiDA",
    language: "khmer",
    sections: lessons.khmer,
  },
];
