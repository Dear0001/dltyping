import { sentenceBanks, wordBanks } from "@/data/game-content";
import type { Language } from "@/types";

const split = (value: string) => value.split(" ");
const unique = (values: string[]) => Array.from(new Set(values));

/** Typing challenge sizes used by the arcade games. A phrase is several words typed with spaces. */
export type WordClass = "short" | "medium" | "long" | "phrase";

/**
 * Challenge text for the arcade games, by language and size. Edit these lists to
 * change what players type; the games read them through src/lib/arcade/content.ts.
 * Every Khmer glyph here must be reachable on the NiDA layout (checked by tests/arcade.test.mts).
 */
export const arcadeWords: Record<Language, Record<WordClass, string[]>> = {
  english: {
    short: unique([
      ...wordBanks.english.easy,
      ...split("arm bat cow den egg fog gum hen ink jet key log mud net oak pig rat sea toy urn van wax yak zoo aim bee cab dim elf fig gap hum ivy joy kid lap mix nod orb paw quiz rim sip tug use vow wig yam zap"),
    ]),
    medium: unique([
      ...wordBanks.english.medium,
      ...split("anchor blanket copper danger engine flight gentle harbor insect jacket kettle ladder magnet napkin object parrot quiver ribbon saddle tunnel useful velvet wizard yonder zipper breeze cactus dinner effort flower guitar hunter"),
    ]),
    long: unique([
      ...wordBanks.english.hard,
      ...split("lightning spellbound adventure backbone champion daylight elephant fireplace graceful hurricane invisible journey kingdom labyrinth midnight notebook overcome protector question rainstorm starlight thunder umbrella victory whirlwind yesterday zeppelin"),
    ]),
    phrase: [
      "type with care", "hold the line", "ride the wind", "light the fire", "stand your ground", "never give up", "aim for the stars", "strike like thunder",
      "calm and steady", "eyes on the road", "full speed ahead", "guard the gate", "break the spell", "trust your hands", "one more round", "keep the rhythm",
    ],
  },
  khmer: {
    short: unique([
      ...wordBanks.khmer.easy,
      ...split("ដី ខែ ជើង ភ្នំ មេឃ ភ្លៀង ខ្យល់ ផ្លែ ស្លឹក ឈើ ថ្ម គោ សេះ មាន់ ទា ជ្រូក ក្បាល មាត់ ខ្មៅ តុ ឡាន កង់ ទូក ព្រៃ"),
    ]),
    medium: unique([
      ...wordBanks.khmer.medium,
      ...split("សាលា ភាសា កៅអី ផ្លូវ ស្ពាន ទន្លេ សមុទ្រ ស្រុក ភូមិ ទីក្រុង ផ្សារ ពេទ្យ កសិករ ផ្កាយ ក្រហម សំណាង ចម្ការ រដូវ"),
    ]),
    long: unique([
      ...wordBanks.khmer.hard,
      ...split("សាកលវិទ្យាល័យ កុំព្យូទ័រ ទូរស័ព្ទ វប្បធម៌ ប្រវត្តិសាស្ត្រ អង្គរវត្ត បច្ចេកវិទ្យា សុខភាព សេរីភាព សន្តិភាព ការអប់រំ ចំណេះដឹង អនាគត បរិស្ថាន ព្រះអាទិត្យ ព្រះច័ន្ទ"),
    ]),
    phrase: [
      "ខ្ញុំ ស្រលាញ់ កម្ពុជា", "រៀន ភាសា ខ្មែរ", "ទៅ សាលា ជាមួយ មិត្ត", "ទឹក ទន្លេ ត្រជាក់", "ខិតខំរៀន រាល់ ថ្ងៃ", "ផ្ទះ ខ្ញុំ នៅ ភូមិ",
      "មេឃ ស្រឡះ ល្អ ណាស់", "អាន សៀវភៅ ពេល ព្រឹក", "សួស្តី មិត្តភក្តិ", "ដើរ ទៅ ផ្សារ", "ភ្លៀង ធ្លាក់ ខ្លាំង", "សុខភាព ល្អ ជា សំណាង",
    ],
  },
};

/** Full sentences, easiest first, for the games that use running text. */
export const arcadeSentences: Record<Language, { easy: string[]; medium: string[]; hard: string[] }> = sentenceBanks;
