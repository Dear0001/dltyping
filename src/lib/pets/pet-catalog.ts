/**
 * Everything about each pet is data: art, unlock streak, personality traits and the
 * animations it supports. The behaviour engine (pet-brain) and the CSS read this, so
 * adding a pet means adding one entry here (plus an SVG in public/images).
 */
export type Rarity = "common" | "rare" | "epic" | "legendary" | "special";
export const RARITIES: Record<Rarity, { label: string; color: string; order: number }> = {
  common: { label: "Common", color: "#475569", order: 0 },
  rare: { label: "Rare", color: "#1d4ed8", order: 1 },
  epic: { label: "Epic", color: "#7c3aed", order: 2 },
  legendary: { label: "Legendary", color: "#b45309", order: 3 },
  special: { label: "Special", color: "#be185d", order: 4 },
};

export const PET_ANIMS = ["idle", "blink", "walk", "run", "jump", "sit", "sleep", "stretch", "happy", "excited", "follow", "startled", "celebrate"] as const;
export type PetAnim = (typeof PET_ANIMS)[number];

/** How the pet travels: drives the CSS body motion. */
export type Locomotion = "walk" | "hop" | "waddle" | "wobble";

/** 0 to 1 personality dials. The behaviour engine turns these into choices. */
export type PetTraits = {
  /** How readily it notices the cursor. */
  curiosity: number;
  /** Tendency to approach the cursor. */
  friendliness: number;
  /** Tendency to run from a cursor that gets close. */
  shyness: number;
  /** Jumps, zoomies and games. */
  playfulness: number;
  /** How often it wanders. */
  energy: number;
  /** How quickly it dozes off when nothing happens. */
  sleepiness: number;
};

export type ClickReaction = { anim: PetAnim; emoji: string; say?: string };
export type PetSpeech = { click: string[]; celebrate: string[]; encourage: string[]; follow: string[]; flee: string[]; wake: string[] };

export type PetDefinition = {
  id: string;
  name: string;
  /** File in public/images. */
  file: string;
  /** Hex colour swaps applied to the SVG, to make a variant from existing art. */
  palette?: Record<string, string>;
  rarity: Rarity;
  /** Consecutive practice days needed. */
  unlockStreak: number;
  tagline: string;
  personality: string;
  /** Short bullet list shown on the collection card. */
  behaviors: string[];
  locomotion: Locomotion;
  /** Walking speed in px/s. */
  speed: number;
  traits: PetTraits;
  /** Animations this pet's art supports. Others fall back (see resolveAnim). */
  anims: readonly PetAnim[];
  /** Per-pet overrides of the default fallback chain. */
  fallback?: Partial<Record<PetAnim, PetAnim>>;
  /** What it does on reaching a cursor it was following. */
  followArrive: PetAnim;
  /** How close (px) it stops to the cursor when following. */
  followDistance: number;
  /** Seconds between idle decisions. */
  idle: [min: number, max: number];
  clickReactions: ClickReaction[];
  speech: PetSpeech;
  aura?: "gold" | "stars";
};

