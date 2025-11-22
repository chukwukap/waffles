/**
 * Scoring System - Main Entry Point
 *
 * High-level API for calculating game scores with validation,
 * bonuses, and detailed breakdowns.
 */

import type { ScoreInput, ScoreResult } from "./types";
import { QuestionDifficulty } from "./types";
import {
  validateScoreInput,
  isValidScoreInput,
  sanitizeTime,
} from "./validators";
import {
  calculateTimeBonus,
  calculateComboBonus,
  getBasePoints,
  applyBonuses,
  createBreakdown,
  getScoreRange,
} from "./calculator";

// Re-export types and enums for convenience
export { QuestionDifficulty } from "./types";
export type { ScoreInput, ScoreResult, ScoreBreakdown } from "./types";

/**
 * Calculates score for an answer with full validation and breakdown
 *
 * This is the main entry point for score calculation. It:
 * 1. Validates all inputs
 * 2. Applies time-based bonuses (exponential decay)
 * 3. Applies combo bonuses (consecutive correct answers)
 * 4. Returns detailed breakdown for transparency
 *
 * @param input - Score calculation parameters
 * @returns Score result with breakdown, or throws on invalid input
 *
 * @example
 * ```typescript
 * const result = calculateScore({
 *   timeTakenMs: 3000,
 *   maxTimeSec: 10,
 *   isCorrect: true,
 *   difficulty: QuestionDifficulty.MEDIUM,
 *   consecutiveCorrect: 2
 * });
 *
 * console.log(result.score); // e.g., 2091
 * console.log(result.breakdown.timeBonus); // 0.91
 * console.log(result.breakdown.comboBonus); // 0.2
 * ```
 */
export function calculateScore(input: ScoreInput): ScoreResult {
  // Incorrect answers always get 0 points
  if (!input.isCorrect) {
    const breakdown = createBreakdown(0, 0, 0, input.timeTakenMs / 1000, false);
    return {
      score: 0,
      breakdown,
    };
  }

  // Validate and sanitize inputs
  const validation = validateScoreInput(input);
  if (!validation.isValid) {
    throw new Error(`Score calculation failed: ${validation.error}`);
  }

  const { timeTakenSec, maxTimeSec, difficulty, consecutiveCorrect } =
    validation.sanitized!;

  // Get base points for difficulty
  const basePoints = getBasePoints(difficulty);

  // Calculate bonuses
  const timeBonus = calculateTimeBonus(timeTakenSec, maxTimeSec);
  const comboBonus = calculateComboBonus(consecutiveCorrect);

  // Apply bonuses and create breakdown
  const finalScore = applyBonuses(basePoints, timeBonus, comboBonus);
  const breakdown = createBreakdown(
    basePoints,
    timeBonus,
    comboBonus,
    timeTakenSec,
    true
  );

  return {
    score: finalScore,
    breakdown,
  };
}

/**
 * Fast score calculation without validation (for performance-critical paths)
 *
 * Use this when inputs are already validated. Skips validation overhead
 * and doesn't create detailed breakdown.
 *
 * @param timeTakenMs - Time taken in milliseconds
 * @param maxTimeSec - Maximum time in seconds
 * @param isCorrect - Whether answer was correct
 * @param difficulty - Question difficulty (defaults to MEDIUM)
 * @param consecutiveCorrect - Consecutive correct count (defaults to 0)
 * @returns Final score as number
 *
 * @example
 * ```typescript
 * const score = calculateScoreFast(3000, 10, true);
 * console.log(score); // e.g., 1910
 * ```
 */
export function calculateScoreFast(
  timeTakenMs: number,
  maxTimeSec: number,
  isCorrect: boolean,
  difficulty?: QuestionDifficulty,
  consecutiveCorrect: number = 0
): number {
  if (!isCorrect) return 0;
  if (!isValidScoreInput(timeTakenMs, maxTimeSec)) return 0;

  const timeTakenSec = sanitizeTime(timeTakenMs, maxTimeSec);
  const basePoints = getBasePoints(difficulty ?? QuestionDifficulty.MEDIUM);
  const timeBonus = calculateTimeBonus(timeTakenSec, maxTimeSec);
  const comboBonus = calculateComboBonus(consecutiveCorrect);

  return applyBonuses(basePoints, timeBonus, comboBonus);
}

/**
 * Legacy compatibility: Simple time-based scoring
 *
 * Maintains backward compatibility with the old scoring system.
 * Uses MEDIUM difficulty and no combo bonus.
 *
 * @param timeTakenSec - Time taken in seconds
 * @param maxTimeSec - Maximum time in seconds
 * @returns Score (300-3000 range for compatibility)
 *
 * @deprecated Use calculateScore() for new implementations
 */
export function calculateScoreLegacy(
  timeTakenSec: number,
  maxTimeSec: number
): number {
  // Validate inputs
  if (!Number.isFinite(maxTimeSec) || maxTimeSec <= 0) {
    console.warn(
      `calculateScoreLegacy: Invalid maxTime (${maxTimeSec}). Returning 0.`
    );
    return 0;
  }

  // Clamp time
  const clampedTime = Math.min(Math.max(0, timeTakenSec), maxTimeSec);

  // Linear speed ratio (old formula)
  const speedRatio = (maxTimeSec - clampedTime) / maxTimeSec;

  // Old constants
  const basePoints = 300;
  const speedBonus = 2700;
  const score = basePoints + speedRatio * speedBonus;

  return Math.max(0, Math.round(score));
}

/**
 * Gets the possible score range for a difficulty level
 * Useful for UI display
 *
 * @param difficulty - Question difficulty
 * @returns Min and max possible scores
 */
export { getScoreRange };

// Export calculator functions for advanced usage
export {
  calculateTimeBonus,
  calculateComboBonus,
  getBasePoints,
  applyBonuses,
} from "./calculator";

// Export validators for external validation
export { validateScoreInput, isValidScoreInput } from "./validators";
