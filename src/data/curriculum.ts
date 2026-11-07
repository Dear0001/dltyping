import type { CurriculumCourse, CurriculumLesson, CurriculumModule, LanguageCurriculum, CurriculumLevel } from "@/types";

// ─────────────────────────── English Curriculum ────────────────────────────

const engBeginnerModules: CurriculumModule[] = [
  {
    id: "eng-beg-homerow",
    title: "Home Row",
    lessons: [
      {
        id: "home-row",
        title: "Home Row Warm-Up",
        keyFocus: ["a", "s", "d", "f", "j", "k", "l", ";"],
        objectives: [
          "Place all 8 fingers on the home row keys without looking",
          "Type A S D F (left hand) and J K L ; (right hand) comfortably",
          "Return fingers to home row after every keystroke",
          "Maintain a relaxed, upright posture throughout",
        ],
        instructions:
          "Anchor your left four fingers to A S D F and right four fingers to J K L ;. Your thumbs rest on the spacebar. The small raised bumps on F and J are your reset points — whenever you feel lost, return to them. Do NOT look at your hands.",
        tip: "Accuracy beats speed at this stage. One correct key at a time builds the muscle memory that makes speed possible later.",
        gameRecommendations: [
          { gameId: "letter-jump", reason: "Drill home-row key recognition by jumping platforms — one letter at a time" },
          { gameId: "english-quest", reason: "Levels 1–2 of English Quest turn home-row letters into a platform adventure" },
        ],
        completionCriteria: { minAccuracy: 75 },
        xpReward: 50,
      },
      {
        id: "everyday",
        title: "Everyday Words",
        keyFocus: ["a", "s", "d", "f", "j", "k", "l", "space"],
        objectives: [
          "Type short, familiar words using home-row letters",
          "Maintain 80% accuracy without looking at the keyboard",
          "Develop a gentle, consistent keystroke rhythm",
        ],
        instructions:
          "Keep your eyes on the screen text, not your fingers. If you lose your place, take a breath and find the next character calmly. Hitting the right key slowly is better than hitting the wrong key quickly.",
        gameRecommendations: [
          { gameId: "letter-jump", reason: "Sharpen individual key recognition at pace" },
          { gameId: "word-sprint", reason: "Race through everyday words to build a typing flow" },
          { gameId: "english-quest", reason: "Level 3 of English Quest runs on short everyday words" },
        ],
        completionCriteria: { minAccuracy: 75 },
        xpReward: 50,
      },
    ],
  },
  {
    id: "eng-beg-passages",
    title: "First Short Passages",
    lessons: [
      {
        id: "good-sleep",
        title: "Why Sleep Matters",
        keyFocus: ["full home row", "common vowels", "period", "comma"],
        objectives: [
          "Type a multi-sentence paragraph without stopping",
          "Reach 82% accuracy on common English text",
          "Handle commas and periods without breaking rhythm",
        ],
        instructions:
          "This passage uses everyday language. Read 2–3 words ahead of where you are typing — this 'preview' is how fluent typists work. When you make a mistake, correct it and keep moving.",
        tip: "Slow is smooth. Smooth is fast. Never rush — let the rhythm build naturally.",
        gameRecommendations: [
          { gameId: "word-sprint", reason: "Build word-level speed on common English vocabulary" },
          { gameId: "sentence-rush", reason: "Type whole sentences against the clock to build flow and punctuation habits" },
        ],
        completionCriteria: { minAccuracy: 77 },
        xpReward: 50,
      },
      {
        id: "sports-day",
        title: "A Day of Sports",
        keyFocus: ["common words", "capitalization", "sentence endings"],
        objectives: [
          "Type a short story with varied sentence length",
          "Handle sentence-initial capitals with the Shift key",
          "Maintain 82% accuracy across the full passage",
        ],
        instructions:
          "Use left Shift for right-hand letters and right Shift for left-hand letters. This habit keeps one hand anchored at all times. Focus on the story — understanding the text helps predict the next word.",
        gameRecommendations: [
          { gameId: "word-sprint", reason: "Sprint through word sequences to practise reading ahead" },
          { gameId: "sentence-rush", reason: "Type whole sentences against the clock to build flow and punctuation habits" },
        ],
        completionCriteria: { minAccuracy: 77 },
        xpReward: 50,
      },
    ],
  },
];

