"use client";

import { useMemo } from "react";
import { useTypingProgress } from "@/hooks/useTypingProgress";
import { buildRecommendations, dataReadiness } from "@/lib/progress/training-recommendations";

export function useTrainingRecommendations() {
  const { store, hydrated } = useTypingProgress();
  return useMemo(() => ({ hydrated, recommendations: buildRecommendations(store), readiness: dataReadiness(store) }), [store, hydrated]);
}
