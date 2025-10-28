// Constant defining the maximum gap allowed between games to maintain a streak (in milliseconds)
// ~1.1 days (24 * 1.1 * 60 * 60 * 1000 = 95,040,000 ms) allows for slight variations around day boundaries.
const MAX_STREAK_GAP_MS = 1.1 * 24 * 60 * 60 * 1000; //

/**
 * Calculates the current consecutive game playing streak based on game end dates.
 * A streak continues if the gap between consecutive game end times is within
 * approximately 1.1 days.
 *
 * @param {Date[]} gameDates - An array of Date objects representing when games were completed/ended.
 * @returns {number} The length of the current consecutive playing streak (0 if no games played).
 */
export function calculateStreak(gameDates: Date[]): number {
  // 1. Handle Empty Input or Invalid Data
  // Filter out any potentially invalid date objects first
  const validDates =
    gameDates?.filter(
      (date) => date instanceof Date && !isNaN(date.getTime())
    ) || [];

  if (validDates.length === 0) {
    return 0; // No games played, streak is 0 [cite: 1651]
  }
  if (validDates.length === 1) {
    return 1; // Only one game played, streak is 1
  }

  // 2. Sort Dates: Most recent game first (descending order)
  const sortedDates = validDates.sort((a, b) => b.getTime() - a.getTime()); // [cite: 1652]

  // 3. Calculate Streak
  let streak = 1; // Start streak at 1 (for the most recent game) [cite: 1652]
  // Iterate from the second most recent game backwards
  for (let i = 1; i < sortedDates.length; i++) {
    // [cite: 1653]
    // Calculate the time difference between the current game and the previous (more recent) one
    const diffMs = sortedDates[i - 1].getTime() - sortedDates[i].getTime(); // [cite: 1653]

    // Check if the difference is within the allowed gap
    if (diffMs <= MAX_STREAK_GAP_MS) {
      // Compare against the constant [cite: 1654]
      streak++; // Increment streak if within the gap [cite: 1654]
    } else {
      // If the gap is too large, the streak is broken
      break; // Stop counting [cite: 1654]
    }
  }

  // 4. Return the calculated streak length
  return streak; //
}
