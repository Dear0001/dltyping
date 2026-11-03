import type { Difficulty } from "@/lib/game-engine";
import type { Language } from "@/types";

const split = (value: string) => value.split(" ");

/**
 * Targets for Letter Jump. Khmer entries are whole units (a letter, a syllable
 * or a COENG cluster) that take one or more keystrokes to type.
 */
export const letterPools: Record<Language, Record<Difficulty, string[]>> = {
  english: {
    easy: split("a s d f g h j k l"),
    medium: split("a b c d e f g h i j k l m n o p q r s t u v w x y z"),
    hard: split("A B C D E F G H I J K L M N O P Q R S T U V W X Y Z 1 2 3 4 5 6 7 8 9 0 , . ; ' /"),
  },
  khmer: {
    easy: split("ក ខ ង ច ដ ថ ត ន ប ម យ រ ល ស ហ វ ផ ឆ"),
    medium: split("កា កិ កុ កេ ខា ខិ ខុ ងា ចា ចិ ដា តា តុ នា បា បុ មា មិ យា រា លា សា សុ ហា ព គ ជ ណ ទ ធ"),
    hard: split("ក្រ ក្ល ខ្ញ គ្រ ត្រ ប្រ ព្រ ស្ម ស្ក ស្ត ស្រ ម្ត ន្ទ ក្រុ ព្រះ ក្មេ ថ្ង ផ្ល ឃ្ល"),
  },
};

/** Word banks for Word Sprint. Every glyph is reachable on the NiDA layout. */
export const wordBanks: Record<Language, Record<Difficulty, string[]>> = {
  english: {
    easy: split("the and you cat dog sun run big red ten hat map pen cup sky fun win yes now top box jam kit lip owl pie rug sit tap web zip bug fan gem hop"),
    medium: split("planet window garden rhythm bridge simple travel market silver orange jungle forest thunder pencil morning kitchen purple monkey basket castle dragon island rocket yellow button candle winter summer friend"),
    hard: split("keyboard accuracy challenge adventure beautiful knowledge practice tomorrow wonderful fantastic different important mountain community discovery imagination perseverance technology celebration opportunity"),
  },
  khmer: {
    easy: split("មក ទៅ ដៃ ធំ ល្អ បាយ ចាន ទឹក ពេល មាន សាលា ភាសា ផ្កា ត្រី ឆ្មា ឆ្កែ រៀន ដើរ ពស់ ខ្ញុំ"),
    medium: split("ខ្មែរ ផ្ទះ ថ្ងៃ គ្រូ សិស្ស សត្វ ក្មេង ភ្នែក ស្មៅ ក្រុម ស្អាត ខ្លាំង សប្បាយ អាហារ ការងារ បន្ទប់ មិត្ត ម្ដាយ ឪពុក សៀវភៅ"),
    hard: split("កម្ពុជា មនុស្ស ស្រលាញ់ សួស្តី អរគុណ ប្រទេស មិត្តភក្តិ សប្បាយរីករាយ ប្រជាជន ស្រឡាញ់ ខិតខំរៀន ភ្នំពេញ សៀមរាប"),
  },
};

export type MarioLevel = { number: number; name: string; nameKm: string; blurb: string; units: string[] };

/** Mario Khmer Quest: letters -> syllables -> clusters -> words. */
export const marioLevels: MarioLevel[] = [
  { number: 1, name: "Jungle Trail", nameKm: "ផ្លូវព្រៃ", blurb: "Base consonants", units: split("ក ខ ង ច ដ ត ន ប ម យ រ ល") },
  { number: 2, name: "Lotus Pond", nameKm: "បឹងឈូក", blurb: "Consonants with vowels", units: split("កា កិ កុ កេ ខា ចិ ដុ តា នា បេ មា លា សា សុ ហា") },
  { number: 3, name: "Bamboo Bridge", nameKm: "ស្ពានឫស្សី", blurb: "Subscript clusters", units: split("ក្រ ក្ល ត្រ ប្រ ព្រ ស្ម ស្ក ស្ត ស្រ គ្រ ខ្ញ ផ្ល") },
  { number: 4, name: "Village Road", nameKm: "ផ្លូវភូមិ", blurb: "Everyday words", units: split("ទឹក ផ្ទះ ថ្ងៃ គ្រូ ត្រី ផ្កា ឆ្មា សាលា ភាសា ស្អាត សត្វ ក្មេង") },
  { number: 5, name: "Temple Gate", nameKm: "ទ្វារប្រាសាទ", blurb: "Longer words", units: split("ខ្មែរ ក្រុម សប្បាយ អាហារ ការងារ កម្ពុជា មនុស្ស សួស្តី អរគុណ ប្រទេស មិត្តភក្តិ សៀវភៅ ភ្នំពេញ ស្រលាញ់") },
];