const engBasicModules: CurriculumModule[] = [
  {
    id: "eng-bas-stories",
    title: "Short Stories",
    lessons: [
      {
        id: "old-library",
        title: "The Old Library",
        keyFocus: ["full keyboard", "apostrophe", "comma", "narrative vocabulary"],
        objectives: [
          "Type a narrative passage using the full keyboard",
          "Handle apostrophes in contractions (she's, it's, wasn't)",
          "Reach 83% accuracy across the complete text",
        ],
        instructions:
          "This story contains contractions and quoted dialogue. The apostrophe key sits just to the right of the semicolon — press it firmly with your right pinky. Read the story for enjoyment as you type; engaged readers make faster typists.",
        gameRecommendations: [
          { gameId: "word-sprint", reason: "Practice varied word lengths and narrative vocabulary at pace" },
          { gameId: "letter-jump", reason: "Keep targeting any individual keys that still feel uncertain" },
        ],
        completionCriteria: { minAccuracy: 78 },
        xpReward: 75,
      },
      {
        id: "focus",
        title: "Finding Your Focus",
        keyFocus: ["full keyboard", "motivational vocabulary", "confidence"],
        objectives: [
          "Type a complete passage with confidence across all keys",
          "Reach 85% accuracy",
          "Complete the text without taking breaks or pausing",
        ],
        instructions:
          "Let the content inspire your practice. This passage is about building confidence through small, intentional steps — which is exactly what you are doing right now. Type steadily and trust your hands.",
        tip: "Your brain is forming motor memory. Even 10 focused minutes a day creates lasting improvement.",
        gameRecommendations: [
          { gameId: "word-sprint", reason: "Test accuracy and flow on a variety of vocabulary" },
          { gameId: "english-quest", reason: "Levels 4–5 of English Quest stretch you on longer words and capitals" },
        ],
        completionCriteria: { minAccuracy: 80 },
        xpReward: 75,
      },
    ],
  },
  {
    id: "eng-bas-daily",
    title: "Daily Life",
    lessons: [
      {
        id: "saving-money",
        title: "Learning to Save Money",
        keyFocus: ["numbers as words", "colon", "full keyboard", "practical vocabulary"],
        objectives: [
          "Type a practical advice text with numbers and bullet-point style language",
          "Handle colons and semicolons in context",
          "Maintain 85% accuracy",
        ],
        instructions:
          "This text contains financial vocabulary and number words. When you encounter a longer or unfamiliar word, slow down by one beat — accuracy matters more than unbroken speed.",
        gameRecommendations: [
          { gameId: "word-sprint", reason: "Build speed on longer English vocabulary words" },
          { gameId: "sentence-rush", reason: "Type whole sentences against the clock to build flow and punctuation habits" },
        ],
        completionCriteria: { minAccuracy: 80 },
        xpReward: 75,
      },
    ],
  },
];

