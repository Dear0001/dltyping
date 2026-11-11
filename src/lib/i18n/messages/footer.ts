import type { Dict } from "../types";

/** footer: each key carries both languages side by side. English is the reference; Khmer follows docs/khmer-glossary.md. */
const messages = {
  "footer.tagline": { en: "An interactive typing learning platform designed to help everyone improve their English and Khmer typing skills through structured lessons, practical exercises, and educational games.", km: "ក្រុមវេទិការៀនវាយអក្សរអន្តរកម្ម ជួយអ្នករាល់គ្នាកែលម្អជំនាញវាយអក្សរខ្មែរ និងអង់គ្លេស តាមរយៈមេរៀនមានរចនាសម្ព័ន្ធ លំហាត់ជាក់ស្តែង និងហ្គេមអប់រំ។" },
  "footer.learning": { en: "Learning", km: "ការរៀន" },
  "footer.games": { en: "Games", km: "ហ្គេម" },
  "footer.resources": { en: "Resources", km: "ធនធាន" },
  "footer.support": { en: "Support", km: "ជំនួយ" },
  "footer.english": { en: "English Typing", km: "វាយអក្សរអង់គ្លេស" },
  "footer.khmer": { en: "Khmer Typing", km: "វាយអក្សរខ្មែរ" },
  "footer.curriculum": { en: "Typing Lessons", km: "មេរៀនវាយអក្សរ" },
  "footer.library": { en: "Lesson Library", km: "បណ្ណាល័យមេរៀន" },
  "footer.quick": { en: "Quick Practice", km: "ហាត់រហ័ស" },
  "footer.allGames": { en: "All games", km: "ហ្គេមទាំងអស់" },
  "footer.howto": { en: "How to Use", km: "របៀបប្រើ" },
  "footer.qwerty": { en: "English QWERTY Layout", km: "ប្លង់ English QWERTY" },
  "footer.nida": { en: "Khmer NiDA Layout", km: "ប្លង់ខ្មែរ NiDA" },
  "footer.faq": { en: "FAQ", km: "សំណួរដែលសួរញឹកញាប់" },
  "footer.contact": { en: "Contact Us", km: "ទាក់ទងយើង" },
  "footer.feedback": { en: "Feedback", km: "មតិកែលម្អ" },
  "footer.report": { en: "Report a Problem", km: "រាយការណ៍បញ្ហា" },
  "footer.connect": { en: "Get in touch", km: "ទាក់ទងមកយើង" },
  "footer.emailAria": { en: "Email {email}", km: "ផ្ញើអ៊ីមែលទៅ {email}" },
  "footer.linkedinAria": { en: "LinkedIn profile (opens in a new tab)", km: "ប្រវត្តិរូប LinkedIn (បើកក្នុងផ្ទាំងថ្មី)" },
  "footer.githubAria": { en: "GitHub profile (opens in a new tab)", km: "ប្រវត្តិរូប GitHub (បើកក្នុងផ្ទាំងថ្មី)" },
  "footer.privacy": { en: "Privacy Policy", km: "គោលការណ៍ឯកជនភាព" },
  "footer.terms": { en: "Terms of Service", km: "លក្ខខណ្ឌប្រើប្រាស់" },
  "footer.soon": { en: "Soon", km: "ឆាប់ៗនេះ" },
  "footer.rights": { en: "All rights reserved.", km: "រក្សាសិទ្ធិគ្រប់យ៉ាង។" },
  "footer.top": { en: "Back to top", km: "ត្រឡប់ទៅលើ" },
  "footer.langs": { en: "English · ខ្មែរ", km: "English · ខ្មែរ" },
} satisfies Dict;
export default messages;
