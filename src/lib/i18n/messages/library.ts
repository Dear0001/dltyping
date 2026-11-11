import type { Dict } from "../types";

/** library: each key carries both languages side by side. English is the reference; Khmer follows docs/khmer-glossary.md. */
const messages = {
  "library.kicker": { en: "Library", km: "បណ្ណាល័យ" },
  "library.title": { en: "All lessons", km: "មេរៀនទាំងអស់" },
  "library.subtitle": { en: "Every English and Khmer lesson in one list. Search by title or key, filter by level and status, and jump straight in.", km: "មេរៀនអង់គ្លេស និងខ្មែរទាំងអស់នៅក្នុងបញ្ជីតែមួយ។ ស្វែងរកតាមចំណងជើង ឬគ្រាប់ចុច ត្រងតាមកម្រិត និងស្ថានភាព ហើយចូលរៀនបានភ្លាម។" },
  "library.search": { en: "Search lessons, courses or keys…", km: "ស្វែងរកមេរៀន កម្មវិធីសិក្សា ឬគ្រាប់ចុច…" },
  "library.searchLabel": { en: "Search lessons", km: "ស្វែងរកមេរៀន" },
  "library.sortLabel": { en: "Sort lessons", km: "តម្រៀបមេរៀន" },
  "library.sortPath": { en: "Sort: Learning path", km: "តម្រៀបតាម៖ ផ្លូវរៀន" },
  "library.sortLevel": { en: "Sort: Level", km: "តម្រៀបតាម៖ កម្រិត" },
  "library.sortXp": { en: "Sort: Most XP", km: "តម្រៀបតាម៖ XP ច្រើនបំផុត" },
  "library.sortTitle": { en: "Sort: A–Z", km: "តម្រៀបតាម៖ អក្ខរក្រម" },
  "library.allLanguages": { en: "All languages", km: "គ្រប់ភាសា" },
  "library.allLevels": { en: "All levels", km: "គ្រប់កម្រិត" },
  "library.level": { en: "Level", km: "កម្រិត" },
  "library.status": { en: "Status", km: "ស្ថានភាព" },
  "library.anyStatus": { en: "Any status", km: "គ្រប់ស្ថានភាព" },
  "library.todo": { en: "Not completed", km: "មិនទាន់បញ្ចប់" },
  "library.done": { en: "Completed", km: "បានបញ្ចប់" },
  "library.countOne": { en: "{n} lesson", km: "{n} មេរៀន" },
  "library.countMany": { en: "{n} lessons", km: "{n} មេរៀន" },
  "library.ofTotal": { en: " of {total}", km: " ក្នុងចំណោម {total}" },
  "library.clear": { en: "Clear filters", km: "សម្អាតតម្រង" },
  "library.emptyTitle": { en: "No lessons match your filters", km: "គ្មានមេរៀនត្រូវនឹងតម្រងរបស់អ្នកទេ" },
  "library.emptyText": { en: "Try a different search term or clear the filters.", km: "សូមសាកល្បងពាក្យស្វែងរកផ្សេង ឬសម្អាតតម្រង។" },
  "library.langEn": { en: "EN", km: "EN" },
  "library.langKm": { en: "KM", km: "KM" },
} satisfies Dict;
export default messages;
