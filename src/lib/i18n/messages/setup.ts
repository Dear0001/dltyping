import type { Dict } from "../types";

/** setup: each key carries both languages side by side. English is the reference; Khmer follows docs/khmer-glossary.md. */
const messages = {
  "setup.randomArticleRecommended": { en: "🎲 Random article (recommended)", km: "🎲 អត្ថបទចៃដន្យ (ណែនាំ)" },
  "setup.orEnterYourOwn": { en: "Or enter your own", km: "ឬបញ្ចូលរយៈពេលខ្លួនឯង" },
  "setup.randomArticle": { en: "🎲 Random article", km: "🎲 អត្ថបទចៃដន្យ" },
  "setup.lessonCategory": { en: "Lesson category", km: "ប្រភេទមេរៀន" },
  "setup.randomDesc": { en: "A surprise article chosen when you press Start, long enough to fill your session at your own typing speed.", km: "អត្ថបទចៃដន្យដែលជ្រើសរើសនៅពេលអ្នកចុចចាប់ផ្តើម មានប្រវែងសមស្របនឹងរយៈពេល និងល្បឿនវាយរបស់អ្នក។" },
} satisfies Dict;
export default messages;
