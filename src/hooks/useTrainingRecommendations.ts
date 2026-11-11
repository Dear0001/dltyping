"use client";

import { useMemo } from "react";
import { useLocale } from "@/components/shared/LocaleProvider";
import { useTypingProgress } from "@/hooks/useTypingProgress";
import { buildRecommendations, dataReadiness } from "@/lib/progress/training-recommendations";

export function useTrainingRecommendations() {
  const { store, hydrated } = useTypingProgress();
  const { t, locale } = useLocale();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- t only changes with the locale
  return useMemo(() => ({ hydrated, recommendations: buildRecommendations(store, t), readiness: dataReadiness(store) }), [store, hydrated, locale]);
}
