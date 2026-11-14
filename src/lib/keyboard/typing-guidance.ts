import { fingerForCode, fingerNameOf, handOf, shiftFor, type FingerId } from "@/lib/keyboard/finger-mapping";
import { charMapFor, findKeyFor } from "@/lib/keyboard/keyboard-mapping";
import { isLetterKey, legendGlyph } from "@/lib/keyboard/keyboard-utils";
import type { Language } from "@/types";

export type GuidanceMode = "learning" | "practice" | "challenge";
export const GUIDANCE_MODES: readonly GuidanceMode[] = ["learning", "practice", "challenge"];

/** Everything the keyboard and the hand illustration need for one expected character. */
export type Guidance = {
  /** The character the learner must type next. */
  expected: string;
  /** Physical key (KeyboardEvent.code). */
  code: string;
  finger: FingerId;
  /** Present when the character needs Shift: the opposite-hand Shift key and its finger. */
  shift: { code: string; finger: FingerId } | null;
  /** Present for third-level NiDA characters (ឱ, ឯ, ៈ...): hold right Alt (AltGr / Option) with the right thumb. */
  altGr: { code: "AltRight"; finger: FingerId } | null;
  /** Short name of the physical key, e.g. "F", ";", "Space". */
  keyName: string;
};

/** Short physical-key name shown to learners. Always the Latin legend: NiDA keys sit on QWERTY positions. */
export function keyName(code: string): string {
  if (code === "Space") return "Space";
  const latin = charMapFor("english")[code]?.[0];
  return latin ? latin.toUpperCase() : code.replace(/^(Key|Digit)/, "");
}

/**
 * Resolves the key, finger and Shift need for the expected character in the active
 * language layout. Returns null when the layout has no key for it (the caller must
 * then say so instead of inventing a key). `caps` is the effective Caps Lock state.
 */
export function guidanceFor(language: Language, expected: string | null | undefined, caps = false): Guidance | null {
  if (!expected) return null;
  const target = findKeyFor(language, expected);
  if (!target) return null;
  const finger = fingerForCode(target.code);
  if (!finger) return null;
  // Caps Lock flips English letters only; Khmer has no case.
  const needShift = language === "english" && isLetterKey(target.code) ? target.shift !== caps : target.shift;
  return { expected, code: target.code, finger, shift: needShift ? shiftFor(target.code) : null, altGr: target.altGr ? { code: "AltRight", finger: "right-thumb" } : null, keyName: keyName(target.code) };
}

// ---- Wording (English and Khmer UI) ------------------------------------------
type Locale = "en" | "km";
const WORDS = {
  en: {
    hand: { left: "left", right: "right" },
    finger: { pinky: "little finger", ring: "ring finger", middle: "middle finger", index: "index finger", thumb: "thumb" },
    use: (hand: string, finger: string, key: string) => `Use your ${hand} ${finger} to press ${key}.`,
    useShift: (hand: string, finger: string, key: string, sh: string) => `Use your ${hand} ${finger} to press ${key} while your ${sh} hand holds Shift.`,
    useAltGr: (hand: string, finger: string, key: string) => `Hold the right Alt key (AltGr, or Option on a Mac) with your right thumb, then press ${key} with your ${hand} ${finger}.`,
    short: (hand: string, finger: string, key: string) => `${key} · ${hand} ${finger}`,
    home: "Rest your fingers on the home row: A S D F and J K L ;. Feel the bumps on F and J.",
    noKey: (ch: string) => `Type ${ch}. This character has no key in this layout.`,
    correct: "Correct!",
    wrongLearn: (pressed: string, key: string, hand: string, finger: string) => `You pressed ${pressed}. Try ${key} with your ${hand} ${finger}.`,
    wrongPractice: (key: string) => `Not quite. The key is ${key}.`,
    wrongChallenge: "Not quite. Try again.",
    khmerKey: (key: string, out: string) => `${key} key → ${out}`,
  },
  km: {
    hand: { left: "ឆ្វេង", right: "ស្តាំ" },
    finger: { pinky: "ម្រាមតូច", ring: "ម្រាមនាង", middle: "ម្រាមកណ្តាល", index: "ម្រាមចង្អុល", thumb: "មេដៃ" },
    use: (hand: string, finger: string, key: string) => `ប្រើដៃ${hand} ${finger} ដើម្បីចុច ${key}។`,
    useShift: (hand: string, finger: string, key: string, sh: string) => `ប្រើដៃ${hand} ${finger} ចុច ${key} ហើយដៃ${sh}សង្កត់ Shift។`,
    useAltGr: (hand: string, finger: string, key: string) => `សង្កត់គ្រាប់ Alt ខាងស្តាំ (AltGr ឬ Option លើ Mac) ដោយមេដៃស្តាំ រួចចុច ${key} ដោយដៃ${hand} ${finger}។`,
    short: (hand: string, finger: string, key: string) => `${key} · ដៃ${hand} ${finger}`,
    home: "ដាក់ម្រាមដៃលើជួរកណ្តាល៖ A S D F និង J K L ;។ ស្គាល់ដុំលើ F និង J។",
    noKey: (ch: string) => `វាយ ${ch}។ តួអក្សរនេះមិនមានគ្រាប់ចុចក្នុងប្លង់នេះទេ។`,
    correct: "ត្រឹមត្រូវ!",
    wrongLearn: (pressed: string, key: string, hand: string, finger: string) => `អ្នកបានចុច ${pressed}។ សាកល្បង ${key} ដោយដៃ${hand} ${finger}។`,
    wrongPractice: (key: string) => `មិនទាន់ត្រូវទេ។ គ្រាប់ត្រឹមត្រូវគឺ ${key}។`,
    wrongChallenge: "មិនទាន់ត្រូវទេ។ សាកល្បងម្តងទៀត។",
    khmerKey: (key: string, out: string) => `គ្រាប់ ${key} → ${out}`,
  },
} as const;

