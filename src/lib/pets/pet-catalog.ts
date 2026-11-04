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

export const PET_ANIMS = ["idle", "blink", "walk", "run", "jump", "sit", "sleep", "stretch", "happy", "excited", "follow", "startled", "celebrate", "stalk", "crouch", "pounce"] as const;
export type PetAnim = (typeof PET_ANIMS)[number];

/** How the pet travels: drives the CSS body motion. */
export type Locomotion = "walk" | "prowl" | "trot" | "hop" | "waddle" | "wobble" | "fly";

/** Signature behaviours that come from how the real animal acts. The behaviour engine reads these. */
export type Quirk =
  /** Creeps toward the cursor in stop-start bursts, wiggles, then pounces. */
  | "stalk"
  /** Freezes, then pounces on something invisible. */
  | "mouse"
  /** Sudden bursts of racing back and forth. */
  | "zoomies"
  /** Rushes to the cursor, touches it, then bolts away. */
  | "tag";

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

/**
 * A signature move this pet does on its own while idle (a cat loafing, a ghost vanishing, an elephant trumpeting).
 * The brain picks one now and then, plays `anim` for `seconds`, shows the emoji and says a line. The sprite carries
 * `data-trick="<id>"` while it runs, so the CSS can give each trick its own motion. Ids are unique across all pets.
 */
export type Trick = { id: string; anim: PetAnim; seconds: number; /** Relative chance against other idle choices. */ weight: number; emoji: string; say?: readonly string[] };

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
  quirks?: readonly Quirk[];
  /** Signature idle behaviours that make this pet unlike the others. */
  tricks: readonly Trick[];
  /** How it acts after a pounce lands. */
  pounce?: { anim: PetAnim; emoji: string; say?: string[] };
  /** Seconds of stillness before it dozes off (default 28). */
  sleepAfter?: number;
  /** "side" art is drawn in profile (four-legged walkers) and is mirrored to face the direction of travel. */
  view?: "front" | "side";
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

const ALL = ["idle", "blink", "walk", "run", "jump", "sit", "sleep", "stretch", "happy", "excited", "follow", "startled", "celebrate"] as const;
const MOUSE = ["idle", "blink", "walk", "run", "jump", "sit", "sleep", "stretch", "happy", "excited", "follow", "startled", "celebrate", "crouch", "pounce"] as const;
const HUNT = ["idle", "blink", "walk", "run", "jump", "sit", "sleep", "stretch", "happy", "excited", "follow", "startled", "celebrate", "stalk", "crouch", "pounce"] as const;

