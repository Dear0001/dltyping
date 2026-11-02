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
