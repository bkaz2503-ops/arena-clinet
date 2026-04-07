export type ScoreInput = {
  isCorrect: boolean;
  responseTimeMs: number;
  timeLimitSeconds: number;
};

export type ScoreBreakdown = {
  total: number;
  base: number;
  speedBonus: number;
};

const BASE_SCORE = 1000;
const MAX_SPEED_BONUS = 1000;

export function calculateAnswerScore({
  isCorrect,
  responseTimeMs,
  timeLimitSeconds
}: ScoreInput): ScoreBreakdown {
  if (!isCorrect) {
    return {
      total: 0,
      base: 0,
      speedBonus: 0
    };
  }

  const timeLimitMs = Math.max(1, timeLimitSeconds * 1000);
  const safeResponseTime = Math.min(Math.max(responseTimeMs, 0), timeLimitMs);
  const remainingRatio = 1 - safeResponseTime / timeLimitMs;
  const speedBonus = Math.round(remainingRatio * MAX_SPEED_BONUS);

  return {
    total: BASE_SCORE + speedBonus,
    base: BASE_SCORE,
    speedBonus
  };
}