export const PETS: readonly PetDefinition[] = [
  {
    id: "mochi", name: "Mochi the Cat", file: "cat-legend.svg", rarity: "common", unlockStreak: 3,
    tagline: "Slow, graceful and a little bit nosy.",
    personality: "A true cat: it stalks your cursor low to the ground, freezes, wiggles its rear and pounces, then acts like it meant to do that. It grooms, naps often and gets sudden zoomies.",
    behaviors: ["Stalks your cursor, then pounces", "Pounces on invisible bugs", "Sudden zoomies", "Grooms its paws and naps a lot"],
    locomotion: "prowl", speed: 46,
    quirks: ["stalk", "mouse", "zoomies"], sleepAfter: 16,
    pounce: { anim: "sit", emoji: "😼", say: ["I meant to do that.", "*grooms casually*", "Got you!"] },
    traits: { curiosity: 0.85, friendliness: 0.6, shyness: 0.15, playfulness: 0.7, energy: 0.45, sleepiness: 0.5 },
    tricks: [
      { id: "loaf", anim: "sit", seconds: 6, weight: 1.2, emoji: "🍞", say: ["Loaf mode.", "*tucks paws in*"] },
      { id: "knead", anim: "sit", seconds: 4, weight: 0.8, emoji: "🐾", say: ["*knead knead*"] },
    ],
    anims: HUNT,
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
    id: "snowy", name: "Snowy the Bunny", file: "snowy-bunny-new.svg", rarity: "common", unlockStreak: 7,
    tagline: "Hops about, wiggles its ears, loves a game of tag.",
    personality: "Gentle and shy. It hops everywhere, sniffs around and dashes off if your cursor comes too close, then peeks back.",
    behaviors: ["Hops instead of walking", "Wiggles its ears", "Runs away playfully", "Rests with ears down"],
    locomotion: "hop", speed: 74,
    traits: { curiosity: 0.75, friendliness: 0.3, shyness: 0.85, playfulness: 0.6, energy: 0.6, sleepiness: 0.45 },
    tricks: [
      { id: "binky", anim: "jump", seconds: 0.85, weight: 1.1, emoji: "🐰", say: ["Binky!"] },
    ],
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
    id: "boo", name: "Boo the Ghost", file: "ghost.svg", rarity: "rare", unlockStreak: 10,
    tagline: "Friendly, floaty and a little bit spooky.",
    personality: "A shy little ghost that drifts instead of walking, fades out of sight to play hide and seek and pops back with a big BOO.",
    behaviors: ["Floats instead of walking", "Vanishes, then reappears", "Jumps out with a BOO", "Hides when your cursor gets close"],
    locomotion: "fly", speed: 44,
    tricks: [
      { id: "vanish", anim: "sit", seconds: 3.5, weight: 1.4, emoji: "👻", say: ["Now you see me...", "Where did I go?"] },
      { id: "spook", anim: "excited", seconds: 1.9, weight: 1, emoji: "😱", say: ["BOO!", "Did I scare you?"] },
    ],
    traits: { curiosity: 0.8, friendliness: 0.4, shyness: 0.7, playfulness: 0.85, energy: 0.5, sleepiness: 0.2 },
    anims: ALL,
    followArrive: "happy", followDistance: 90, idle: [2, 6],
    clickReactions: [
      { anim: "startled", emoji: "💨", say: "Eep! You found me!" },
      { anim: "jump", emoji: "👻", say: "Boo!" },
      { anim: "happy", emoji: "💜", say: "Hehehe." },
    ],
    speech: {
      click: ["Boo!", "You found me!", "Hehehe."], celebrate: ["Spook-tacular!", "Ghostly good typing!"], encourage: ["Don't be scared, keep typing.", "You're boo-tiful at this."],
      follow: ["Floating over..."], flee: ["Poof!"], wake: ["*floats up sleepily*"],
    },
  },
  {
    id: "rusty", name: "Rusty the Red Panda", file: "red-panda.svg", rarity: "rare", unlockStreak: 14,
    tagline: "Fluffy, curious and always snacking.",
    personality: "A cosy red panda that ambles along with its ringed tail swaying, stops to sniff everything and dozes off the moment things go quiet.",
    behaviors: ["Ambles with a swaying ringed tail", "Sniffs around curiously", "Dozes off often", "Perks up for every win"],
    locomotion: "walk", speed: 50,
    traits: { curiosity: 0.8, friendliness: 0.65, shyness: 0.35, playfulness: 0.55, energy: 0.4, sleepiness: 0.65 },
    tricks: [
      { id: "munch", anim: "sit", seconds: 5, weight: 1.2, emoji: "🎋", say: ["Nom nom nom.", "Bamboo break!"] },
    ],
    anims: ALL,
    followArrive: "sit", followDistance: 64, idle: [3, 8],
    clickReactions: [
      { anim: "happy", emoji: "🎋", say: "Bamboo time?" },
      { anim: "jump", emoji: "🍃", say: "Boop!" },
      { anim: "stretch", emoji: "🧡" },
    ],
    speech: {
      click: ["Bamboo time?", "Boop!", "Chirp!"], celebrate: ["Tail-wagging good!", "Red panda happy dance!"], encourage: ["Slow and steady wins.", "A little bamboo, a little typing."],
      follow: ["What's over there?"], flee: ["Eek!"], wake: ["*big yawn*"],
    },
  },
  {
    id: "foxy", name: "Foxy the Fox", file: "fox-new-1.svg", rarity: "rare", unlockStreak: 21,
    tagline: "Quick, clever and a little sly.",
    personality: "A clever, wary fox. It listens, then dives nose-first onto invisible mice, plays tag by dashing up to your cursor and bolting away, and curls its tail over its nose to sleep.",
    behaviors: ["Listens, then mouse-pounces", "Plays tag with your cursor", "Keeps a sly distance", "Curls up to sleep"],
    locomotion: "trot", speed: 84,
    quirks: ["mouse", "tag"],
    pounce: { anim: "happy", emoji: "🐭", say: ["Gotcha!", "Mouse? What mouse?"] },
    traits: { curiosity: 0.9, friendliness: 0.5, shyness: 0.5, playfulness: 0.85, energy: 0.75, sleepiness: 0.3 },
    tricks: [
      { id: "tail-chase", anim: "excited", seconds: 2.4, weight: 1, emoji: "🌀", say: ["Wheee!", "Got my tail!"] },
    ],
    anims: MOUSE,
    followArrive: "sit", followDistance: 130, idle: [2, 6],
    clickReactions: [
      { anim: "jump", emoji: "🍂", say: "Pounce!" },
      { anim: "excited", emoji: "✨", say: "Too slow!" },
      { anim: "happy", emoji: "🧡", say: "Hehe." },
    ],
    speech: {
      click: ["Pounce!", "Too slow!", "Hehe."], celebrate: ["Clever and quick, just like you!", "Foxy-tastic!"], encourage: ["A fox never gives up.", "Quick fingers, quick mind."],
      follow: ["Not too close..."], flee: ["Catch me!"], wake: ["Hm? I was only resting my eyes."],
    },
  },
  {
    id: "dumbo", name: "Dumbo the Elephant", file: "elephant.svg", rarity: "rare", unlockStreak: 25,
    tagline: "Gentle, wise and never forgets a lesson.",
    personality: "A gentle baby elephant that plods along slowly, flaps its enormous ears when it is happy and trumpets at every win. It never forgets a friend.",
    behaviors: ["Plods slowly and steadily", "Flaps its big ears", "Trumpets with its trunk", "Always friendly"],
    locomotion: "walk", speed: 34,
    tricks: [
      { id: "trumpet", anim: "stretch", seconds: 1.6, weight: 1.2, emoji: "🎺", say: ["Toot toot!", "TWEEET!"] },
      { id: "ear-flap", anim: "happy", seconds: 2.4, weight: 1, emoji: "🐘", say: ["Flap flap!", "Look, I can almost fly!"] },
    ],
    traits: { curiosity: 0.6, friendliness: 0.9, shyness: 0.15, playfulness: 0.5, energy: 0.3, sleepiness: 0.5 },
    anims: ALL,
    followArrive: "happy", followDistance: 60, idle: [4, 9],
    clickReactions: [
      { anim: "stretch", emoji: "🎺", say: "Toot!" },
      { anim: "happy", emoji: "💙", say: "Hello, friend." },
      { anim: "jump", emoji: "🥜", say: "Peanuts?" },
    ],
    speech: {
      click: ["Toot!", "Hello, friend.", "Peanuts?"], celebrate: ["I never forget a win!", "TOOT TOOT HOORAY!"], encourage: ["Slow and steady, friend.", "Big steps, little steps. Keep going."],
      follow: ["I'm coming, slowly."], flee: ["Whoa!"], wake: ["Mmm, five more minutes."],
    },
  },
  {
    id: "ollie", name: "Ollie the Otter", file: "otter.svg", rarity: "rare", unlockStreak: 30,
    tagline: "Playful, splashy and never still.",
    personality: "A bouncy otter that wriggles everywhere, bursts into sudden zoomies and clutches its favourite shell whenever it sits down.",
    behaviors: ["Wriggles along with a waddle", "Sudden zoomies", "Holds its lucky shell", "Floats happily when resting"],
    locomotion: "waddle", speed: 70,
    quirks: ["zoomies"],
    traits: { curiosity: 0.9, friendliness: 0.98, shyness: 0.03, playfulness: 0.95, energy: 0.85, sleepiness: 0.3 },
    tricks: [
      { id: "barrel-roll", anim: "excited", seconds: 1.6, weight: 1.2, emoji: "💦", say: ["Splash roll!", "Wheee!"] },
    ],
    anims: ALL,
    followArrive: "excited", followDistance: 34, idle: [2, 5],
    clickReactions: [
      { anim: "jump", emoji: "🐚", say: "Splash!" },
      { anim: "excited", emoji: "💦", say: "Wheee!" },
      { anim: "happy", emoji: "💙", say: "Look at my shell!" },
    ],
    speech: {
      click: ["Splash!", "Look at my shell!", "Wheee!"], celebrate: ["Otter-ly amazing!", "Splash party!"], encourage: ["Go with the flow!", "You're doing great!"],
      follow: ["Wait for me!"], flee: ["Eep, splash!"], wake: ["*floats up*"],
    },
  },
  {
    id: "frosty", name: "Frosty the Snowman", file: "snowman.svg", rarity: "rare", unlockStreak: 40,
    tagline: "Cool-headed and warm-hearted.",
    personality: "A cheerful snowman that rolls along with a wobble, shivers when it gets nervous and insists it is totally fine when it starts to melt.",
    behaviors: ["Wobbles along", "Shivers: brrr!", "Melts a little, then recovers", "Loves cold days"],
    locomotion: "wobble", speed: 34, sleepAfter: 20,
    tricks: [
      { id: "shiver", anim: "sit", seconds: 3, weight: 1.2, emoji: "🥶", say: ["Brrr...", "Is it chilly?"] },
      { id: "melt", anim: "sit", seconds: 3.5, weight: 1, emoji: "💧", say: ["I'm fine, I'm fine!", "Just a little melty."] },
    ],
    traits: { curiosity: 0.6, friendliness: 0.7, shyness: 0.4, playfulness: 0.6, energy: 0.3, sleepiness: 0.35 },
    anims: ALL,
    followArrive: "happy", followDistance: 56, idle: [3, 8],
    clickReactions: [
      { anim: "jump", emoji: "❄️", say: "Snow way!" },
      { anim: "happy", emoji: "⛄", say: "Hug me, I'm cool!" },
      { anim: "stretch", emoji: "🥕" },
    ],
    speech: {
      click: ["Snow way!", "I'm cool with that.", "Brrr-illiant!"], celebrate: ["Snow-tally awesome!", "You're on thin ice... of greatness!"], encourage: ["Stay cool, keep typing.", "Every flake counts."],
      follow: ["Rolling over!"], flee: ["Don't melt me!"], wake: ["*frosty yawn*"],
    },
  },
  {
    id: "luna", name: "Luna the Unicorn", file: "unicorn-new.svg", rarity: "epic", unlockStreak: 45,
    tagline: "A rainbow-maned dreamer.",
    personality: "A gentle unicorn that trots gracefully, tosses its rainbow mane and sparkles whenever you finish a lesson.",
    behaviors: ["Trots with a flowing rainbow mane", "Sparkles when you win", "Gentle and friendly", "Naps under the stars"],
    locomotion: "trot", speed: 78,
    traits: { curiosity: 0.7, friendliness: 0.8, shyness: 0.2, playfulness: 0.7, energy: 0.6, sleepiness: 0.4 },
    tricks: [
      { id: "rear", anim: "stretch", seconds: 1.5, weight: 1, emoji: "🌈", say: ["Neigh!", "Magic!"] },
    ],
    anims: ALL,
    followArrive: "happy", followDistance: 70, idle: [3, 7],
    clickReactions: [
      { anim: "jump", emoji: "🌈", say: "Sparkle!" },
      { anim: "happy", emoji: "💖", say: "Believe in magic." },
      { anim: "stretch", emoji: "✨" },
    ],
    speech: {
      click: ["Sparkle!", "Believe in magic.", "Neigh!"], celebrate: ["Magical typing!", "Rainbow of wins!"], encourage: ["Every day is a little magic.", "Trot on, you've got this."],
      follow: ["Follow the rainbow!"], flee: ["Whinny!"], wake: ["*mane swish*"],
    },
  },
  {
    id: "stella", name: "Stella the Fairy Fox", file: "fox-new.svg", rarity: "epic", unlockStreak: 60,
    tagline: "A twilight fox with a sprinkle of stardust.",
    personality: "A dreamy fox from the twilight woods. It plays tag with your cursor, leaves a trail of stardust and glows softly while it naps.",
    behaviors: ["Plays tag with your cursor", "Twinkling star aura", "Dreamy and curious", "Glows while it naps"],
    locomotion: "trot", speed: 80, aura: "stars",
    quirks: ["tag"],
    palette: { "#7c8b99": "#a78bfa", "#8f9ba8": "#c4b5fd", "#9aa5b1": "#ddd6fe", "#2c3a47": "#6d28d9", "#96adc2": "#f0abfc", "#698196": "#c026d3", "#435566": "#7e22ce", "#b8c2cc": "#e9d5ff", "#c4ced8": "#f5d0fe", "#9ca6b0": "#d8b4fe" },
    traits: { curiosity: 0.85, friendliness: 0.55, shyness: 0.4, playfulness: 0.8, energy: 0.65, sleepiness: 0.4 },
    tricks: [
      { id: "twirl", anim: "happy", seconds: 2, weight: 1.1, emoji: "✨", say: ["Twirl!", "Sparkle spin!"] },
    ],
    anims: ALL,
    followArrive: "sit", followDistance: 110, idle: [2, 6],
    clickReactions: [
      { anim: "jump", emoji: "🌟", say: "Stardust!" },
      { anim: "excited", emoji: "✨", say: "Catch me if you can!" },
      { anim: "happy", emoji: "💜", say: "Hehe." },
    ],
    speech: {
      click: ["Stardust!", "Twinkle!", "Hehe."], celebrate: ["A star-studded win!", "Fairy-tale typing!"], encourage: ["A little sparkle each day.", "Wish upon your keys."],
      follow: ["Follow the sparkles..."], flee: ["Poof!"], wake: ["Mm, stars still out?"],
    },
  },
  {
    id: "moonie", name: "Moonie the Moon Sprite", file: "moon.svg", rarity: "epic", unlockStreak: 80,
    tagline: "Dreamy, drowsy and a little bit magical.",
    personality: "A sleepy moon sprite in its nightcap. It bounces in slow, low-gravity hops, glows through its phases and drifts off to sleep faster than anyone.",
    behaviors: ["Bounces in low gravity", "Glows through moon phases", "Dozes off quickly", "Twinkling star aura"],
    locomotion: "hop", speed: 52, aura: "stars", sleepAfter: 12,
    tricks: [
      { id: "moonglow", anim: "sit", seconds: 4, weight: 1.3, emoji: "🌙", say: ["Moon phase...", "Glow, glow."] },
      { id: "moonleap", anim: "jump", seconds: 1.6, weight: 1, emoji: "🚀", say: ["Low gravity!", "Wheee, up I go!"] },
    ],
    traits: { curiosity: 0.6, friendliness: 0.7, shyness: 0.3, playfulness: 0.6, energy: 0.4, sleepiness: 0.8 },
    anims: ALL,
    followArrive: "sit", followDistance: 70, idle: [3, 7],
    clickReactions: [
      { anim: "jump", emoji: "⭐", say: "Wheee!" },
      { anim: "happy", emoji: "🌙", say: "Sweet dreams." },
      { anim: "stretch", emoji: "💤" },
    ],
    speech: {
      click: ["Wheee!", "Sweet dreams.", "*yawn*"], celebrate: ["Over the moon!", "Shooting-star typing!"], encourage: ["Dream big, type bigger.", "Even the moon takes it slow."],
      follow: ["Floating over..."], flee: ["Eep!"], wake: ["Is it night already?"],
    },
  },
  {
    id: "leo", name: "Leo the Golden Lion", file: "lion.svg", rarity: "legendary", unlockStreak: 100,
    tagline: "Brave, proud and golden.",
    personality: "A proud little lion with a mighty mane. It prowls with its chin up, stalks your cursor before pouncing, and roars at every milestone.",
    behaviors: ["Prowls proudly", "Stalks, then pounces", "Mighty tiny roar", "Golden glow"],
    locomotion: "prowl", speed: 56, aura: "gold",
    quirks: ["stalk"],
    pounce: { anim: "excited", emoji: "🦁", say: ["Roar!", "Got you!"] },
    traits: { curiosity: 0.7, friendliness: 0.6, shyness: 0.05, playfulness: 0.6, energy: 0.55, sleepiness: 0.4 },
    tricks: [
      { id: "roar", anim: "stretch", seconds: 1.8, weight: 1.2, emoji: "🦁", say: ["ROAR!", "Hear me roar!"] },
    ],
    anims: HUNT,
    followArrive: "sit", followDistance: 80, idle: [3, 7],
    clickReactions: [
      { anim: "stretch", emoji: "👑", say: "ROAR!" },
      { anim: "jump", emoji: "🦁", say: "Mighty!" },
      { anim: "happy", emoji: "🧡", say: "*proud purr*" },
    ],
    speech: {
      click: ["ROAR!", "Mighty!", "*proud purr*"], celebrate: ["King of the keyboard!", "A roaring success!"], encourage: ["Be brave, keep typing.", "Lions never quit."],
      follow: ["I shall inspect that."], flee: ["Grr!"], wake: ["*mighty yawn*"],
    },
  },
  {
    id: "cosmo", name: "Cosmo the Dragon", file: "dragon.svg", rarity: "legendary", unlockStreak: 150,
    tagline: "A dragon woven from the night sky.",
    personality: "A calm, wise dragon with a coat of deep space. It glides among the stars, flaps its wings when excited and loves to show off a spark of fire.",
    behaviors: ["Flies around the page", "Lands to rest and nap", "Twinkling star aura", "Puffs sparks when clicked"],
    locomotion: "fly", speed: 60, aura: "stars",
    palette: { "#2a9d8f": "#4338ca", "#a8dadc": "#a5b4fc", "#e9c46a": "#fcd34d", "#264653": "#1e1b4b" },
    traits: { curiosity: 0.6, friendliness: 0.55, shyness: 0.1, playfulness: 0.55, energy: 0.5, sleepiness: 0.4 },
    tricks: [
      { id: "loop", anim: "excited", seconds: 1.9, weight: 1, emoji: "🌌", say: ["Loop-de-loop!", "Whee, zero gravity!"] },
    ],
    anims: ALL,
    followArrive: "sit", followDistance: 76, idle: [3, 8],
    clickReactions: [
      { anim: "stretch", emoji: "🔥", say: "Rawr!" },
      { anim: "jump", emoji: "🌌", say: "To the stars!" },
      { anim: "happy", emoji: "💙", say: "*tiny puff of smoke*" },
    ],
    speech: {
      click: ["Rawr!", "To the stars!", "*tiny puff of smoke*"], celebrate: ["A cosmic win!", "Roar of victory!"], encourage: ["Even dragons practice.", "Steady as the night sky."],
      follow: ["The stars guide me."], flee: ["Whoosh!"], wake: ["Rrrawr... five more minutes."],
    },
  },
  {
    id: "griff", name: "Griff the Griffin", file: "griffin.svg", rarity: "legendary", unlockStreak: 250,
    tagline: "Part eagle, part lion, all courage.",
    personality: "A proud young griffin with an eagle's eyes and a lion's heart. It soars in wide arcs, screeches at the sky and spreads its wings to show off.",
    behaviors: ["Soars in wide arcs", "Screeches at the sky", "Dives with its wings tucked", "Golden glow"],
    locomotion: "fly", speed: 72, aura: "gold",
    tricks: [
      { id: "screech", anim: "stretch", seconds: 1.6, weight: 1.2, emoji: "🦅", say: ["SKREEE!", "Hear that?"] },
      { id: "dive", anim: "excited", seconds: 1.9, weight: 1, emoji: "💨", say: ["Diiive!", "Wings tucked!"] },
    ],
    traits: { curiosity: 0.75, friendliness: 0.45, shyness: 0.1, playfulness: 0.5, energy: 0.7, sleepiness: 0.2 },
    anims: ALL,
    followArrive: "sit", followDistance: 90, idle: [2, 6],
    clickReactions: [
      { anim: "stretch", emoji: "🦅", say: "SKREE!" },
      { anim: "jump", emoji: "⚡", say: "Watch this!" },
      { anim: "happy", emoji: "🧡", say: "*proud chirp*" },
    ],
    speech: {
      click: ["SKREE!", "Watch this!", "*proud chirp*"], celebrate: ["A legendary win!", "Soar higher!"], encourage: ["Fly through it.", "Courage, friend."],
      follow: ["I see you from above."], flee: ["Up, up and away!"], wake: ["*ruffles feathers*"],
    },
  },
  {
    id: "phoenix", name: "Solar Phoenix", file: "phoenix.svg", rarity: "special", unlockStreak: 365,
    tagline: "Exclusive reward for a whole year of practice.",
    personality: "A blazing phoenix that rises again every day. It soars with a trail of embers, glows gold and cheers louder than anyone.",
    behaviors: ["Soars with a golden glow", "Flies high and lands to rest", "Exclusive 365-day reward"],
    locomotion: "fly", speed: 64, aura: "gold",
    traits: { curiosity: 0.7, friendliness: 0.6, shyness: 0.05, playfulness: 0.6, energy: 0.6, sleepiness: 0.25 },
    tricks: [
      { id: "blaze", anim: "celebrate", seconds: 2.4, weight: 1, emoji: "🔥", say: ["Burn bright!", "Rising!"] },
    ],
    anims: ALL,
    followArrive: "sit", followDistance: 80, idle: [3, 7],
    clickReactions: [
      { anim: "stretch", emoji: "🔥", say: "Rise again!" },
      { anim: "jump", emoji: "☀️", say: "Blaze!" },
      { anim: "celebrate", emoji: "🌅", say: "365 days. Legendary." },
    ],
    speech: {
      click: ["Rise again!", "Blaze!", "Feel the warmth."], celebrate: ["You burn so bright!", "A whole year. Incredible!"], encourage: ["Every day, a new sunrise.", "Rise and keep typing."],
      follow: ["The sun follows you."], flee: ["Whoosh!"], wake: ["Sunrise already?"],
    },
  },
];

export const PET_BY_ID: Record<string, PetDefinition> = Object.fromEntries(PETS.map((p) => [p.id, p]));
export const getPet = (id: string | null | undefined): PetDefinition | null => (id ? PET_BY_ID[id] ?? null : null);

/** Where an unsupported animation falls back to. A pet's own `fallback` wins. */
const DEFAULT_FALLBACK: Record<PetAnim, PetAnim> = {
  idle: "idle", blink: "idle", walk: "idle", run: "walk", jump: "happy", sit: "idle", sleep: "idle", stretch: "idle",
  happy: "idle", excited: "happy", follow: "walk", startled: "jump", celebrate: "excited", stalk: "walk", crouch: "idle", pounce: "jump",
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
