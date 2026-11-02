import type { Language, SectionData } from "@/types";

export type Lesson = SectionData;

export const lessons: Record<Language, SectionData[]> = {
  english: [
    { id: "home-row", title: "Home row warm-up", level: "Beginner", duration: "1 min", text: "A calm mind makes room for clear thoughts. Take a steady breath, find your rhythm, and let your fingers move with care. Small steps become strong habits when you practice a little every day." },
    { id: "everyday", title: "Everyday words", level: "Beginner", duration: "2 min", text: "Learning something new takes patience. Stay curious, keep showing up, and celebrate each little improvement. Progress is built one thoughtful moment at a time." },
    { id: "focus", title: "Finding your focus", level: "Intermediate", duration: "2 min", text: "The best way to build confidence is to begin. Give yourself space to make mistakes, notice what you learn, and try again with intention." },
  ],
  khmer: [
    { id: "khmer-basics", title: "ព្យញ្ជនៈមូលដ្ឋាន", level: "Beginner", duration: "1 min", text: "ក ខ គ ឃ ង ច ឆ ជ ឈ ញ ដ ឋ ឌ ឍ ណ ត ថ ទ ធ ន ប ផ ព ភ ម យ រ ល វ ស ហ ឡ អ" },
    { id: "khmer-words", title: "ពាក្យប្រចាំថ្ងៃ", level: "Beginner", duration: "2 min", text: "ការរៀនអ្វីថ្មីត្រូវការការអត់ធ្មត់។ ចាប់ផ្តើមយឺតៗ ហើយហាត់រៀនរាល់ថ្ងៃ។ ការខិតខំតូចៗនឹងនាំទៅរកភាពជោគជ័យ។" },
    { id: "khmer-story", title: "រឿងខ្លី", level: "Intermediate", duration: "2 min", text: "នៅពេលព្រឹកព្រលឹម ពន្លឺថ្ងៃចាប់ផ្តើមរះពីខាងកើត។ សត្វបក្សីច្រៀងយ៉ាងពិរោះ ហើយមនុស្សគ្រប់គ្នាចាប់ផ្តើមថ្ងៃថ្មីដោយស្នាមញញឹម។" },
  ],
};