const engIntermediateModules: CurriculumModule[] = [
  {
    id: "eng-int-nature",
    title: "Nature & Life",
    lessons: [
      {
        id: "river-journey",
        title: "The Journey of a River",
        keyFocus: ["sustained flow", "long sentences", "geographic vocabulary"],
        objectives: [
          "Type a 200-word passage without stopping mid-sentence",
          "Reach 85% accuracy on extended descriptive text",
          "Maintain a consistent rhythm across multiple paragraphs",
        ],
        instructions:
          "The goal is unbroken flow. Do not pause after a mistake — correct it and continue. Your reading eye should always be 3–4 words ahead of your typing fingers.",
        tip: "Breathe naturally as you type. Tension in the shoulders and neck slows your fingers.",
        gameRecommendations: [
          { gameId: "word-sprint", reason: "Build the stamina to maintain word-level speed through long sequences" },
          { gameId: "sentence-rush", reason: "Type whole sentences against the clock to build flow and punctuation habits" },
        ],
        completionCriteria: { minAccuracy: 80, minWpm: 16 },
        xpReward: 100,
      },
      {
        id: "rice-season",
        title: "From Seed to Rice",
        keyFocus: ["agricultural vocabulary", "narrative sequencing", "3-minute endurance"],
        objectives: [
          "Type a 3-minute passage at a consistent pace",
          "Maintain 85% accuracy on unfamiliar vocabulary",
          "Build endurance for sustained typing sessions",
        ],
        instructions:
          "This narrative describes farming in sequence. Reading for meaning helps your brain anticipate the next word, which naturally speeds up your typing. Keep your eyes moving forward, never backward.",
        gameRecommendations: [
          { gameId: "word-sprint", reason: "Strengthen word-level accuracy on varied vocabulary" },
          { gameId: "sentence-rush", reason: "Type whole sentences against the clock to build flow and punctuation habits" },
        ],
        completionCriteria: { minAccuracy: 80, minWpm: 18 },
        xpReward: 100,
      },
      {
        id: "honey-bees",
        title: "The Life of Honey Bees",
        keyFocus: ["scientific vocabulary", "long words", "hyphenated compounds"],
        objectives: [
          "Type scientific and multi-syllable words accurately",
          "Reach 87% accuracy on a 4-minute text",
          "Handle hyphenated compound words without losing rhythm",
        ],
        instructions:
          "When you encounter a long or scientific word, slow down slightly — precision over panic. After you type it correctly, your brain logs the pattern and the next occurrence will feel easier.",
        gameRecommendations: [
          { gameId: "word-sprint", reason: "Practice medium-difficulty vocabulary at increasing speed" },
          { gameId: "sentence-rush", reason: "Type whole sentences against the clock to build flow and punctuation habits" },
        ],
        completionCriteria: { minAccuracy: 82, minWpm: 20 },
        xpReward: 100,
      },
    ],
  },
  {
    id: "eng-int-people",
    title: "People & Places",
    lessons: [
      {
        id: "lighthouse",
        title: "The Lighthouse Keeper",
        keyFocus: ["lyrical vocabulary", "colons", "descriptive verbs"],
        objectives: [
          "Type vivid descriptive prose with 87% accuracy",
          "Maintain a WPM of 25 or above",
          "Handle colons and varied punctuation naturally",
        ],
        instructions:
          "This passage has a lyrical, steady rhythm. Let the text's pace guide you — typing has its own music, and learning to feel it is what separates good typists from great ones.",
        tip: "The best typing speed is the one that keeps accuracy high. Speed without accuracy wastes more time than slow but correct typing.",
        gameRecommendations: [
          { gameId: "word-sprint", reason: "Push your word speed to match the passage's natural rhythm" },
          { gameId: "sentence-rush", reason: "Type whole sentences against the clock to build flow and punctuation habits" },
        ],
        completionCriteria: { minAccuracy: 82, minWpm: 20 },
        xpReward: 100,
      },
    ],
  },
];

const engAdvancedModules: CurriculumModule[] = [
  {
    id: "eng-adv-analytical",
    title: "Analytical Writing",
    lessons: [
      {
        id: "keeping-focus",
        title: "How to Keep Your Focus",
        keyFocus: ["professional vocabulary", "em-dash", "complex punctuation"],
        objectives: [
          "Type analytical instructional prose with 90% accuracy",
          "Reach 30 WPM on sustained professional-register text",
          "Handle em-dashes and complex sentence structures without pausing",
        ],
        instructions:
          "This instructional text demands precision. Aim for complete, error-free sentences. If a sentence is long, keep reading ahead — trusting the next few words, not just the next letter.",
        tip: "Identify your 2–3 most-mistyped keys and drill them specifically with Letter Jump. One targeted session per problem key can eliminate a long-standing habit.",
        gameRecommendations: [
          { gameId: "word-sprint", reason: "Build professional-grade typing speed and consistency" },
          { gameId: "letter-jump", reason: "Eliminate persistent problem keys with targeted one-letter practice" },
        ],
        completionCriteria: { minAccuracy: 85, minWpm: 24 },
        xpReward: 150,
      },
      {
        id: "city-at-night",
        title: "The City at Night",
        keyFocus: ["poetic vocabulary", "semicolons", "rich description"],
        objectives: [
          "Type poetic, rich language with 90% accuracy",
          "Maintain 30+ WPM on a 4-minute descriptive passage",
          "Handle semicolons and complex sentence structures",
        ],
        instructions:
          "This evocative text uses sensory language and uncommon words. Read each sentence as a unit of meaning, not a string of individual letters. Meaning-first reading is the hallmark of expert-level typing.",
        gameRecommendations: [
          { gameId: "word-sprint", reason: "Challenge yourself on advanced English vocabulary at pace" },
          { gameId: "sentence-rush", reason: "Type whole sentences against the clock to build flow and punctuation habits" },
        ],
        completionCriteria: { minAccuracy: 85, minWpm: 24 },
        xpReward: 150,
      },
    ],
  },
];

