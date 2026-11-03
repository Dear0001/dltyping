import assert from "node:assert/strict";
import { test } from "node:test";
import { englishQwerty } from "@/components/keyboard/layouts/english-qwerty";
import { khmerNida } from "@/components/keyboard/layouts/khmer-nida";
import { macLayout } from "@/components/keyboard/layouts/mac";
import { windowsLayout } from "@/components/keyboard/layouts/windows";
import { FINGER_ASSIGNMENTS, FINGER_COLORS, fingerForCode, handOf, shiftFor } from "@/lib/keyboard/finger-mapping";
import { describeGuidance, describeOutput, feedbackFor, guidanceFor, hintsVisible } from "@/lib/keyboard/typing-guidance";

const fingerOf = (lang: "english" | "khmer", ch: string, caps = false) => {
  const g = guidanceFor(lang, ch, caps);
  return g && { code: g.code, finger: g.finger, shift: g.shift?.code ?? null, shiftFinger: g.shift?.finger ?? null };
};

test("English QWERTY letters follow the standard touch-typing table", () => {
  const table: Record<string, string> = {
    "left-pinky": "qaz", "left-ring": "wsx", "left-middle": "edc", "left-index": "rfvtgb",
    "right-index": "yhnujm", "right-middle": "ik", "right-ring": "ol", "right-pinky": "p",
  };
  for (const [finger, letters] of Object.entries(table)) for (const l of letters) assert.equal(fingerOf("english", l)?.finger, finger, `${l} -> ${finger}`);
  assert.equal(fingerOf("english", ",")?.finger, "right-middle");
  assert.equal(fingerOf("english", ".")?.finger, "right-ring");
  assert.equal(fingerOf("english", ";")?.finger, "right-pinky");
  assert.equal(fingerOf("english", "/")?.finger, "right-pinky");
  assert.equal(fingerOf("english", " ")?.finger, "right-thumb");
});

test("numbers, punctuation and modifiers have fingers", () => {
  const f = (code: string) => fingerForCode(code);
  assert.deepEqual(["Digit1", "Digit2", "Digit3", "Digit4", "Digit5"].map(f), ["left-pinky", "left-ring", "left-middle", "left-index", "left-index"]);
  assert.deepEqual(["Digit6", "Digit7", "Digit8", "Digit9", "Digit0"].map(f), ["right-index", "right-index", "right-middle", "right-ring", "right-pinky"]);
  for (const c of ["Minus", "Equal", "BracketLeft", "BracketRight", "Backslash", "Quote", "Enter", "Backspace", "ShiftRight"]) assert.equal(f(c), "right-pinky", c);
  for (const c of ["Tab", "CapsLock", "ShiftLeft", "Backquote", "Escape"]) assert.equal(f(c), "left-pinky", c);
});

test("no physical key is assigned to two fingers, and every finger has colour data", () => {
  const seen = new Map<string, string>();
  for (const [finger, codes] of Object.entries(FINGER_ASSIGNMENTS)) for (const c of codes) { assert.equal(seen.get(c), undefined, `${c} duplicated`); seen.set(c, finger); }
  assert.equal(Object.keys(FINGER_COLORS).length, 5);
  assert.equal(new Set(Object.values(FINGER_COLORS)).size, 5);
});

test("Shift uses the opposite hand", () => {
  assert.deepEqual(fingerOf("english", "A"), { code: "KeyA", finger: "left-pinky", shift: "ShiftRight", shiftFinger: "right-pinky" });
  assert.deepEqual(fingerOf("english", "P"), { code: "KeyP", finger: "right-pinky", shift: "ShiftLeft", shiftFinger: "left-pinky" });
  assert.equal(fingerOf("english", "!")?.shift, "ShiftRight"); // Shift+1, a left-hand key
  assert.equal(fingerOf("english", "?")?.shift, "ShiftLeft"); // Shift+/, a right-hand key
  assert.equal(fingerOf("english", "a")?.shift, null);
  assert.equal(shiftFor("Space").code, "ShiftLeft");
  assert.equal(handOf(shiftFor("KeyB").finger), "right"); // B is a left-index key
});

test("Caps Lock flips the Shift need for English letters only", () => {
  assert.equal(fingerOf("english", "A", true)?.shift, null);
  assert.equal(fingerOf("english", "a", true)?.shift, "ShiftRight");
  assert.equal(fingerOf("english", "!", true)?.shift, "ShiftRight"); // symbols ignore Caps Lock
  assert.equal(fingerOf("khmer", "ឈ", true)?.shift, "ShiftRight"); // Khmer has no case
});

