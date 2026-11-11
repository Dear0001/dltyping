import type { Dict } from "../types";

/** common: each key carries both languages side by side. English is the reference; Khmer follows docs/khmer-glossary.md. */
const messages = {
  "common.footer": { en: "Made for steady progress", km: "បង្កើតឡើងដើម្បីរីកចម្រើនបន្តិចម្តងៗ" },
  "common.noAccount": { en: "Practice anytime · no account needed", km: "អាចហាត់បានគ្រប់ពេល · មិនចាំបាច់មានគណនី" },
  "timer.label": { en: "SESSION LENGTH", km: "រយៈពេលហាត់" },
  "category.english": { en: "English", km: "អង់គ្លេស" },
  "category.khmer": { en: "Khmer", km: "ខ្មែរ" },
  "category.englishLabel": { en: "English · QWERTY", km: "អង់គ្លេស · QWERTY" },
  "category.khmerLabel": { en: "ភាសាខ្មែរ · NiDA", km: "ភាសាខ្មែរ · NiDA" },
  "category.openAccess": { en: "starter lessons · open access", km: "មេរៀនដំបូង · អាចចូលហាត់បានដោយសេរី" },
  "keyboard.mac": { en: "MacBook keyboard", km: "ក្តារចុច MacBook" },
  "keyboard.windows": { en: "Windows keyboard", km: "ក្តារចុច Windows" },
  "keyboard.unknown": { en: "Keyboard preview adapts to your computer. You can still type with your physical keyboard.", km: "ប្លង់ក្តារចុចបង្ហាញតាមឧបករណ៍របស់អ្នក។ អ្នកអាចប្រើក្តារចុចផ្ទាល់ខ្លួនបាន។" },
  "keyboard.preview": { en: "keyboard layout preview", km: "មើលប្លង់ក្តារចុច" },
  "common.interfaceLanguage": { en: "Interface language", km: "ភាសាកម្មវិធី" },
  "share.facebook": { en: "Share on Facebook", km: "ចែករំលែកលើ Facebook" },
  "share.x": { en: "Share on X", km: "ចែករំលែកលើ X" },
  "share.linkedin": { en: "Share on LinkedIn", km: "ចែករំលែកលើ LinkedIn" },
  "share.telegram": { en: "Share on Telegram", km: "ចែករំលែកលើ Telegram" },
  "share.whatsapp": { en: "Share on WhatsApp", km: "ចែករំលែកលើ WhatsApp" },
  "share.email": { en: "Share by email", km: "ចែករំលែកតាមអ៊ីមែល" },
  "share.emailSubject": { en: "Free English and Khmer typing practice", km: "ហាត់វាយអក្សរអង់គ្លេស និងខ្មែរ ឥតគិតថ្លៃ" },
  "share.copy": { en: "Copy link", km: "ចម្លងតំណ" },
  "share.copied": { en: "Link copied ✓", km: "បានចម្លងតំណ ✓" },
  "share.copyPrompt": { en: "Copy this link", km: "សូមចម្លងតំណនេះ" },
} satisfies Dict;
export default messages;
