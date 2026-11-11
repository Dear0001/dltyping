"use client";

import { useLocale } from "@/components/shared/LocaleProvider";
import { EXCELLENT_AT, GOOD_AT, MIN_SAMPLES, physicalKeyName, type KeyAnalysis, type MasteryLevel } from "@/lib/progress/keyboard-analytics";
import { MIN_TIMED, msToWpm, type KeySpeed } from "@/lib/progress/key-speed";
import type { ActivityType, SessionRecord } from "@/types/progress";

/** Localized labels for the analytics in lib/progress (which keeps English as its reference). */
export function useProgressText() {
  const { t, locale } = useLocale();
  const keyName = (code: string) => (code === "Space" ? t("km.space") : physicalKeyName(code));
  const masteryLabel = (l: MasteryLevel) => t(`km.mastery.${l}`);
  const masteryBlurb = (l: MasteryLevel) => {
    switch (l) {
      case "excellent": return t("km.mastery.excellentB", { n: EXCELLENT_AT });
      case "good": return t("km.mastery.goodB", { a: GOOD_AT, b: EXCELLENT_AT - 1 });
      case "weak": return t("km.mastery.weakB", { n: GOOD_AT });
      case "learning": return t("km.mastery.learningB", { n: MIN_SAMPLES });
      default: return t("km.mastery.noneB");
    }
  };
  const speedLabel = (l: MasteryLevel) => t(`km.speed.${l}`);
  const speedBlurb = (l: MasteryLevel) => (l === "learning" ? t("km.speed.learningB", { n: MIN_TIMED }) : t(`km.speed.${l}B`));
  return {
    locale,
    keyName,
    masteryLabel, masteryBlurb, speedLabel, speedBlurb,
    activityLabel: (a: ActivityType) => (a === "lesson" || a === "typing-test" || a === "drill" ? t(`act.${a}`) : t(`act.d.${a}`)),
    describeSession: (s: SessionRecord) => t(`act.d.${s.activity}`, { lang: t(`category.${s.language}`) }),
    lastPracticed: (ms: number | null, now: number) => {
      if (ms === null) return t("km.last.never");
      const days = Math.floor((now - ms) / 86_400_000);
      if (days <= 0) return t("km.last.today");
      if (days === 1) return t("km.last.yesterday");
      if (days < 30) return t("km.last.daysAgo", { n: days });
      return new Date(ms).toLocaleDateString(locale === "km" ? "km-KH" : "en-US", { month: "short", day: "numeric", year: "numeric" });
    },
    keyTooltip: (a: KeyAnalysis) => {
      const name = keyName(a.code);
      if (a.total === 0) return t("km.tip.none", { name });
      if (a.level === "learning") return t("km.tip.learning", { name, acc: a.accuracy ?? 0, total: a.total, more: a.samplesNeeded });
      return t("km.tip.rated", { name, acc: a.accuracy ?? 0, total: a.total, label: masteryLabel(a.level) });
    },
    speedTip: (code: string, s: KeySpeed) => (s.avgMs === null ? t("km.tip.speedNone", { name: keyName(code) }) : t("km.tip.speed", { name: keyName(code), ms: Math.round(s.avgMs), wpm: msToWpm(s.avgMs), timed: s.timed })),
  };
}