export const PETS: readonly PetDefinition[] = [
  {
    id: "egg", name: "Starter Egg", file: "egg.svg", rarity: "common", unlockStreak: 1,
    tagline: "Your very first companion.",
    personality: "Sleepy and curious. It wobbles along slowly, naps a lot and gets startled easily.",
    behaviors: ["Wobbles instead of walking", "Naps often", "Hops when clicked"],
    locomotion: "wobble", speed: 26,
    traits: { curiosity: 0.5, friendliness: 0.5, shyness: 0.3, playfulness: 0.3, energy: 0.25, sleepiness: 0.7 },
    anims: ["idle", "blink", "walk", "jump", "sleep", "happy", "excited", "startled", "celebrate"],
    fallback: { follow: "walk", run: "walk", stretch: "happy", sit: "idle" },
    followArrive: "happy", followDistance: 50, idle: [4, 9],
    clickReactions: [
      { anim: "jump", emoji: "💛", say: "Peep!" },
      { anim: "happy", emoji: "✨", say: "Something is hatching... one day!" },
    ],
    speech: {
      click: ["Peep!", "Warm in here.", "Tap tap!"], celebrate: ["Crack! You did it!", "So proud!"], encourage: ["Keep going!", "Peep, nice try!"],
      follow: ["Wait for me!"], flee: ["Eep!"], wake: ["Yawn..."],
    },
  },
  {
    id: "cat", name: "Baby Cat", file: "cat.svg", rarity: "common", unlockStreak: 3,
    tagline: "Slow, graceful and a little bit nosy.",
    personality: "A calm cat that strolls, stretches and cleans its paws. It stalks your cursor when it feels like it.",
    behaviors: ["Stretches and sits to clean its paws", "Chases the cursor", "Jumps when clicked", "Shows hearts and paws"],
    locomotion: "walk", speed: 46,
    traits: { curiosity: 0.85, friendliness: 0.6, shyness: 0.15, playfulness: 0.7, energy: 0.45, sleepiness: 0.5 },
    anims: ["idle", "blink", "walk", "run", "jump", "sit", "sleep", "stretch", "happy", "excited", "follow", "startled", "celebrate"],
    followArrive: "sit", followDistance: 56, idle: [3, 8],
    clickReactions: [
      { anim: "jump", emoji: "🐾", say: "Mew!" },
      { anim: "happy", emoji: "❤️", say: "Purrr..." },
      { anim: "stretch", emoji: "😸" },
    ],
    speech: {
      click: ["Mew!", "Purrr...", "Pet me again?"], celebrate: ["Meow-velous!", "Purr-fect typing!"], encourage: ["You'll get it, meow.", "Nice paws on the keys!"],
      follow: ["What's that?", "Hehe, got you."], flee: ["Hiss!"], wake: ["Mrrow..."],
    },
  },
  {
    id: "puppy", name: "Baby Puppy", file: "puppy.svg", rarity: "common", unlockStreak: 7,
    tagline: "Bursting with energy and love.",
    personality: "An eager puppy that bounds after your cursor, wags constantly and gets overexcited about every win.",
    behaviors: ["Runs straight to the cursor", "Wags its tail", "Sits and tilts its head", "Cheers when you finish lessons"],
    locomotion: "walk", speed: 92,
    traits: { curiosity: 0.9, friendliness: 0.98, shyness: 0.03, playfulness: 0.9, energy: 0.85, sleepiness: 0.35 },
    anims: ["idle", "blink", "walk", "run", "jump", "sit", "sleep", "stretch", "happy", "excited", "follow", "startled", "celebrate"],
    followArrive: "excited", followDistance: 34, idle: [2, 5],
    clickReactions: [
      { anim: "excited", emoji: "❤️", say: "Woof!" },
      { anim: "jump", emoji: "🦴", say: "Play with me!" },
      { anim: "celebrate", emoji: "⭐", say: "Best day ever!" },
    ],
    speech: {
      click: ["Woof!", "Again, again!", "Hehehe!"], celebrate: ["WOOF! You did it!!", "Zoomies for you!"], encourage: ["Good human! Keep going!", "I believe in you!"],
      follow: ["I'm coming!", "Wait for me!"], flee: ["Yip!"], wake: ["Woof? Is it play time?"],
    },
  },
  {
    id: "bunny", name: "Little Bunny", file: "little-bunny.svg", rarity: "rare", unlockStreak: 14,
    tagline: "Hops about, wiggles its ears, loves a game of tag.",
    personality: "Gentle and shy. It hops everywhere, sniffs around and dashes off if your cursor comes too close, then peeks back.",
    behaviors: ["Hops instead of walking", "Wiggles its ears", "Runs away playfully", "Rests with ears down"],
    locomotion: "hop", speed: 74,
    traits: { curiosity: 0.75, friendliness: 0.3, shyness: 0.85, playfulness: 0.6, energy: 0.6, sleepiness: 0.45 },
    anims: ["idle", "blink", "walk", "run", "jump", "sit", "sleep", "happy", "excited", "follow", "startled", "celebrate"],
    followArrive: "sit", followDistance: 90, idle: [3, 7],
    clickReactions: [
      { anim: "jump", emoji: "🥕", say: "Boing!" },
      { anim: "happy", emoji: "💗", say: "*nose wiggle*" },
      { anim: "startled", emoji: "💦", say: "Eep!" },
    ],
    speech: {
      click: ["Boing!", "*nose wiggle*", "Carrot?"], celebrate: ["Hop hop hooray!", "Amazing hops, I mean typing!"], encourage: ["Little hops add up!", "You've got this!"],
      follow: ["Just peeking..."], flee: ["Eep!", "Catch me if you can!"], wake: ["*ears up*"],
    },
  },
  {
    id: "penguin", name: "Baby Penguin", file: "penguin.svg", rarity: "rare", unlockStreak: 21,
    tagline: "Waddles, slides and dances.",
    personality: "A cheerful penguin that waddles side to side, belly-slides when it's in a hurry and flaps its wings when you do well.",
    behaviors: ["Waddles from side to side", "Slides on its belly", "Flaps its wings", "Dances to celebrate"],
    locomotion: "waddle", speed: 52,
    traits: { curiosity: 0.7, friendliness: 0.65, shyness: 0.25, playfulness: 0.75, energy: 0.55, sleepiness: 0.4 },
    anims: ["idle", "blink", "walk", "run", "jump", "sleep", "stretch", "happy", "excited", "follow", "startled", "celebrate"],
    fallback: { sit: "idle" },
    followArrive: "happy", followDistance: 60, idle: [3, 7],
    clickReactions: [
      { anim: "stretch", emoji: "🐧", say: "Flap flap!" },
      { anim: "jump", emoji: "❄️", say: "Wheee!" },
      { anim: "celebrate", emoji: "🎶", say: "Penguin dance!" },
    ],
    speech: {
      click: ["Flap flap!", "Noot noot!", "Wheee!"], celebrate: ["Penguin party!", "Dance time!"], encourage: ["Waddle on, you can do it!", "Cool and steady!"],
      follow: ["Waddling over!"], flee: ["Slide away!"], wake: ["Noot?"],
    },
  },
  {
    id: "dragon", name: "Baby Dragon", file: "dragon.svg", rarity: "epic", unlockStreak: 30,
    tagline: "A rare fantasy friend with tiny wings.",
    personality: "A proud little dragon. It flaps its wings when excited, stretches like a lion and loves to show off a spark of fire.",
    behaviors: ["Flaps its wings", "Stretches wings wide", "Swishes its tail", "Puffs sparks when clicked"],
    locomotion: "walk", speed: 56,
    traits: { curiosity: 0.6, friendliness: 0.5, shyness: 0.15, playfulness: 0.55, energy: 0.5, sleepiness: 0.45 },
    anims: ["idle", "blink", "walk", "run", "jump", "sit", "sleep", "stretch", "happy", "excited", "follow", "startled", "celebrate"],
    followArrive: "sit", followDistance: 70, idle: [3, 8],
    clickReactions: [
      { anim: "stretch", emoji: "🔥", say: "Rawr!" },
      { anim: "jump", emoji: "✨", say: "Watch me fly!" },
      { anim: "happy", emoji: "💚", say: "*tiny puff of smoke*" },
    ],
    speech: {
      click: ["Rawr!", "*tiny puff of smoke*", "Mighty, right?"], celebrate: ["A dragon-sized win!", "Roar of victory!"], encourage: ["Even dragons practice.", "Breathe and keep typing."],
      follow: ["I shall inspect that."], flee: ["Hmph!"], wake: ["Rrrawr... five more minutes."],
    },
  },
  {
    id: "fox", name: "Sunset Fox", file: "fox.svg", rarity: "legendary", unlockStreak: 60,
    tagline: "Quick, clever and glowing.",
    personality: "A clever fox that keeps its distance, pounces suddenly and darts around. It plays tag better than anyone.",
    behaviors: ["Keeps a sly distance", "Pounces", "Darts around", "Golden glow"],
    locomotion: "walk", speed: 84, aura: "gold",
    traits: { curiosity: 0.9, friendliness: 0.5, shyness: 0.5, playfulness: 0.85, energy: 0.75, sleepiness: 0.3 },
    anims: ["idle", "blink", "walk", "run", "jump", "sit", "sleep", "stretch", "happy", "excited", "follow", "startled", "celebrate"],
    followArrive: "sit", followDistance: 130, idle: [2, 6],
    clickReactions: [
      { anim: "jump", emoji: "🍂", say: "Pounce!" },
      { anim: "excited", emoji: "✨", say: "Too slow!" },
      { anim: "happy", emoji: "🧡", say: "Hehe." },
    ],
    speech: {
      click: ["Pounce!", "Too slow!", "Hehe."], celebrate: ["Clever and quick, just like you!", "Legendary!"], encourage: ["A fox never gives up.", "Quick fingers, quick mind."],
      follow: ["Not too close..."], flee: ["Catch me!"], wake: ["Hm? I was only resting my eyes."],
    },
  },
  {
    id: "starlight", name: "Starlight Dragon", file: "dragon.svg", rarity: "special", unlockStreak: 100,
    tagline: "Exclusive reward for 100 days of dedication.",
    personality: "A dazzling dragon made of night sky. Calm and wise, it twinkles as it glides and cheers louder than anyone.",
    behaviors: ["Glides with a twinkling aura", "Flaps starry wings", "Exclusive 100-day reward"],
    locomotion: "walk", speed: 60, aura: "stars",
    palette: { "#2a9d8f": "#6d28d9", "#a8dadc": "#f9a8d4", "#e9c46a": "#fde047", "#264653": "#1e1b4b" },
    traits: { curiosity: 0.7, friendliness: 0.6, shyness: 0.1, playfulness: 0.6, energy: 0.5, sleepiness: 0.35 },
    anims: ["idle", "blink", "walk", "run", "jump", "sit", "sleep", "stretch", "happy", "excited", "follow", "startled", "celebrate"],
    followArrive: "sit", followDistance: 76, idle: [3, 7],
    clickReactions: [
      { anim: "stretch", emoji: "🌟", say: "Make a wish!" },
      { anim: "jump", emoji: "✨", say: "Starlight!" },
      { anim: "celebrate", emoji: "🌙", say: "100 days. Incredible." },
    ],
    speech: {
      click: ["Make a wish!", "Starlight!", "Twinkle twinkle."], celebrate: ["A star performance!", "Shine on!"], encourage: ["Every day, one more star.", "Steady as the night sky."],
      follow: ["The stars guide me."], flee: ["Whoosh!"], wake: ["Stars still out?"],
    },
  },
];

export const PET_BY_ID: Record<string, PetDefinition> = Object.fromEntries(PETS.map((p) => [p.id, p]));
export const getPet = (id: string | null | undefined): PetDefinition | null => (id ? PET_BY_ID[id] ?? null : null);

/** Where an unsupported animation falls back to. A pet's own `fallback` wins. */
const DEFAULT_FALLBACK: Record<PetAnim, PetAnim> = {
  idle: "idle", blink: "idle", walk: "idle", run: "walk", jump: "happy", sit: "idle", sleep: "idle", stretch: "idle",
  happy: "idle", excited: "happy", follow: "walk", startled: "jump", celebrate: "excited",
};

/** The animation this pet actually plays for a requested state. */
export function resolveAnim(def: PetDefinition, anim: PetAnim): PetAnim {
  let current = anim;
  for (let i = 0; i < 6; i++) {
    if (def.anims.includes(current)) return current;
    current = def.fallback?.[current] ?? DEFAULT_FALLBACK[current];
  }
  return "idle";
}