const engExpertModules: CurriculumModule[] = [
  {
    id: "eng-exp-speed",
    title: "Speed & Endurance",
    lessons: [
      {
        id: "focus-sprint",
        title: "Focus Sprint — Expert",
        keyFocus: ["speed", "sustained accuracy", "endurance"],
        objectives: [
          "Type the passage at 40+ WPM with 92%+ accuracy",
          "Maintain that pace for the full duration without slowing",
          "Demonstrate automatic, effortless key recall",
        ],
        instructions:
          "You have seen this text in Advanced. Now target 40 WPM. Your fingers know the words — give them permission to move freely. Do not second-guess; commit to each keystroke and recover cleanly from any error.",
        tip: "True speed comes from relaxation, not effort. Tense fingers are slow fingers.",
        gameRecommendations: [
          { gameId: "word-sprint", reason: "Play on Hard difficulty to match expert-level typing pace" },
          { gameId: "sentence-rush", reason: "Type whole sentences against the clock to build flow and punctuation habits" },
        ],
        completionCriteria: { minAccuracy: 87, minWpm: 32 },
        xpReward: 200,
      },
    ],
  },
];

// ─────────────────────────── Khmer Curriculum ──────────────────────────────

const khmBeginnerModules: CurriculumModule[] = [
  {
    id: "khm-beg-consonants",
    titleKm: "ព្យញ្ជនៈ",
    title: "Consonants",
    lessons: [
      {
        id: "khmer-basics",
        title: "Base Consonants",
        titleKm: "ព្យញ្ជនៈមូលដ្ឋាន",
        keyFocus: ["ក", "ខ", "គ", "ឃ", "ង", "ច", "ជ", "ន", "ប", "ម", "យ", "រ", "ល", "ស", "ហ"],
        objectives: [
          "Locate and type the 15 most common Khmer base consonants on the NiDA keyboard",
          "Understand that Khmer letters map directly to NiDA keyboard positions",
          "Switch your device input to Khmer NiDA before starting",
          "Type each consonant accurately without looking at the keyboard",
        ],
        instructions:
          "Before typing, switch your system input source to Khmer NiDA. On Windows: Win + Space → select Khmer (NiDA). On Mac: Ctrl + Space to cycle sources. Type each consonant shown — no vowels or clusters yet. Focus on key position, one character at a time.",
        tip: "The NiDA layout places common consonants on the same rows as their frequency suggests. Learning the layout by feel takes time — be patient.",
        gameRecommendations: [
          { gameId: "mario-khmer-quest", reason: "Level 1 of Mario Khmer Quest focuses entirely on base consonants" },
          { gameId: "letter-jump", reason: "Drill individual Khmer character recognition in an engaging jump format" },
        ],
        completionCriteria: { minAccuracy: 73 },
        xpReward: 50,
      },
      {
        id: "khmer-words",
        title: "Everyday Words",
        titleKm: "ពាក្យប្រចាំថ្ងៃ",
        keyFocus: ["base consonants", "spaces between words", "sentence endings"],
        objectives: [
          "Type short Khmer sentences using base consonants",
          "Insert spaces between words correctly",
          "Maintain 80% accuracy on simple Khmer text",
        ],
        instructions:
          "This passage uses only base consonants and basic vowels. Type each word, then press Space. Do not rush — one correct cluster at a time builds the foundation for everything that follows.",
        gameRecommendations: [
          { gameId: "mario-khmer-quest", reason: "Explore consonants and simple syllables with a guided adventure" },
          { gameId: "word-sprint", reason: "Build speed on short Khmer words" },
        ],
        completionCriteria: { minAccuracy: 75 },
        xpReward: 50,
      },
    ],
  },
  {
    id: "khm-beg-daily",
    title: "Daily Life",
    titleKm: "ជីវិតប្រចាំថ្ងៃ",
    lessons: [
      {
        id: "school-life",
        title: "Life at School",
        titleKm: "ជីវិតនៅសាលា",
        keyFocus: ["everyday vocabulary", "simple sentences", "dependent vowels"],
        objectives: [
          "Type a short story about school life",
          "Handle dependent vowels attached to consonants",
          "Reach 80% accuracy on 3-minute simple text",
        ],
        instructions:
          "This passage describes a typical school day. Many words use vowels you may not have drilled yet — stay calm, refer to the on-screen keyboard if needed, and keep typing forward.",
        gameRecommendations: [
          { gameId: "word-sprint", reason: "Build speed on everyday Khmer school vocabulary" },
          { gameId: "sentence-rush", reason: "Type whole sentences against the clock to build flow and punctuation habits" },
        ],
        completionCriteria: { minAccuracy: 75 },
        xpReward: 50,
      },
      {
        id: "my-family",
        title: "My Family",
        titleKm: "គ្រួសាររបស់ខ្ញុំ",
        keyFocus: ["family vocabulary", "sentences with connectors", "common suffixes"],
        objectives: [
          "Type sentences about family relationships",
          "Handle nh, nh and connective words",
          "Maintain 80% accuracy",
        ],
        instructions:
          "Family vocabulary involves common, often-repeated words. Use this familiarity as an advantage — the more you've seen a word, the faster your fingers will type it. Focus on keeping both hands in the right zones.",
        gameRecommendations: [
          { gameId: "word-sprint", reason: "Practise common Khmer family words at pace" },
          { gameId: "sentence-rush", reason: "Type whole sentences against the clock to build flow and punctuation habits" },
        ],
        completionCriteria: { minAccuracy: 75 },
        xpReward: 50,
      },
      {
        id: "healthy-life",
        title: "Healthy Living",
        titleKm: "សុខភាពល្អ",
        keyFocus: ["health vocabulary", "imperatives", "compound words"],
        objectives: [
          "Type health-related Khmer vocabulary confidently",
          "Handle imperative sentence forms",
          "Reach 82% accuracy on a 3-minute passage",
        ],
        instructions:
          "Health vocabulary repeats common root words. Each time you type a familiar cluster your speed increases a little. Track your accuracy — 82% is the target to complete this lesson.",
        gameRecommendations: [
          { gameId: "word-sprint", reason: "Strengthen speed on health and lifestyle vocabulary" },
          { gameId: "sentence-rush", reason: "Type whole sentences against the clock to build flow and punctuation habits" },
        ],
        completionCriteria: { minAccuracy: 77 },
        xpReward: 50,
      },
    ],
  },
];

