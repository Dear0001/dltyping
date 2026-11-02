export function getTypingStats(target: string, input: string, elapsedSeconds: number) {
  const chars = Array.from(input);
  const goal = Array.from(target);
  let correct = 0;
  let errors = 0;
  chars.forEach((char, index) => (char === goal[index] ? correct++ : errors++));
  const minutes = Math.max(elapsedSeconds, 1) / 60;
  return {
    wpm: Math.round(correct / 5 / minutes),
    accuracy: chars.length ? Math.round((correct / chars.length) * 100) : 100,
    errors,
    correct,
    typed: chars.length,
    progress: goal.length ? Math.min(100, Math.round((chars.length / goal.length) * 100)) : 0,
  };
}
