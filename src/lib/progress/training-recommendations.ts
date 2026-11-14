import { drillHref, letterJumpHref } from "@/lib/progress/drill-params";
import { analyzeKeyboard, drillCharsFor, physicalKeyName, weakKeysOf, keyCapGlyph, MIN_SAMPLES } from "@/lib/progress/keyboard-analytics";
import { enT, type Translate } from "@/lib/i18n";
import type { Language } from "@/types";
import type { ProgressStore, SessionRecord } from "@/types/progress";

export type RecommendationAction = { label: string; href: string; kind: "practice" | "game" };
export type RecommendationCategory = "weak-keys" | "home-row" | "combinations" | "words" | "speed" | "accuracy" | "consistency" | "advance";

export type Recommendation = {
  id: string;
  priority: "high" | "medium" | "low";
  category: RecommendationCategory;
  language: Language;
  title: string;
  /** Why this was recommended, quoting the data it is based on. */
  reason: string;
  minutes: number;
  actions: RecommendationAction[];
};

/** Minimum evidence before a recommendation of each kind is made. */
export const THRESHOLDS = {
  /** sessions in a language before speed/accuracy/consistency advice */
  minSessions: 3,
  consistencySessions: 5,
  recentWindow: 6,
  /** key-pair attempts needed before a combination counts as weak */
  minPairSamples: 8,
  pairWeakBelow: 80,
  minWordSamples: 3,
  wordWeakAbove: 0.4,
  homeRowSamples: 100,
  homeRowBelow: 92,
  accuracyBelow: 90,
  /** average WPM under which we suggest speed work (only when accuracy is fine) */
  slowWpm: { english: 25, khmer: 15 } as Record<Language, number>,
  /** accuracy and average WPM at which harder challenges are suggested */
  advanceAccuracy: 95,
  fastWpm: { english: 40, khmer: 25 } as Record<Language, number>,
  /** coefficient of variation of WPM, or std-dev of accuracy in points */
  wpmVariation: 0.35,
  accuracySpread: 10,
};

const HOME_ROW = ["KeyA", "KeyS", "KeyD", "KeyF", "KeyG", "KeyH", "KeyJ", "KeyK", "KeyL", "Semicolon"];
const mean = (v: number[]) => v.reduce((a, b) => a + b, 0) / v.length;
const stdev = (v: number[]) => {
  const m = mean(v);
  return Math.sqrt(mean(v.map((x) => (x - m) ** 2)));
};
const list = (items: string[]) => items.join(", ");

function recentFor(sessions: SessionRecord[], language: Language) {
  return sessions
    .filter((s) => s.language === language)
    .sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt))
    .slice(0, THRESHOLDS.recentWindow);
}

