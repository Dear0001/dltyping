import type { Dict } from "../types";

/** navigation: each key carries both languages side by side. English is the reference; Khmer follows docs/khmer-glossary.md. */
const messages = {
  "nav.openMenu": { en: "Open menu", km: "បើកម៉ឺនុយ" },
  "nav.closeMenu": { en: "Close menu", km: "បិទម៉ឺនុយ" },
  "nav.theme": { en: "Color theme", km: "ពណ៌រចនាប័ទ្ម" },
  "theme.developer-blue": { en: "Developer Blue", km: "ខៀវអ្នកអភិវឌ្ឍន៍" },
  "theme.midnight-blossom": { en: "Midnight Blossom", km: "ផ្កាពាក់កណ្តាលអធ្រាត្រ" },
  "theme.ethereal-flora": { en: "Ethereal Flora", km: "ផ្កាស្រទន់" },
  "theme.velvet-petal": { en: "Velvet Petal", km: "ផ្កាក្រហមទន់" },
  "theme.dawn-peach": { en: "Dawn Peach", km: "ផ្កាព្រលឹម" },
  "theme.meadow-mint": { en: "Meadow Mint", km: "ស្មៅបៃតងស្រស់" },
  "theme.golden-hour": { en: "Golden Hour", km: "ម៉ោងមាស" },
  "theme.twilight-indigo": { en: "Twilight Indigo", km: "ពណ៌ល្ងាចស្រទន់" },
  "nav.overview": { en: "Home", km: "ទំព័រដើម" },
  "nav.learn": { en: "Learn", km: "មេរៀន" },
  "nav.practice": { en: "Practice", km: "ហាត់វាយ" },
  "nav.games": { en: "Games", km: "ហ្គេម" },
  "nav.progress": { en: "Progress", km: "វឌ្ឍនភាព" },
  "nav.dashboard": { en: "Dashboard", km: "ផ្ទាំងព័ត៌មាន" },
  "nav.pets": { en: "Pets", km: "សត្វចិញ្ចឹម" },
  "nav.library": { en: "Library", km: "បណ្ណាល័យ" },
  "nav.test": { en: "Test", km: "ធ្វើតេស្ត" },
  "nav.daily": { en: "Daily", km: "ប្រចាំថ្ងៃ" },
  "nav.guest": { en: "Guest learner", km: "អ្នកហាត់ជាភ្ញៀវ" },
  "nav.back": { en: "Back to overview", km: "ត្រឡប់ទៅទំព័រដើម" },
  "theme.auto": { en: "Auto (by time of day)", km: "ស្វ័យប្រវត្តិ (តាមម៉ោង)" },
  "theme.autoHint": { en: "Gentler on your eyes through the day: soft light themes by day, warm and dim in the evening, dark with the least blue light at night.", km: "ស្រាលភ្នែកពេញមួយថ្ងៃ៖ ពណ៌ភ្លឺទន់នៅពេលថ្ងៃ ក្តៅនិងស្រអាប់នៅពេលល្ងាច ហើយងងឹតដោយមានពន្លឺខៀវតិចបំផុតនៅពេលយប់។" },
} satisfies Dict;
export default messages;