/** English Quest: home row -> common words -> longer words -> capitals & punctuation. */
export const englishQuestLevels: MarioLevel[] = [
  { number: 1, name: "Meadow Path", nameKm: "ផ្លូវវាល", blurb: "Home row letters", units: split("a s d f j k l a s d f j k l g h") },
  { number: 2, name: "Maple Grove", nameKm: "ព្រៃម៉េផល", blurb: "All lowercase letters", units: split("q w e r t y u i o p z x c v b n m") },
  { number: 3, name: "Cedar Bridge", nameKm: "ស្ពានស៊ីដា", blurb: "Short words", units: split("sun cat dog red map pen cup sky fun win top box") },
  { number: 4, name: "Castle Road", nameKm: "ផ្លូវប្រាសាទ", blurb: "Everyday words", units: split("planet window garden bridge simple travel market silver orange jungle forest pencil") },
  { number: 5, name: "Summit Gate", nameKm: "ទ្វារកំពូល", blurb: "Capitals & long words", units: split("Keyboard Accuracy Challenge Adventure Beautiful Knowledge Practice Tomorrow Wonderful Mountain Discovery Imagination") },
];

/** Sentence banks for Sentence Rush. Khmer sentences are built from the same NiDA-reachable vocabulary as Word Sprint. */
export const sentenceBanks: Record<Language, Record<Difficulty, string[]>> = {
  english: {
    easy: [
      "The sun is big and red.", "I like my cat and dog.", "We run to the park.", "The pen is on the box.", "She has a red hat.",
      "Open the door now.", "The sky is blue today.", "Tom can hop and jump.",
    ],
    medium: [
      "The market opens early in the morning.", "She planted a garden behind the old castle.", "Our friend travels to a new island every summer.",
      "The dragon slept beside the silver bridge.", "He wrote a simple note with a pencil.", "A purple rocket flew over the quiet forest.",
      "We baked bread in the kitchen last winter.", "The monkey climbed the tallest tree in the jungle.",
    ],
    hard: [
      "Practice makes progress, so keep your fingers relaxed and your eyes on the screen.",
      "Tomorrow, we'll discover a beautiful mountain community full of wonderful stories.",
      "Accuracy matters more than speed; fast typing follows steady, careful practice.",
      "\"Challenge yourself,\" said the teacher, \"and every keyboard becomes an adventure.\"",
      "Technology is only useful when we have the knowledge and imagination to use it well.",
      "Perseverance, patience and a little curiosity turn difficult lessons into important skills.",
    ],
  },
  khmer: {
    easy: [
      "ខ្ញុំ ទៅ សាលា", "ខ្ញុំ រៀន ភាសា ខ្មែរ", "ផ្ទះ ធំ ល្អ", "ឆ្មា មាន ត្រី", "ទឹក ត្រជាក់ ណាស់", "គ្រូ មក សាលា",
    ],
    medium: [
      "សិស្ស រៀន ភាសា ខ្មែរ នៅ សាលា", "ខ្ញុំ ចូលចិត្ត អាន សៀវភៅ ថ្ងៃ នេះ", "ក្មេង ស្រី ដើរ ទៅ ផ្ទះ មិត្ត", "ម្ដាយ ធ្វើ អាហារ ឆ្ងាញ់ ណាស់", "ឪពុក ទៅ ធ្វើ ការងារ ពេល ព្រឹក", "ត្រី និង ស្មៅ នៅ ក្នុង បឹង",
    ],
    hard: [
      "ប្រទេស កម្ពុជា មាន ប្រជាជន សប្បាយរីករាយ", "ខ្ញុំ ស្រលាញ់ ភ្នំពេញ និង សៀមរាប", "មិត្តភក្តិ ខិតខំរៀន សៀវភៅ ជាមួយ គ្នា", "សួស្តី អរគុណ ដែល មក សាលា ថ្ងៃ នេះ", "គ្រូ និយាយ ថា ភាសា ខ្មែរ ស្អាត ណាស់",
    ],
  },
};
