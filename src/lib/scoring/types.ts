/**
 * Scoring System Types
 *
 * Clean, type-safe definitions for the game scoring system.
 */

/**
 * Question difficulty levels
 */
export enum QuestionDifficulty {
  EASY = "EASY",
  MEDIUM = "MEDIUM",
  HARD = "HARD",
}

/**
 * Base points awarded for correct answers by difficulty
 */
export const BASE_POINTS: Record<QuestionDifficulty, number> = {
  [QuestionDifficulty.EASY]: 500,
  [QuestionDifficulty.MEDIUM]: 1000,
  [QuestionDifficulty.HARD]: 1500,
} as const;

/**
 * Maximum possible bonus multipliers
 */
export const MAX_TIME_BONUS = 1.0; // 100% bonus for instant answer
export const MAX_COMBO_BONUS = 0.5; // 50% bonus for 5+ consecutive correct

/**
 * Input parameters for score calculation
 */
export interface ScoreInput {
  /** Time taken to answer in milliseconds */
  timeTakenMs: number;
  /** Maximum time allowed in seconds */
  maxTimeSec: number;
  /** Whether the answer was correct */
  isCorrect: boolean;
  /** Question difficulty level */
  difficulty?: QuestionDifficulty;
  /** Number of consecutive correct answers before this one */
  consecutiveCorrect?: number;
}

/**
 * Detailed breakdown of score calculation
 */
export interface ScoreBreakdown {
  /** Base points for the question */
  basePoints: number;
  /** Time-based bonus multiplier (0.0 to 1.0) */
  timeBonus: number;
  /** Combo bonus multiplier (0.0 to 0.5) */
  comboBonus: number;
  /** Total multiplier applied */
  totalMultiplier: number;
  /** Final calculated score */
  finalScore: number;
  /** Time taken in seconds */
  timeTakenSec: number;
  /** Whether the answer was correct */
  wasCorrect: boolean;
}

/**
 * Result of score calculation
 */
export interface ScoreResult {
  /** Final score to award */
  score: number;
  /** Detailed breakdown (for debugging/display) */
  breakdown: ScoreBreakdown;
}

/**
 * Validation result for score inputs
 */
export interface ValidationResult {
  /** Whether the input is valid */
  isValid: boolean;
  /** Error message if invalid */
  error?: string;
  /** Sanitized values if valid */
  sanitized?: {
    timeTakenSec: number;
    maxTimeSec: number;
    difficulty: QuestionDifficulty;
    consecutiveCorrect: number;
  };
}