const khmBasicModules: CurriculumModule[] = [
  {
    id: "khm-bas-stories",
    title: "Short Stories",
    titleKm: "រឿងខ្លី",
    lessons: [
      {
        id: "khmer-story",
        title: "A Short Story",
        titleKm: "រឿងខ្លី",
        keyFocus: ["narrative sentences", "morning vocabulary", "descriptive adjectives"],
        objectives: [
          "Type a narrative morning scene confidently",
          "Handle descriptive Khmer adjectives",
          "Maintain 82% accuracy on a 2-minute story",
        ],
        instructions:
          "Short narrative passages are an excellent way to train your eye to predict the next word. Read the meaning, not just individual characters — Khmer script has natural syllable boundaries that your eye will learn to recognise.",
        gameRecommendations: [
          { gameId: "word-sprint", reason: "Build narrative vocabulary speed" },
          { gameId: "mario-khmer-quest", reason: "Level 2 and 3 cover syllables you will encounter here" },
        ],
        completionCriteria: { minAccuracy: 77 },
        xpReward: 75,
      },
      {
        id: "mekong",
        title: "The Mekong River",
        titleKm: "ទន្លេមេគង្គ",
        keyFocus: ["geographic vocabulary", "river", "longer sentences"],
        objectives: [
          "Type a 3-minute geographic and cultural passage",
          "Handle longer, multi-clause sentences",
          "Reach 82% accuracy",
        ],
        instructions:
          "This passage about the Mekong River uses geographic and nature vocabulary. Some words are long compound nouns — type them one syllable-cluster at a time rather than one keystroke at a time.",
        tip: "Khmer syllable clusters are the natural unit of typing. Identify the cluster, then type its keystrokes.",
        gameRecommendations: [
          { gameId: "mario-khmer-quest", reason: "Levels 3–4 drill the subscript clusters you'll encounter here" },
          { gameId: "word-sprint", reason: "Race through Khmer words to build typing flow" },
          { gameId: "sentence-rush", reason: "Chain full sentences to practise reading ahead" },
        ],
        completionCriteria: { minAccuracy: 77, minWpm: 10 },
        xpReward: 75,
      },
      {
        id: "rice-farmer",
        title: "Rice and the Farmer",
        titleKm: "ស្រូវ និងកសិករ",
        keyFocus: ["farming vocabulary", "subscript consonants", "compound nouns"],
        objectives: [
          "Type agricultural vocabulary including subscript clusters",
          "Maintain 83% accuracy on a 3-minute passage",
          "Build confidence with COENG-based subscript typing",
        ],
        instructions:
          "Farming vocabulary introduces many subscript clusters (COENG + consonant). The COENG key (្) connects two consonants into one cluster. Type: consonant → COENG → subscript consonant. Practice this pattern slowly until it becomes automatic.",
        gameRecommendations: [
          { gameId: "mario-khmer-quest", reason: "Level 3 is specifically designed for subscript cluster practice" },
          { gameId: "word-sprint", reason: "Drill agricultural words at speed" },
        ],
        completionCriteria: { minAccuracy: 78, minWpm: 10 },
        xpReward: 75,
      },
    ],
  },
];