function languageRecommendations(store: ProgressStore, language: Language, t: Translate): Recommendation[] {
  const out: Recommendation[] = [];
  const name = t(`category.${language}`);
  const analysis = analyzeKeyboard(store, language);
  const recent = recentFor(store.sessions, language);
  const start = t("rec.actStart");
  const practiceHref = (extra?: Record<string, string>) => drillHref(language, {}, extra);

  // 1. Frequently mistyped keys (only keys with enough keystrokes to be rated).
  const weak = weakKeysOf(analysis, 6);
  if (weak.length) {
    const chars = [...new Set(weak.flatMap(drillCharsFor))].slice(0, 8);
    const worst = weak[0].accuracy ?? 100;
    out.push({
      id: `weak-keys:${language}`,
      priority: worst < 75 ? "high" : "medium",
      category: "weak-keys",
      language,
      title: t("rec.weakTitle", { lang: name }),
      reason: t("rec.weakReason", { list: list(weak.map((k) => t("rec.weakItem", { key: language === "khmer" ? `${keyCapGlyph(language, k.code)} (${physicalKeyName(k.code)})` : physicalKeyName(k.code), acc: k.accuracy ?? 0 }))), n: MIN_SAMPLES }),
      minutes: 5,
      actions: [
        { label: start, href: drillHref(language, { drill: chars.join("") }, { time: "300" }), kind: "practice" },
        { label: t("rec.actJumpKeys"), href: letterJumpHref(language, chars), kind: "game" },
      ],
    });
  }

  // 2. English home row.
  if (language === "english") {
    const rows = HOME_ROW.map((c) => analysis[c]).filter(Boolean);
    const total = rows.reduce((s, k) => s + k.total, 0), correct = rows.reduce((s, k) => s + k.correct, 0);
    const acc = total ? Math.round((correct / total) * 100) : 100;
    if (total >= THRESHOLDS.homeRowSamples && acc < THRESHOLDS.homeRowBelow) {
      out.push({
        id: "home-row:english",
        priority: acc < 85 ? "high" : "medium",
        category: "home-row",
        language,
        title: t("rec.homeTitle"),
        reason: t("rec.homeReason", { acc, n: total }),
        minutes: 5,
        actions: [
          { label: start, href: drillHref(language, { drill: "asdfghjkl;" }, { time: "300" }), kind: "practice" },
          { label: t("rec.actJumpHome"), href: letterJumpHref(language, ["a", "s", "d", "f", "j", "k", "l"]), kind: "game" },
        ],
      });
    }
  }

  // 3. Low-accuracy character combinations.
  const pairs = Object.entries(store.pairs)
    .filter(([id, t]) => id.startsWith(`${language}:`) && t.n >= THRESHOLDS.minPairSamples && (t.c / t.n) * 100 < THRESHOLDS.pairWeakBelow)
    .map(([id, t]) => ({ pair: id.slice(language.length + 1), n: t.n, acc: Math.round((t.c / t.n) * 100) }))
    .sort((a, b) => a.acc - b.acc || b.n - a.n)
    .slice(0, 6);
  if (pairs.length) {
    out.push({
      id: `combinations:${language}`,
      priority: "medium",
      category: "combinations",
      language,
      title: t(language === "khmer" ? "rec.comboTitleKm" : "rec.comboTitleEn"),
      reason: t("rec.comboReason", { list: list(pairs.map((p) => `${p.pair} ${p.acc}%`)), n: pairs.reduce((s, p) => s + p.n, 0) }),
      minutes: 5,
      actions: [{ label: start, href: drillHref(language, { combo: pairs.map((p) => p.pair).join(",") }, { time: "300" }), kind: "practice" }],
    });
  }

  // 4. Words this learner often mistypes (Khmer words come from the dictionary word breaker).
  {
    const prefix = `${language}:`;
    const words = Object.entries(store.words)
      .filter(([id, w]) => id.startsWith(prefix) && w.n >= THRESHOLDS.minWordSamples && w.e / w.n >= THRESHOLDS.wordWeakAbove)
      .map(([id, w]) => ({ word: id.slice(prefix.length), n: w.n, e: w.e }))
      .sort((a, b) => b.e / b.n - a.e / a.n || b.n - a.n)
      .slice(0, 5);
    if (words.length) {
      out.push({
        id: `words:${language}`,
        priority: "medium",
        category: "words",
        language,
        title: t("rec.wordsTitle"),
        reason: t("rec.wordsReason", { list: list(words.map((w) => t("rec.wordItem", { word: w.word, e: w.e, n: w.n }))) }),
        minutes: 3,
        actions: [
          { label: start, href: drillHref(language, { words: words.map((w) => w.word).join(",") }, { time: "120" }), kind: "practice" },
          ...(language === "english" ? [{ label: t("rec.actWordSprint"), href: "/games/word-sprint", kind: "game" as const }] : []),
        ],
      });
    }
  }

  // 5-7. Session-level patterns need a few sessions in this language.
  if (recent.length >= THRESHOLDS.minSessions) {
    const avgWpm = Math.round(mean(recent.map((s) => s.wpm)));
    const avgAcc = Math.round(mean(recent.map((s) => s.accuracy)));

    if (avgAcc < THRESHOLDS.accuracyBelow) {
      out.push({
        id: `accuracy:${language}`,
        priority: avgAcc < 80 ? "high" : "medium",
        category: "accuracy",
        language,
        title: t("rec.accTitle", { lang: name }),
        reason: t("rec.accReason", { acc: avgAcc, n: recent.length, lang: name }),
        minutes: 5,
        actions: [{ label: start, href: practiceHref({ time: "120" }), kind: "practice" }],
      });
    } else if (avgWpm < THRESHOLDS.slowWpm[language]) {
      out.push({
        id: `speed:${language}`,
        priority: "low",
        category: "speed",
        language,
        title: t("rec.speedTitle", { lang: name }),
        reason: t("rec.speedReason", { wpm: avgWpm, acc: avgAcc, n: recent.length }),
        minutes: 5,
        actions: [
          { label: t("rec.actWordSprintBeg"), href: "/games/word-sprint", kind: "game" },
          { label: start, href: practiceHref({ time: "300" }), kind: "practice" },
        ],
      });
    } else if (avgAcc >= THRESHOLDS.advanceAccuracy && avgWpm >= THRESHOLDS.fastWpm[language]) {
      out.push({
        id: `advance:${language}`,
        priority: "low",
        category: "advance",
        language,
        title: t("rec.advTitle", { lang: name }),
        reason: t("rec.advReason", { wpm: avgWpm, acc: avgAcc, n: recent.length }),
        minutes: 5,
        actions: [
          { label: t("rec.actTest"), href: "/test", kind: "practice" },
          { label: t("rec.actHardGame"), href: "/games/space-shooter", kind: "game" },
        ],
      });
    }

    if (recent.length >= THRESHOLDS.consistencySessions) {
      const wpms = recent.map((s) => s.wpm), accs = recent.map((s) => s.accuracy);
      const m = mean(wpms);
      const cv = m > 0 ? stdev(wpms) / m : 0;
      const spread = stdev(accs);
      if (cv >= THRESHOLDS.wpmVariation || spread >= THRESHOLDS.accuracySpread) {
        out.push({
          id: `consistency:${language}`,
          priority: "low",
          category: "consistency",
          language,
          title: t("rec.consTitle", { lang: name }),
          reason: t("rec.consReason", { n: recent.length, w1: Math.min(...wpms), w2: Math.max(...wpms), a1: Math.min(...accs), a2: Math.max(...accs) }),
          minutes: 5,
          actions: [{ label: t("rec.actStart5"), href: practiceHref({ time: "300" }), kind: "practice" }],
        });
      }
    }
  }
  return out;
}

const ORDER = { high: 0, medium: 1, low: 2 } as const;

/** Recommendations computed only from stored sessions and key statistics, never random. */
export function buildRecommendations(store: ProgressStore, t: Translate = enT): Recommendation[] {
  return (["english", "khmer"] as const)
    .flatMap((language) => languageRecommendations(store, language, t))
    .sort((a, b) => ORDER[a.priority] - ORDER[b.priority]);
}

/** How much data exists, to explain an empty list honestly. */
export function dataReadiness(store: ProgressStore) {
  const keystrokes = Object.values(store.keys).reduce((s, k) => s + k.n, 0);
  return { sessions: store.sessions.length, keystrokes, enough: store.sessions.length >= THRESHOLDS.minSessions && keystrokes >= MIN_SAMPLES * 3 };
}
