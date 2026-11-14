import assert from "node:assert/strict";
import { test } from "node:test";
import { codepoints, normalizeKhmer, normalizeTypedInput, splitGraphemes } from "@/lib/khmer-unicode";
import { emulatedNidaInput, findKeyFor, isCorrectPress, keystrokesOf } from "@/lib/keyboard/keyboard-mapping";
import { guidanceFor } from "@/lib/keyboard/typing-guidance";
import { getCharStates, scoreTyping } from "@/lib/typing-engine";
import { resolveKey } from "@/hooks/use-key-input";

const cps = (s: string) => codepoints(normalizeKhmer(s));
const key = (code: string, key: string, mods: Partial<{ shiftKey: boolean; altKey: boolean; ctrlKey: boolean; metaKey: boolean; isComposing: boolean }> = {}) =>
  ({ code, key, shiftKey: false, altKey: false, ctrlKey: false, metaKey: false, repeat: false, ...mods });

test("subscript consonants stay in one cluster with their base", () => {
  assert.deepEqual(splitGraphemes("ក្រុម"), ["ក្រុ", "ម"]);
  assert.deepEqual(splitGraphemes("ស្ត្រី"), ["ស្ត្រី"]);
  assert.deepEqual(splitGraphemes("ខ្មែរ"), ["ខ្មែ", "រ"]);
});

test("WPM credit is given per complete, correct cluster", () => {
  const text = "ក្រុម";
  // Half of the first cluster typed: no credit yet, shown as partial.
  assert.equal(scoreTyping(text, cps("ក្រ"), "khmer").correct, 0);
  assert.equal(getCharStates(text, cps("ក្រ"), "khmer")[0].state, "partial");
  // First cluster complete: its 4 keystrokes count.
  const s = scoreTyping(text, cps("ក្រុ"), "khmer");
  assert.equal(s.correct, 4);
  assert.equal(s.done, 1);
  assert.equal(s.total, 2);
  // Wrong subscript: the whole cluster earns nothing and is one mistake, reported as a cluster.
  const wrong = scoreTyping(text, cps("ក្ទុម"), "khmer");
  assert.equal(wrong.correct, 1);
  assert.deepEqual(wrong.mistakes, [{ index: 0, expected: "ក្រុ", typed: "ក្ទុ" }]);
});

test("progress follows visible clusters, not code points", () => {
  const text = "ស្ត្រី ក";
  const s = scoreTyping(text, cps("ស្ត្រី"), "khmer");
  assert.equal(s.total, 3);
  assert.equal(s.done, 1);
});

test("English scoring is unchanged: one character, one unit", () => {
  const s = scoreTyping("hello", ["h", "e", "x"], "english");
  assert.equal(s.correct, 2);
  assert.equal(s.done, 3);
  assert.deepEqual(s.mistakes, [{ index: 2, expected: "l", typed: "x" }]);
});

test("backspace and correction: fixing a cluster restores its credit", () => {
  const text = "ក្រុម";
  let typed = cps("ក្ទ");
  assert.equal(getCharStates(text, typed, "khmer")[0].state, "wrong");
  typed = typed.slice(0, -1); // Backspace removes one code point (the wrong subscript)
  typed = [...typed, "រ", "ុ"];
  assert.equal(scoreTyping(text, typed, "khmer").correct, 4);
});

test("NiDA Space (U+200B) counts as a space press", () => {
  assert.equal(normalizeTypedInput("ក​ខ", true), "ក ខ");
  assert.equal(normalizeTypedInput("a​b", false), "a​b");
  assert.equal(resolveKey({ key: "​", code: "Space", shiftKey: false }, "khmer"), " ");
});

test("NiDA number row: Shift+Minus is robat, Shift+Equal is kakabat", () => {
  assert.deepEqual(findKeyFor("khmer", "៌"), { code: "Minus", shift: true });
  assert.deepEqual(findKeyFor("khmer", "៎"), { code: "Equal", shift: true });
});

test("AltGr characters used in lessons have a key and finger guidance", () => {
  for (const [ch, code] of [["ឱ", "KeyO"], ["ឫ", "KeyR"], ["ៈ", "Quote"], ["ឯ", "KeyE"]] as const) {
    const g = guidanceFor("khmer", ch);
    assert.ok(g, ch);
    assert.equal(g.code, code);
    assert.equal(g.altGr?.code, "AltRight");
    assert.equal(g.shift, null);
  }
  assert.equal(isCorrectPress("khmer", "KeyO", false, false, "ឱ", true), true);
  assert.equal(isCorrectPress("khmer", "KeyO", false, false, "ឱ", false), false);
});

