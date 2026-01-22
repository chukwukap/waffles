/**
 * Game Scoring System
 *
 * Fair, linear time-based scoring.
 * Faster answers get more points, simple as that.
 *
 * Score range: 1,000 (at deadline) to 10,000 (instant)
 */

const MAX_POINTS = 10000;
const MIN_POINTS = 1000;

/**
 * Calculate score for an answer.
 *
 * Formula: score = MIN + (MAX - MIN) * (timeRemaining / maxTime)
 *
 * Examples (10 second question):
 * - Answer in 0s   → 10,000 points
 * - Answer in 5s   → 5,500 points
 * - Answer in 10s  → 1,000 points
 *
 * @param timeTakenMs - Time taken in milliseconds
 * @param maxTimeSec - Maximum time allowed in seconds
 * @param isCorrect - Whether the answer was correct
 * @returns Score (0 for wrong, 1000-10000 for correct)
 */
export function getScore(
  timeTakenMs: number,
  maxTimeSec: number,
  isCorrect: boolean,
): number {
  // Wrong answers get 0
  if (!isCorrect) return 0;

  // Validate inputs
  if (!Number.isFinite(timeTakenMs) || timeTakenMs < 0) return MIN_POINTS;
  if (!Number.isFinite(maxTimeSec) || maxTimeSec <= 0) return MIN_POINTS;

  // Convert to seconds and clamp
  const timeTakenSec = Math.min(Math.max(0, timeTakenMs / 1000), maxTimeSec);

  // Linear interpolation: faster = more points
  const timeRemaining = maxTimeSec - timeTakenSec;
  const speedRatio = timeRemaining / maxTimeSec;
  const score = MIN_POINTS + (MAX_POINTS - MIN_POINTS) * speedRatio;

  return Math.round(score);
}
