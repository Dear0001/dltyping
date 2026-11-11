// One place where a finished arcade run is written everywhere it belongs:
// the game's personal bests, the dashboard session log, and arcade progression.
import { baseDifficulty } from "@/lib/arcade/difficulty";
import { recordArcadeResult, type ArcadeResult, type ResultOutcome } from "@/lib/arcade/progress";
import type { ScoreBreakdown } from "@/lib/arcade/scoring";
import { recordScore } from "@/lib/local-progress";
import type { SessionInput, SessionRecord } from "@/types/progress";

export type RunReport = { result: ArcadeResult; breakdown: ScoreBreakdown; outcome: ResultOutcome; /** Best score for this exact setup before the run. */ setupBest: number; newBest: boolean };

type Recorder = { finish: (input: SessionInput) => SessionRecord | null };

/**
 * Saves a run. `variant` is the personal-best key (game:language:difficulty…),
 * `previousBest` the best for that key before this run.
 */
export function saveRun(result: ArcadeResult, breakdown: ScoreBreakdown, variant: string, previousBest: number, recorder: Recorder): RunReport {
  const newBest = recordScore(variant, { score: result.score, wpm: result.wpm, accuracy: result.accuracy });
  recorder.finish({
    activity: result.game,
    language: result.language,
    durationSec: result.durationMs / 1000,
    correct: result.correctChars,
    incorrect: result.mistakes,
    score: result.score,
    difficulty: baseDifficulty(result.difficulty),
    wpm: result.wpm,
    accuracy: result.accuracy,
    ...(result.detail ? { detail: result.detail } : {}),
  });
  const outcome = recordArcadeResult(result);
  return { result, breakdown, outcome, setupBest: Math.max(previousBest, result.score), newBest: newBest && result.score > 0 };
}