const fingerWords = (finger: FingerId, locale: Locale) => ({ hand: WORDS[locale].hand[handOf(finger)], name: WORDS[locale].finger[fingerNameOf(finger)] });

/** Full instruction, e.g. "Use your left index finger to press F." */
export function describeGuidance(g: Guidance, locale: Locale = "en", form: "full" | "short" = "full"): string {
  const w = WORDS[locale];
  const f = fingerWords(g.finger, locale);
  if (form === "short") return w.short(f.hand, f.name, g.keyName);
  if (g.altGr) return w.useAltGr(f.hand, f.name, g.keyName);
  if (!g.shift) return w.use(f.hand, f.name, g.keyName);
  return w.useShift(f.hand, f.name, g.keyName, fingerWords(g.shift.finger, locale).hand);
}

/** Khmer output for a key, e.g. "K key → ក". Null for English. */
export function describeOutput(language: Language, g: Guidance, locale: Locale = "en"): string | null {
  return language === "khmer" ? WORDS[locale].khmerKey(g.keyName, legendGlyph(g.expected)) : null;
}

export const homeInstruction = (locale: Locale = "en") => WORDS[locale].home;
export const noKeyInstruction = (expected: string, locale: Locale = "en") => WORDS[locale].noKey(legendGlyph(expected));

// ---- Feedback ---------------------------------------------------------------
export type Feedback = { kind: "correct" | "wrong"; text: string; /** finger that pressed a wrong key */ wrongFinger: FingerId | null };

/**
 * Feedback for a judged key press. The wording depends on the mode: Learning explains the
 * fix, Practice just names the key, Challenge says nothing that would give the answer away.
 */
export function feedbackFor(flash: { code: string; ok: boolean } | null, g: Guidance | null, mode: GuidanceMode, locale: Locale = "en"): Feedback | null {
  if (!flash) return null;
  const w = WORDS[locale];
  if (flash.ok) return { kind: "correct", text: w.correct, wrongFinger: null };
  const wrongFinger = fingerForCode(flash.code);
  if (!g || mode === "challenge") return { kind: "wrong", text: w.wrongChallenge, wrongFinger };
  if (mode === "practice") return { kind: "wrong", text: w.wrongPractice(g.keyName), wrongFinger };
  const f = fingerWords(g.finger, locale);
  return { kind: "wrong", text: w.wrongLearn(keyName(flash.code), g.keyName, f.hand, f.name), wrongFinger };
}

/** Challenge mode hides key and finger hints until the learner asks; the other modes always show them. */
export const hintsVisible = (mode: GuidanceMode, revealed: boolean) => mode !== "challenge" || revealed;
