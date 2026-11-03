export type KeyboardLocale = "en" | "km";

const dict = {
  en: {
    keyboard: "Virtual keyboard", english: "English", khmer: "Khmer", os: "Keyboard type", auto: "Auto", mac: "Mac", windows: "Windows",
    show: "Show keyboard", hide: "Hide keyboard", settings: "Keyboard settings", size: "Size", small: "Small", medium: "Medium", large: "Large",
    tips: "Show tips", next: "Highlight next key", language: "Layout",
    descEnglish: "US QWERTY. Hold Shift or turn on Caps Lock to see capital letters and symbols.",
    descKhmer: "Khmer NiDA on QWERTY key positions. Big glyph = typed now; small corner glyph = with Shift; bottom-left letter = the English key.",
    tipEnglish: "Tip: use the opposite hand for Shift. Keep your index fingers on F and J.",
    tipKhmer: "Tip: switch your computer to the Khmer (NiDA) input method, then press the highlighted keys.",
    detected: "Detected automatically", manual: "Chosen manually", shiftNext: "Hold Shift",
    guide: "Finger guide", mode: "Guidance mode", modeLearning: "Learning", modePractice: "Practice", modeChallenge: "Challenge",
    hideHands: "Hide hands", showHands: "Show hands", showHint: "Show hint", hintsHidden: "Challenge mode: hints are hidden.",
    handsAria: "Both hands showing which finger to use", expectedKey: "Next key", fingerColors: "Finger colours",
    leftHand: "Left hand", rightHand: "Right hand", pinky: "Little", ring: "Ring", middle: "Middle", index: "Index", thumb: "Thumb",
  },
  km: {
    keyboard: "ក្តារចុចនិម្មិត", english: "អង់គ្លេស", khmer: "ខ្មែរ", os: "ប្រភេទក្តារចុច", auto: "ស្វ័យប្រវត្តិ", mac: "Mac", windows: "Windows",
    show: "បង្ហាញក្តារចុច", hide: "លាក់ក្តារចុច", settings: "ការកំណត់ក្តារចុច", size: "ទំហំ", small: "តូច", medium: "មធ្យម", large: "ធំ",
    tips: "បង្ហាញគន្លឹះ", next: "បន្លិចគ្រាប់ចុចបន្ទាប់", language: "ប្លង់",
    descEnglish: "US QWERTY។ សង្កត់ Shift ឬបើក Caps Lock ដើម្បីមើលអក្សរធំ និងនិមិត្តសញ្ញា។",
    descKhmer: "ខ្មែរ NiDA តាមទីតាំង QWERTY។ អក្សរធំ = វាយឥឡូវ; អក្សរតូចជ្រុង = ជាមួយ Shift; អក្សរខាងក្រោមឆ្វេង = គ្រាប់ចុចអង់គ្លេស។",
    tipEnglish: "គន្លឹះ៖ ប្រើដៃម្ខាងទៀតសម្រាប់ Shift។ ដាក់ម្រាមចង្អុលលើ F និង J។",
    tipKhmer: "គន្លឹះ៖ ប្តូរកុំព្យូទ័រទៅវិធីបញ្ចូលខ្មែរ (NiDA) រួចចុចគ្រាប់ដែលបានបន្លិច។",
    detected: "រកឃើញដោយស្វ័យប្រវត្តិ", manual: "ជ្រើសរើសដោយដៃ", shiftNext: "សង្កត់ Shift",
    guide: "មគ្គុទេសក៍ម្រាមដៃ", mode: "របៀបណែនាំ", modeLearning: "រៀន", modePractice: "ហាត់", modeChallenge: "ប្រកួត",
    hideHands: "លាក់ដៃ", showHands: "បង្ហាញដៃ", showHint: "បង្ហាញជំនួយ", hintsHidden: "របៀបប្រកួត៖ ជំនួយត្រូវបានលាក់។",
    handsAria: "ដៃទាំងពីរបង្ហាញម្រាមដែលត្រូវប្រើ", expectedKey: "គ្រាប់បន្ទាប់", fingerColors: "ពណ៌ម្រាមដៃ",
    leftHand: "ដៃឆ្វេង", rightHand: "ដៃស្តាំ", pinky: "តូច", ring: "នាង", middle: "កណ្តាល", index: "ចង្អុល", thumb: "មេដៃ",
  },
} as const;

export type KeyboardLabels = Record<keyof (typeof dict)["en"], string>;
export const keyboardLabels = (locale: string): KeyboardLabels => (locale === "km" ? dict.km : dict.en);
