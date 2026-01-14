/**
 * Round Distribution Utility
 *
 * Automatically distributes questions evenly across rounds (max 3).
 * This replaces manual round assignment by admins.
 */

import { prisma } from "@/lib/db";

// Maximum number of rounds in a game
export const MAX_ROUNDS = 3;

/**
 * Calculate round distribution for a given number of questions.
 *
 * Returns an array where index = question position, value = round number (1-indexed).
 *
 * Examples:
 * - 10 questions → [1,1,1,1, 2,2,2, 3,3,3] (4-3-3)
 * - 9 questions  → [1,1,1, 2,2,2, 3,3,3]  (3-3-3)
 * - 6 questions  → [1,1, 2,2, 3,3]        (2-2-2)
 * - 3 questions  → [1, 2, 3]              (1-1-1)
 * - 2 questions  → [1, 2]                 (1-1, 2 rounds only)
 * - 1 question   → [1]                    (1 round only)
 */
export function distributeQuestionsIntoRounds(
  totalQuestions: number
): number[] {
  if (totalQuestions === 0) return [];

  // Determine actual number of rounds (max 3, but don't create empty rounds)
  const numRounds = Math.min(MAX_ROUNDS, totalQuestions);

  // Calculate questions per round
  const basePerRound = Math.floor(totalQuestions / numRounds);
  const remainder = totalQuestions % numRounds;

  // Build result array
  // First `remainder` rounds get one extra question for even distribution
  const result: number[] = [];
  for (let round = 1; round <= numRounds; round++) {
    const questionsInRound = basePerRound + (round <= remainder ? 1 : 0);
    for (let i = 0; i < questionsInRound; i++) {
      result.push(round);
    }
  }

  return result;
}

/**
 * Get the round number for a specific question index.
 */
export function getRoundForQuestionIndex(
  questionIndex: number,
  totalQuestions: number
): number {
  const distribution = distributeQuestionsIntoRounds(totalQuestions);
  return distribution[questionIndex] ?? 1;
}

/**
 * Get human-readable distribution summary.
 * E.g., "4-3-3" for 10 questions across 3 rounds.
 */
export function getDistributionSummary(totalQuestions: number): string {
  if (totalQuestions === 0) return "No questions";

  const distribution = distributeQuestionsIntoRounds(totalQuestions);
  const roundCounts: number[] = [];

  let currentRound = 0;
  for (const round of distribution) {
    if (round !== currentRound) {
      roundCounts.push(0);
      currentRound = round;
    }
    roundCounts[roundCounts.length - 1]++;
  }

  return roundCounts.join("-");
}

/**
 * Recalculate and update round assignments for all questions in a game.
 *
 * This should be called after:
 * - Adding a question
 * - Deleting a question
 * - Reordering questions
 * - Assigning templates from question bank
 *
 * Questions are ordered by their current `orderInRound` and then reassigned
 * round indices based on even distribution.
 */
export async function recalculateGameRounds(gameId: string): Promise<void> {
  // Fetch all questions for the game, ordered by current position
  const questions = await prisma.question.findMany({
    where: { gameId },
    orderBy: [{ roundIndex: "asc" }, { orderInRound: "asc" }],
    select: { id: true },
  });

  if (questions.length === 0) return;

  // Calculate new round distribution
  const distribution = distributeQuestionsIntoRounds(questions.length);

  // Update each question with new round and order
  await prisma.$transaction(
    questions.map((q, idx) =>
      prisma.question.update({
        where: { id: q.id },
        data: {
          roundIndex: distribution[idx],
          orderInRound: idx,
        },
      })
    )
  );
}
