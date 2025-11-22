/**
 * Scoring Calculator
 *
 * Pure functions for calculating game scores with various bonuses.
 * All functions are side-effect free and fully testable.
 */

import {
  BASE_POINTS,
  MAX_TIME_BONUS,
  MAX_COMBO_BONUS,
  type QuestionDifficulty,
  type ScoreBreakdown,
} from "./types";

/**
 * Calculates time-based bonus using exponential decay
 *
 * Formula: bonus = MAX_TIME_BONUS * (1 - (timeTaken / maxTime)^2)
 *
 * This creates a curve that:
 * - Rewards instant answers heavily (100% bonus)
 * - Still gives decent bonus at 50% time (75% bonus)
 * - Minimal bonus near max time (0% bonus)
 *
 * @param timeTakenSec - Time taken in seconds (already sanitized)
 * @param maxTimeSec - Maximum time allowed in seconds
 * @returns Time bonus multiplier (0.0 to MAX_TIME_BONUS)
 */
export function calculateTimeBonus(
  timeTakenSec: number,
  maxTimeSec: number
): number {
  if (maxTimeSec <= 0) return 0;

  const ratio = timeTakenSec / maxTimeSec;
  // Exponential decay: (1 - ratio^2) gives better curve than linear
  const bonus = MAX_TIME_BONUS * (1 - Math.pow(ratio, 2));

  return Math.max(0, Math.min(MAX_TIME_BONUS, bonus));
}

/**
 * Calculates combo bonus based on consecutive correct answers
 *
 * Formula: bonus = min(consecutiveCorrect * 0.1, MAX_COMBO_BONUS)
 *
 * Progression:
 * - 0 streak: 0% bonus
 * - 1 streak: 10% bonus
 * - 2 streak: 20% bonus
 * - 5+ streak: 50% bonus (max)
 *
 * @param consecutiveCorrect - Number of consecutive correct answers
 * @returns Combo bonus multiplier (0.0 to MAX_COMBO_BONUS)
 */
export function calculateComboBonus(consecutiveCorrect: number): number {
  if (consecutiveCorrect <= 0) return 0;

  const bonus = consecutiveCorrect * 0.1;
  return Math.min(bonus, MAX_COMBO_BONUS);
}

/**
 * Gets base points for a question based on difficulty
 *
 * @param difficulty - Question difficulty level
 * @returns Base points for the difficulty
 */
export function getBasePoints(difficulty: QuestionDifficulty): number {
  return BASE_POINTS[difficulty];
}

/**
 * Calculates final score with all bonuses applied
 *
 * Formula:
 * finalScore = basePoints * (1 + timeBonus + comboBonus)
 *
 * Example (MEDIUM question, instant answer, 2 streak):
 * - basePoints = 1000
 * - timeBonus = 1.0 (100%)
 * - comboBonus = 0.2 (20%)
 * - totalMultiplier = 1 + 1.0 + 0.2 = 2.2
 * - finalScore = 1000 * 2.2 = 2200
 *
 * @param basePoints - Base points for the question
 * @param timeBonus - Time bonus multiplier
 * @param comboBonus - Combo bonus multiplier
 * @returns Final calculated score
 */
export function applyBonuses(
  basePoints: number,
  timeBonus: number,
  comboBonus: number
): number {
  const totalMultiplier = 1 + timeBonus + comboBonus;
  const finalScore = basePoints * totalMultiplier;

  // Round to nearest integer
  return Math.round(finalScore);
}

/**
 * Creates a complete score breakdown for transparency
 *
 * @param basePoints - Base points for the question
 * @param timeBonus - Time bonus multiplier
 * @param comboBonus - Combo bonus multiplier
 * @param timeTakenSec - Time taken in seconds
 * @param wasCorrect - Whether the answer was correct
 * @returns Detailed score breakdown
 */
export function createBreakdown(
  basePoints: number,
  timeBonus: number,
  comboBonus: number,
  timeTakenSec: number,
  wasCorrect: boolean
): ScoreBreakdown {
  const totalMultiplier = 1 + timeBonus + comboBonus;
  const finalScore = applyBonuses(basePoints, timeBonus, comboBonus);

  return {
    basePoints,
    timeBonus,
    comboBonus,
    totalMultiplier,
    finalScore,
    timeTakenSec,
    wasCorrect,
  };
}

/**
 * Calculates score range for a given difficulty
 * Useful for UI display and validation
 *
 * @param difficulty - Question difficulty
 * @returns Min and max possible scores
 */
export function getScoreRange(difficulty: QuestionDifficulty): {
  min: number;
  max: number;
} {
  const base = getBasePoints(difficulty);
  const min = base; // No bonuses
  const max = applyBonuses(base, MAX_TIME_BONUS, MAX_COMBO_BONUS);

  return { min, max };
}
