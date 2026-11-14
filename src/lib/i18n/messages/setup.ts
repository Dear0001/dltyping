import type { Dict } from "../types";

/** setup: each key carries both languages side by side. English is the reference; Khmer follows docs/khmer-glossary.md. */
const messages = {
  "setup.randomArticleRecommended": { en: "🎲 Random article (recommended)", km: "🎲 អត្ថបទចៃដន្យ (ណែនាំ)" },
  "setup.randomArticle": { en: "🎲 Random article", km: "🎲 អត្ថបទចៃដន្យ" },
  "setup.randomDesc": { en: "A surprise article chosen when you press Start, long enough to fill your session at your own typing speed.", km: "អត្ថបទចៃដន្យដែលជ្រើសរើសនៅពេលអ្នកចុចចាប់ផ្តើម មានប្រវែងសមស្របនឹងរយៈពេល និងល្បឿនវាយរបស់អ្នក។" },
  "setup.language": { en: "Language", km: "ភាសា" },
  "setup.langEnglish": { en: "English", km: "ភាសាអង់គ្លេស" },
  "setup.langKhmer": { en: "Khmer", km: "ភាសាខ្មែរ" },
  "setup.lessonCount": { en: "{n} lessons", km: "{n} មេរៀន" },
  "setup.duration": { en: "Duration", km: "រយៈពេល" },
  "setup.customChosen": { en: "Custom length: {n} min", km: "រយៈពេលផ្ទាល់ខ្លួន៖ {n} នាទី" },
  "setup.lesson": { en: "Lesson", km: "មេរៀន" },
  "setup.advanced": { en: "Advanced settings", km: "ការកំណត់បន្ថែម" },
  "setup.advancedHint": { en: "custom length, Mac or Windows keyboard", km: "រយៈពេលផ្ទាល់ខ្លួន ក្តារចុច Mac ឬ Windows" },
  "setup.customLength": { en: "Custom length", km: "រយៈពេលផ្ទាល់ខ្លួន" },
  "setup.customPh": { en: "e.g. 7", km: "ឧ. ៧" },
  "setup.osHint": { en: "Changes the key labels around the letters (⌘ or Ctrl). Letter keys are the same.", km: "ប្តូរស្លាកគ្រាប់ចុចជុំវិញអក្សរ (⌘ ឬ Ctrl)។ គ្រាប់អក្សរនៅដដែល។" },
  "setup.ready": { en: "Your session", km: "វគ្គហាត់របស់អ្នក" },
  "setup.minutes": { en: "{n} min", km: "{n} នាទី" },
  "setup.orPress": { en: "or press", km: "ឬចុច" },
  "setup.preview": { en: "Keyboard preview", km: "មើលក្តារចុចជាមុន" },
  "setup.previewHint": { en: "See which finger presses each key before you start.", km: "មើលថាម្រាមដៃណាចុចគ្រាប់ណា មុនពេលចាប់ផ្តើម។" },
} satisfies Dict;
export default messages;