const khmIntermediateModules: CurriculumModule[] = [
  {
    id: "khm-int-culture",
    title: "Culture & Cambodia",
    titleKm: "វប្បធម៌ និងកម្ពុជា",
    lessons: [
      {
        id: "angkor-wat",
        title: "Angkor Wat",
        titleKm: "ប្រាសាទអង្គរវត្ត",
        keyFocus: ["historical vocabulary", "passive structures", "longer clauses"],
        objectives: [
          "Type a cultural passage about Cambodian heritage",
          "Handle historical and descriptive vocabulary",
          "Reach 83% accuracy on a 4-minute text",
        ],
        instructions:
          "This passage describes Cambodia's most famous temple. Cultural writing uses formal vocabulary — stay calm when you encounter unfamiliar words and type them cluster by cluster.",
        gameRecommendations: [
          { gameId: "mario-khmer-quest", reason: "Level 5 — Temple Gate — is thematically aligned with this lesson" },
          { gameId: "word-sprint", reason: "Strengthen speed on cultural and formal Khmer vocabulary" },
        ],
        completionCriteria: { minAccuracy: 78, minWpm: 11 },
        xpReward: 100,
      },
      {
        id: "morning-market",
        title: "The Morning Market",
        titleKm: "ផ្សារព្រឹក",
        keyFocus: ["commerce vocabulary", "sensory descriptions", "conversational tone"],
        objectives: [
          "Type a descriptive scene with market vocabulary",
          "Handle a conversational, informal Khmer register",
          "Maintain 83% accuracy on a 4-minute passage",
        ],
        instructions:
          "Market scenes use sensory verbs and informal speech patterns. The vocabulary is familiar and repetitive — use that to build speed. Read the visual scene as you type and let meaning drive prediction.",
        gameRecommendations: [
          { gameId: "word-sprint", reason: "Build speed on everyday market vocabulary" },
          { gameId: "mario-khmer-quest", reason: "Levels 4–5 cover the word-level vocabulary used here" },
          { gameId: "sentence-rush", reason: "Chain full sentences to practise reading ahead" },
        ],
        completionCriteria: { minAccuracy: 78, minWpm: 12 },
        xpReward: 100,
      },
      {
        id: "forest",
        title: "Forest and Wildlife",
        titleKm: "ព្រៃឈើ និងសត្វព្រៃ",
        keyFocus: ["environmental vocabulary", "complex compound sentences"],
        objectives: [
          "Type environmental and nature vocabulary with 85% accuracy",
          "Handle compound-complex Khmer sentences",
          "Maintain 15+ WPM",
        ],
        instructions:
          "Environmental writing uses more formal register and compound sentences. Break each long sentence at its clause boundary to find natural pauses. Keep your reading eye ahead of your typing position.",
        gameRecommendations: [
          { gameId: "word-sprint", reason: "Drill environmental vocabulary at pace" },
          { gameId: "sentence-rush", reason: "Type whole sentences against the clock to build flow and punctuation habits" },
        ],
        completionCriteria: { minAccuracy: 80, minWpm: 12 },
        xpReward: 100,
      },
    ],
  },
];