test("physical key detection: Latin OS keys are typed as NiDA", () => {
  assert.equal(emulatedNidaInput(key("KeyK", "k"), "khmer"), "ក");
  assert.equal(emulatedNidaInput(key("KeyK", "K", { shiftKey: true }), "khmer"), "គ");
  assert.equal(emulatedNidaInput(key("KeyJ", "j"), "khmer"), "្"); // COENG
  assert.equal(emulatedNidaInput(key("KeyA", "A", { shiftKey: true }), "khmer"), "ាំ");
  assert.equal(emulatedNidaInput(key("Digit1", "1"), "khmer"), "១");
  // AZERTY: the A key position reports "q" but is still physical KeyA.
  assert.equal(emulatedNidaInput(key("KeyA", "q"), "khmer"), "ា");
  // Mac Option+O (types ø) → ឱ
  assert.equal(emulatedNidaInput(key("KeyO", "ø", { altKey: true }), "khmer"), "ឱ");
});

test("physical key detection: a real Khmer keyboard, IME and shortcuts are left alone", () => {
  assert.equal(emulatedNidaInput(key("KeyK", "ក"), "khmer"), null);
  assert.equal(emulatedNidaInput(key("KeyK", "Process"), "khmer"), null);
  assert.equal(emulatedNidaInput(key("KeyK", "k", { isComposing: true }), "khmer"), null);
  assert.equal(emulatedNidaInput(key("KeyC", "c", { metaKey: true }), "khmer"), null);
  assert.equal(emulatedNidaInput(key("KeyC", "c", { ctrlKey: true }), "khmer"), null);
  assert.equal(emulatedNidaInput(key("Backspace", "Backspace"), "khmer"), null);
  assert.equal(emulatedNidaInput(key("Space", " "), "khmer"), null);
  assert.equal(emulatedNidaInput(key("Digit1", "!", { shiftKey: true }), "khmer"), null); // same output either way
  assert.equal(emulatedNidaInput(key("KeyK", "k"), "english"), null);
});

test("game input resolves Khmer from either a Khmer or a Latin OS keyboard", () => {
  assert.equal(resolveKey({ key: "k", code: "KeyK", shiftKey: false }, "khmer"), "ក");
  assert.equal(resolveKey({ key: "ក", code: "KeyK", shiftKey: false }, "khmer"), "ក");
  assert.equal(resolveKey({ key: "ាំ", code: "KeyA", shiftKey: true }, "khmer"), "ាំ");
  assert.equal(resolveKey({ key: "ø", code: "KeyO", shiftKey: false, altKey: true }, "khmer"), "ឱ");
});

test("a two-code-point NiDA key is one keystroke for accuracy", () => {
  assert.deepEqual(keystrokesOf(["ា", "ំ"], ["ា", "ំ"], "khmer"), { total: 1, wrong: 0 });
  assert.deepEqual(keystrokesOf(["ា", "ំ"], ["ា", "ក"], "khmer"), { total: 1, wrong: 1 });
  assert.deepEqual(keystrokesOf(["ក", "្", "រ"], ["ក", "្", "ទ"], "khmer"), { total: 3, wrong: 1 });
  assert.deepEqual(keystrokesOf(["a", "b"], ["a", "c"], "english"), { total: 2, wrong: 1 });
});

test("Khmer mistyped words are tracked and become a word drill", async () => {
  const { tallyWordsFromText } = await import("@/lib/progress/progress-storage");
  const { buildDrillText, parseWords } = await import("@/lib/progress/drill-params");
  const { createTally } = await import("@/lib/progress/progress-storage");
  const tally = createTally();
  const target = "ខ្ញុំរៀនវាយ";
  const typed = target.replace("រៀន", "រៀម");
  tallyWordsFromText(tally, "khmer", target, typed);
  const words = (tally as unknown as { words: Record<string, { n: number; e: number }> }).words;
  assert.equal(words["khmer:រៀន"]?.e, 1);
  assert.equal(words["khmer:ខ្ញុំ"]?.e, 0);
  assert.deepEqual(parseWords("រៀន,abc", "khmer"), ["រៀន"]);
  const drill = buildDrillText("khmer", { words: "រៀន" }, () => 0);
  assert.ok(drill && drill.includes("រៀន"));
});

test("subscript DA and subscript TA look the same, so either is accepted", () => {
  const target = "ម្ដាយ";
  const viaTa = cps("ម្តាយ"); // J then T
  const viaDa = cps("ម្ដាយ"); // J then D
  assert.equal(scoreTyping(target, viaTa, "khmer").mistakes.length, 0);
  assert.equal(scoreTyping(target, viaDa, "khmer").mistakes.length, 0);
  assert.equal(scoreTyping("ម្តាយ", viaDa, "khmer").correct, 5);
});
