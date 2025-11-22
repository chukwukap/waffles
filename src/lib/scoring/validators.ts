/**
 * Scoring System Validators
 *
 * Input validation and sanitization for score calculations.
 */

import type { ScoreInput, ValidationResult, QuestionDifficulty } from "./types";
import { QuestionDifficulty as Difficulty } from "./types";

/**
 * Validates and sanitizes score calculation inputs
 *
 * @param input - Raw score input parameters
 * @returns Validation result with sanitized values or error
 */
export function validateScoreInput(input: ScoreInput): ValidationResult {
  // Validate maxTimeSec
  if (!Number.isFinite(input.maxTimeSec) || input.maxTimeSec <= 0) {
    return {
      isValid: false,
      error: `Invalid maxTimeSec: ${input.maxTimeSec}. Must be a positive number.`,
    };
  }

  // Validate timeTakenMs
  if (!Number.isFinite(input.timeTakenMs) || input.timeTakenMs < 0) {
    return {
      isValid: false,
      error: `Invalid timeTakenMs: ${input.timeTakenMs}. Must be non-negative.`,
    };
  }

  // Convert time to seconds and clamp to valid range
  const timeTakenSec = input.timeTakenMs / 1000;
  const clampedTimeSec = Math.min(Math.max(0, timeTakenSec), input.maxTimeSec);

  // Validate and default difficulty
  const difficulty = input.difficulty ?? Difficulty.MEDIUM;
  if (!Object.values(Difficulty).includes(difficulty)) {
    return {
      isValid: false,
      error: `Invalid difficulty: ${input.difficulty}. Must be EASY, MEDIUM, or HARD.`,
    };
  }

  // Validate and default consecutiveCorrect
  const consecutiveCorrect = input.consecutiveCorrect ?? 0;
  if (
    !Number.isFinite(consecutiveCorrect) ||
    consecutiveCorrect < 0 ||
    !Number.isInteger(consecutiveCorrect)
  ) {
    return {
      isValid: false,
      error: `Invalid consecutiveCorrect: ${input.consecutiveCorrect}. Must be a non-negative integer.`,
    };
  }

  // Clamp consecutive correct to reasonable maximum (prevent exploits)
  const clampedConsecutive = Math.min(consecutiveCorrect, 100);

  return {
    isValid: true,
    sanitized: {
      timeTakenSec: clampedTimeSec,
      maxTimeSec: input.maxTimeSec,
      difficulty,
      consecutiveCorrect: clampedConsecutive,
    },
  };
}

/**
 * Fast validation for hot paths (skips detailed error messages)
 *
 * @param timeTakenMs - Time taken in milliseconds
 * @param maxTimeSec - Maximum time in seconds
 * @returns True if inputs are valid
 */
export function isValidScoreInput(
  timeTakenMs: number,
  maxTimeSec: number
): boolean {
  return (
    Number.isFinite(timeTakenMs) &&
    Number.isFinite(maxTimeSec) &&
    timeTakenMs >= 0 &&
    maxTimeSec > 0
  );
}

/**
 * Sanitizes time values without validation (assumes pre-validated)
 *
 * @param timeTakenMs - Time taken in milliseconds
 * @param maxTimeSec - Maximum time in seconds
 * @returns Clamped time in seconds
 */
export function sanitizeTime(timeTakenMs: number, maxTimeSec: number): number {
  const timeSec = timeTakenMs / 1000;
  return Math.min(Math.max(0, timeSec), maxTimeSec);
}