const khmAdvancedModules: CurriculumModule[] = [
  {
    id: "khm-adv-modern",
    title: "Modern Cambodia",
    titleKm: "កម្ពុជាទំនើប",
    lessons: [
      {
        id: "climate",
        title: "Cambodia's Climate",
        titleKm: "អាកាសធាតុកម្ពុជា",
        keyFocus: ["technical vocabulary", "seasonal terminology", "formal register"],
        objectives: [
          "Type a technical geography and climate passage with 87% accuracy",
          "Handle formal Khmer register and technical terminology",
          "Reach 17+ WPM on a 4-minute text",
        ],
        instructions:
          "Climate writing uses specific technical terms and formal sentence structures. When you encounter a long technical word, type each of its clusters methodically rather than rushing through it.",
        tip: "Formal Khmer often has predictable sentence patterns. Once you recognise them, your fingers will start anticipating the next word automatically.",
        gameRecommendations: [
          { gameId: "word-sprint", reason: "Build pace on technical Khmer vocabulary under time pressure" },
          { gameId: "sentence-rush", reason: "Type whole sentences against the clock to build flow and punctuation habits" },
        ],
        completionCriteria: { minAccuracy: 82, minWpm: 14 },
        xpReward: 150,
      },
      {
        id: "technology",
        title: "Technology and Typing",
        titleKm: "បច្ចេកវិទ្យា និងការវាយអក្សរ",
        keyFocus: ["technology vocabulary", "English loanwords in Khmer context", "mixed-register sentences"],
        objectives: [
          "Type a technology passage with 87% accuracy",
          "Handle mixed-register writing that includes borrowed vocabulary",
          "Maintain 18+ WPM on a 4-minute text",
        ],
        instructions:
          "Technology vocabulary sometimes blends Khmer with transliterated English terms. Expect this mix — type each word as a complete unit. This passage is directly relevant to what you are doing right now: typing practice.",
        gameRecommendations: [
          { gameId: "word-sprint", reason: "Challenge yourself on advanced Khmer technology vocabulary" },
          { gameId: "sentence-rush", reason: "Type whole sentences against the clock to build flow and punctuation habits" },
        ],
        completionCriteria: { minAccuracy: 82, minWpm: 14 },
        xpReward: 150,
      },
    ],
  },
];

// ─────────────────────────── Assembled courses ─────────────────────────────

export const englishCurriculum: LanguageCurriculum = {
  language: "english",
  courses: [
    {
      id: "eng-beginner",
      level: "beginner",
      title: "Keyboard Foundations",
      description: "Learn home-row positions, finger placement, and build your first muscle memory.",
      emoji: "⌨️",
      gradient: "from-sky-400 to-blue-600",
      modules: engBeginnerModules,
    },
    {
      id: "eng-basic",
      level: "basic",
      title: "Building Momentum",
      description: "Extend your reach across the full keyboard and start typing purposeful text.",
      emoji: "🚀",
      gradient: "from-blue-500 to-indigo-600",
      modules: engBasicModules,
    },
    {
      id: "eng-intermediate",
      level: "intermediate",
      title: "Fluency in Motion",
      description: "Type longer, richer passages with consistent accuracy and rising speed.",
      emoji: "🌊",
      gradient: "from-indigo-500 to-purple-600",
      modules: engIntermediateModules,
    },
    {
      id: "eng-advanced",
      level: "advanced",
      title: "Professional Precision",
      description: "Master analytical writing, complex punctuation, and high-accuracy targets.",
      emoji: "🎯",
      gradient: "from-purple-500 to-rose-500",
      modules: engAdvancedModules,
    },
    {
      id: "eng-expert",
      level: "expert",
      title: "Speed & Mastery",
      description: "Elite challenges that push your speed and stamina to the limit.",
      emoji: "⚡",
      gradient: "from-rose-500 to-orange-500",
      modules: engExpertModules,
    },
  ],
};

