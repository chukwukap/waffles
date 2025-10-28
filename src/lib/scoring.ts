/**
 * Calculates the score awarded for a correct answer based on the time taken
 * relative to the maximum time allowed for the question.
 *
 * The scoring formula gives a base amount and adds bonus points for speed.
 * - Max score (timeTaken = 0) = 300 + 2700 = 3000
 * - Min score (timeTaken = maxTime) = 300 + 0 = 300
 * - Score decreases linearly as timeTaken increases.
 *
 * @param timeTaken - Time the user took to answer, in seconds (non-negative).
 * @param maxTime - Maximum time allowed for the question, in seconds (must be positive).
 * @returns The calculated score (integer, non-negative). Returns 0 if maxTime is invalid.
 */
export function calculateScore(timeTaken: number, maxTime: number): number {
  // Validate maxTime to prevent division by zero or negative results
  if (!Number.isFinite(maxTime) || maxTime <= 0) {
    console.warn(
      `calculateScore: Invalid maxTime (${maxTime}). Returning 0 points.`
    );
    return 0; // Return 0 if maxTime is invalid
  }

  // Clamp timeTaken to be within [0, maxTime]
  const clampedTime = Math.min(Math.max(0, timeTaken), maxTime); // [cite: 1602]

  // Calculate the speed ratio (1.0 for instant answer, 0.0 for max time)
  const speedRatio = (maxTime - clampedTime) / maxTime; // [cite: 1602]

  // Calculate base points + bonus points based on speed
  const basePoints = 300; // Minimum points for a correct answer
  const speedBonus = 2700; // Maximum bonus points for speed
  const calculatedScore = basePoints + speedRatio * speedBonus; // [cite: 1603]

  // Return the rounded, non-negative score
  return Math.max(0, Math.round(calculatedScore)); // [cite: 1603]
}

/**
 * Determines if a chosen item matches a target item in the final round.
 * NOTE: This is a placeholder implementation. Replace with actual matching logic.
 *
 * @param choiceId - The ID of the item the user chose.
 * @param targetId - The ID of the item the user tried to match against.
 * @returns True if the items are considered a match, false otherwise.
 */
export function isMatch(
  choiceId: number | string | null | undefined,
  targetId: number | string | null | undefined
): boolean {
  // Basic check: Ensure both IDs are provided and valid numbers/strings before comparing
  if (choiceId == null || targetId == null) {
    return false; // Cannot match if either ID is missing
  }

  // TODO: Implement actual matching logic based on how pairs are defined.
  // This placeholder assumes a match occurs if the IDs are identical.
  // In a real scenario, you might compare originalImageId to generatedImageId
  // or look up relationships in a database/mapping.
  return String(choiceId) === String(targetId); // Simple ID comparison (adjust as needed) [cite: 1604]
}
