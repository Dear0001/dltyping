import type { Language } from "@/types";

/**
 * Word lists for Typing Space Shooter, by language and category. Edit these to
 * change what players type; words are sorted into short / medium / long by the
 * number of keystrokes (src/lib/arcade/space-content.ts), and entries with a
 * space are phrases. Khmer entries are everyday Khmer terms, not word-for-word
 * translations of the English lists. No digits: 1-3 are power-up keys.
 * Every glyph must be reachable on its keyboard layout (checked by tests/space.test.mts).
 */
export const SPACE_CATEGORIES = ["space", "astronomy", "science", "technology", "advanced", "sentences"] as const;
export type SpaceCategory = (typeof SPACE_CATEGORIES)[number];

const w = (value: string) => value.split(" ");

export const spaceVocabulary: Record<Language, Record<SpaceCategory, string[]>> = {
  english: {
    space: w("sun star moon sky orbit comet laser rocket planet galaxy nebula meteor shuttle launch cosmos lunar solar alien beam void warp radar hull pilot fleet orbiter asteroid spaceship universe satellite astronaut starship blackhole spacewalk"),
    astronomy: w("mars venus earth pluto saturn jupiter neptune mercury uranus aurora crater zenith eclipse horizon equinox gravity stellar quasar pulsar telescope supernova starlight moonlight constellation observatory"),
    science: w("atom cell wave mass heat ion proton neutron electron energy element fusion particle magnetic velocity molecule experiment laboratory momentum radiation"),
    technology: w("chip code data robot pixel signal sensor engine circuit network digital program computer software keyboard hardware processor algorithm navigation"),
    advanced: w("interstellar intergalactic extraterrestrial hyperdrive gravitational astronomical thermonuclear propulsion trajectory magnetosphere"),
    sentences: [
      "defend the galaxy", "lock on target", "shields at full power", "engage hyperdrive", "fire all lasers", "return to base", "the stars are bright",
      "we come in peace", "prepare for launch", "into the unknown", "hold the line pilot", "aliens on the radar", "protect the planet", "full speed ahead",
    ],
  },
  khmer: {
    space: w("ផ្កាយ ភព មេឃ ពន្លឺ គន្លង អវកាស ផែនដី ពពក ងងឹត ការពារ យានអវកាស ចក្រវាល រ៉ុក្កែត ផ្កាយរណប ឧក្កាបាត កាំរស្មី ហោះហើរ បេសកកម្ម ព្រះច័ន្ទ ព្រះអាទិត្យ កាឡាក់ស៊ី អាចម៍ផ្កាយ អ្នកអវកាស ផ្កាយដុះកន្ទុយ អាកាសយានិក"),
    astronomy: w("ភពពុធ ភពសៅរ៍ ភពសុក្រ ភពអង្គារ ភពព្រហស្បតិ៍ ពេលយប់ ពេលព្រឹក ផ្កាយព្រឹក ព្រះច័ន្ទពេញវង់ សូរ្យគ្រាស ចន្ទគ្រាស"),
    science: w("អាតូម ធាតុ កម្ដៅ ថាមពល ទំនាញ ល្បឿន ពិសោធន៍ អគ្គិសនី ម៉ាស៊ីន រូបវិទ្យា គីមីវិទ្យា វិទ្យាសាស្ត្រ"),
    technology: w("សញ្ញា វិទ្យុ រ៉ូបូត ឧបករណ៍ បណ្ដាញ អេក្រង់ ទូរស័ព្ទ កម្មវិធី ទិន្នន័យ កុំព្យូទ័រ អ៊ីនធឺណិត បច្ចេកវិទ្យា"),
    advanced: w("ប្រព័ន្ធព្រះអាទិត្យ មជ្ឈមណ្ឌលអវកាស ស្ថានីយអវកាស វិទ្យាសាស្ត្រអវកាស"),
    sentences: [
      "ការពារ ផែនដី", "ហោះ ទៅ ផ្កាយ", "យានអវកាស ហោះ លឿន", "ផ្កាយ ភ្លឺ ពេល យប់", "ការពារ កាឡាក់ស៊ី", "បាញ់ កាំរស្មី", "ត្រឡប់ ទៅ ផែនដី",
      "ព្រះច័ន្ទ ភ្លឺ ស្អាត", "បេសកកម្ម ជោគជ័យ", "ពន្លឺ ព្រះអាទិត្យ", "រៀន វិទ្យាសាស្ត្រ", "ថាមពល ព្រះអាទិត្យ", "ហោះ ឆ្ពោះ ទៅ មុខ", "ការពារ ភព របស់ យើង",
    ],
  },
};

/** Word topics a player can pick. "general" uses the everyday arcade word lists. */
export const SPACE_TOPICS = ["space", "science", "general", "mixed"] as const;
export type SpaceTopic = (typeof SPACE_TOPICS)[number];
export const TOPIC_CATEGORIES: Record<SpaceTopic, SpaceCategory[]> = {
  space: ["space", "astronomy"],
  science: ["science", "technology"],
  general: [],
  mixed: ["space", "astronomy", "science", "technology"],
};