export const khmerCurriculum: LanguageCurriculum = {
  language: "khmer",
  courses: [
    {
      id: "khm-beginner",
      level: "beginner",
      title: "NiDA Keyboard Basics",
      description: "Learn the Khmer NiDA keyboard layout, base consonants, and simple words.",
      emoji: "ក",
      gradient: "from-emerald-400 to-teal-600",
      modules: khmBeginnerModules,
    },
    {
      id: "khm-basic",
      level: "basic",
      title: "Words & Short Stories",
      description: "Build vocabulary through short passages and introduce subscript clusters.",
      emoji: "📖",
      gradient: "from-teal-500 to-cyan-600",
      modules: khmBasicModules,
    },
    {
      id: "khm-intermediate",
      level: "intermediate",
      title: "Culture & Cambodia",
      description: "Type meaningful passages about Cambodian culture, nature, and daily life.",
      emoji: "🏛️",
      gradient: "from-cyan-500 to-blue-600",
      modules: khmIntermediateModules,
    },
    {
      id: "khm-advanced",
      level: "advanced",
      title: "Modern & Formal Khmer",
      description: "Master formal register, technical vocabulary, and advanced sentence structures.",
      emoji: "🌐",
      gradient: "from-blue-500 to-indigo-600",
      modules: khmAdvancedModules,
    },
  ],
};

export const curricula: Record<string, LanguageCurriculum> = {
  english: englishCurriculum,
  khmer: khmerCurriculum,
};

// ─────────────────────── Utility helpers ───────────────────────────────────

export function getAllLessons(curriculum: LanguageCurriculum): CurriculumLesson[] {
  return curriculum.courses.flatMap((c) => c.modules.flatMap((m) => m.lessons));
}

export function findLesson(curriculum: LanguageCurriculum, lessonId: string): CurriculumLesson | undefined {
  for (const course of curriculum.courses) {
    for (const mod of course.modules) {
      const found = mod.lessons.find((l) => l.id === lessonId);
      if (found) return found;
    }
  }
  return undefined;
}

export function findLessonCourse(curriculum: LanguageCurriculum, lessonId: string): CurriculumCourse | undefined {
  for (const course of curriculum.courses) {
    for (const mod of course.modules) {
      if (mod.lessons.some((l) => l.id === lessonId)) return course;
    }
  }
  return undefined;
}

export function findLessonModule(curriculum: LanguageCurriculum, lessonId: string): CurriculumModule | undefined {
  for (const course of curriculum.courses) {
    for (const mod of course.modules) {
      if (mod.lessons.some((l) => l.id === lessonId)) return mod;
    }
  }
  return undefined;
}

export function nextLesson(curriculum: LanguageCurriculum, lessonId: string): CurriculumLesson | undefined {
  const all = getAllLessons(curriculum);
  const idx = all.findIndex((l) => l.id === lessonId);
  return idx >= 0 ? all[idx + 1] : undefined;
}

export function prevLesson(curriculum: LanguageCurriculum, lessonId: string): CurriculumLesson | undefined {
  const all = getAllLessons(curriculum);
  const idx = all.findIndex((l) => l.id === lessonId);
  return idx > 0 ? all[idx - 1] : undefined;
}

/** First lesson in path order the learner has not completed yet, or undefined when all are done. */
export function firstIncompleteLesson(curriculum: LanguageCurriculum, completedLessons: Record<string, boolean>) {
  for (const course of curriculum.courses) {
    for (const mod of course.modules) {
      for (const lesson of mod.lessons) {
        if (!completedLessons[`${curriculum.language}:${lesson.id}`]) return { lesson, course, module: mod };
      }
    }
  }
  return undefined;
}

export function courseProgress(course: CurriculumCourse, completedLessons: Record<string, boolean>, language: string) {
  const lessons = course.modules.flatMap((m) => m.lessons);
  const done = lessons.filter((l) => completedLessons[`${language}:${l.id}`]).length;
  return { done, total: lessons.length };
}

export const levelLabels: Record<CurriculumLevel, string> = {
  beginner: "Beginner",
  basic: "Basic",
  intermediate: "Intermediate",
  advanced: "Advanced",
  expert: "Expert",
};

export const levelColors: Record<CurriculumLevel, string> = {
  beginner: "bg-sky-100 text-sky-800",
  basic: "bg-blue-100 text-blue-800",
  intermediate: "bg-indigo-100 text-indigo-800",
  advanced: "bg-purple-100 text-purple-800",
  expert: "bg-rose-100 text-rose-800",
};