test("Khmer NiDA: physical key and Khmer output are separate", () => {
  assert.deepEqual(fingerOf("khmer", "ក"), { code: "KeyK", finger: "right-middle", shift: null, shiftFinger: null });
  assert.deepEqual(fingerOf("khmer", "ឆ"), { code: "KeyQ", finger: "left-pinky", shift: null, shiftFinger: null });
  assert.deepEqual(fingerOf("khmer", "ឈ"), { code: "KeyQ", finger: "left-pinky", shift: "ShiftRight", shiftFinger: "right-pinky" }); // same key, Shift layer
  assert.equal(fingerOf("khmer", "្")?.code, "KeyJ"); // coeng
  assert.equal(fingerOf("khmer", "ុ")?.code, "KeyU");
  assert.equal(fingerOf("khmer", "ា")?.code, "KeyA"); // base layer, not the shifted ាំ
  assert.equal(fingerOf("khmer", "ំ")?.code, "KeyM");
  assert.equal(fingerOf("khmer", "១")?.code, "Digit1");
  assert.equal(fingerOf("khmer", " ")?.finger, "right-thumb");
  const g = guidanceFor("khmer", "ក")!;
  assert.equal(describeOutput("khmer", g), "K key → ក");
  assert.equal(describeOutput("english", guidanceFor("english", "k")!), null);
  assert.match(describeGuidance(g), /right middle finger to press K/);
});

test("characters with no key in the layout give no guidance instead of a made-up key", () => {
  assert.equal(guidanceFor("english", "€"), null);
  assert.equal(guidanceFor("english", "é"), null);
  assert.equal(guidanceFor("khmer", "A"), null);
  assert.equal(guidanceFor("english", ""), null);
  assert.equal(guidanceFor("english", null), null);
});

test("Khmer NiDA and QWERTY use the same physical keys, so one finger table serves both", () => {
  assert.deepEqual(Object.keys(khmerNida).sort(), Object.keys(englishQwerty).sort());
  for (const code of Object.keys(khmerNida)) assert.ok(fingerForCode(code), `${code} has a finger`);
});

test("Mac and Windows boards: every character key, Space and Shift has a finger", () => {
  for (const layout of [macLayout, windowsLayout]) {
    const keys = layout.rows.flat().flatMap((k) => (k.stack ? k.stack : [k]));
    for (const k of keys.filter((k) => k.kind === "char" || k.kind === "space")) assert.ok(fingerForCode(k.code), `${layout.os} ${k.code}`);
    for (const c of ["ShiftLeft", "ShiftRight", "Enter", "Backspace", "Tab", "CapsLock"]) assert.ok(keys.some((k) => k.code === c) && fingerForCode(c), `${layout.os} ${c}`);
  }
});

test("guidance follows the typing engine through a string", () => {
  const steps = Array.from("Hi F;").map((ch) => guidanceFor("english", ch)!);
  assert.deepEqual(steps.map((g) => [g.keyName, g.finger, g.shift?.finger ?? null]), [
    ["H", "right-index", "left-pinky"],
    ["I", "right-middle", null],
    ["Space", "right-thumb", null],
    ["F", "left-index", "right-pinky"],
    [";", "right-pinky", null],
  ]);
  assert.equal(describeGuidance(steps[3]), "Use your left index finger to press F while your right hand holds Shift.");
  assert.equal(describeGuidance(guidanceFor("english", "f")!), "Use your left index finger to press F.");
  assert.equal(describeGuidance(guidanceFor("english", "f")!, "en", "short"), "F · left index finger");
});

test("feedback depends on mode and never leaks the answer in Challenge", () => {
  const g = guidanceFor("english", "f")!;
  assert.deepEqual(feedbackFor(null, g, "learning"), null);
  assert.equal(feedbackFor({ code: "KeyF", ok: true }, g, "learning")?.kind, "correct");
  const learn = feedbackFor({ code: "KeyJ", ok: false }, g, "learning")!;
  assert.equal(learn.kind, "wrong"); assert.equal(learn.wrongFinger, "right-index");
  assert.match(learn.text, /pressed J.*F with your left index finger/);
  assert.match(feedbackFor({ code: "KeyJ", ok: false }, g, "practice")!.text, /key is F/);
  const hard = feedbackFor({ code: "KeyJ", ok: false }, g, "challenge")!;
  assert.doesNotMatch(hard.text, /\bF\b|index/);
});

test("hint visibility by mode", () => {
  assert.equal(hintsVisible("learning", false), true);
  assert.equal(hintsVisible("practice", false), true);
  assert.equal(hintsVisible("challenge", false), false);
  assert.equal(hintsVisible("challenge", true), true);
});

test("Khmer UI wording exists for instructions and feedback", () => {
  const g = guidanceFor("english", "f")!;
  assert.match(describeGuidance(g, "km"), /ដៃឆ្វេង/);
  assert.match(feedbackFor({ code: "KeyJ", ok: true }, g, "learning", "km")!.text, /ត្រឹមត្រូវ/);
});
