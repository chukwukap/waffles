"use server";

import { prisma } from "@/lib/db";
import { calculateScore } from "@/lib/scoring";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { fetchGameById } from "@/lib/data";
import { Prisma } from "@prisma/client";

// Paths used for revalidation
const gamePath = (gameId: number) => `/game/${gameId}`;
const lobbyPath = "/lobby";
const leaderboardCurrentPath = (gameId: number) =>
  `/leaderboard/current/${gameId}`;
const leaderboardAllTimePath = "/leaderboard/allTime";
const userProfileGamePath = (fid: number, gameId: number) =>
  `/profile/${fid}/game/${gameId}`;

const submitAnswerSchema = z.object({
  fid: z.number().int().positive("Invalid FID format."),
  gameId: z.number().int().positive("Invalid Game ID."),
  questionId: z.number().int().positive("Invalid Question ID."),
  selected: z.string().nullable(),
  timeTaken: z.number().nonnegative("Time taken cannot be negative."),
});

export type SubmitAnswerResult =
  | { success: true; correct: boolean; points: number }
  | { success: false; error: string };

export async function submitAnswerAction(
  input: z.input<typeof submitAnswerSchema>
): Promise<SubmitAnswerResult> {
  const validation = submitAnswerSchema.safeParse(input);
  if (!validation.success) {
    const firstError = validation.error.message || "Invalid input.";
    console.warn(
      "submitAnswerAction validation failed:",
      validation.error.message
    );
    return { success: false, error: firstError };
  }
  const { fid, gameId, questionId, selected, timeTaken } = validation.data;

  try {
    const user = await prisma.user.findUnique({
      where: { fid },
      select: { id: true },
    });
    if (!user) {
      return { success: false, error: "User not found." };
    }

    const [question, game] = await Promise.all([
      prisma.question.findUnique({
        where: { id: questionId },
        select: { correctAnswer: true },
      }),
      prisma.game.findUnique({
        where: { id: gameId },
        include: { config: true },
      }),
    ]);

    if (!question) {
      return { success: false, error: "Question not found." };
    }
    if (!game) {
      return { success: false, error: "Game not found." };
    }
    if (!game.config) {
      return { success: false, error: "Game configuration missing." };
    }

    const roundLimit = game.config.roundTimeLimit ?? 15;
    const maxTime =
      Number.isFinite(roundLimit) && roundLimit > 0 ? roundLimit : 15;
    const sanitizedTime = Math.min(Math.max(0, timeTaken), maxTime);
    const correct = selected !== null && selected === question.correctAnswer;
    const newPoints = correct ? calculateScore(sanitizedTime, maxTime) : 0;

    await prisma.$transaction(async (tx) => {
      const previousAnswer = await tx.answer.findUnique({
        where: {
          userId_gameId_questionId: { userId: user.id, gameId, questionId },
        },
        select: { isCorrect: true, timeTaken: true },
      });

      const previousPoints =
        previousAnswer?.isCorrect && Number.isFinite(previousAnswer.timeTaken)
          ? calculateScore(previousAnswer.timeTaken!, maxTime)
          : 0;

      await tx.answer.upsert({
        where: {
          userId_gameId_questionId: { userId: user.id, gameId, questionId },
        },
        update: {
          selected: selected ?? (undefined as string | undefined),
          isCorrect: correct,
          timeTaken: sanitizedTime,
        },
        create: {
          userId: user.id,
          gameId,
          questionId,
          selected: selected ?? "",
          isCorrect: correct,
          timeTaken: sanitizedTime,
        },
      });

      // Find the existing total Score record for this user/game
      const existingScore = await tx.score.findUnique({
        where: { userId_gameId: { userId: user.id, gameId } },
        select: { points: true },
      });

      const pointsDelta = newPoints - previousPoints;

      if (existingScore) {
        const nextTotalPoints = Math.max(0, existingScore.points + pointsDelta);
        await tx.score.update({
          where: { userId_gameId: { userId: user.id, gameId } },
          data: { points: nextTotalPoints },
        });
      } else {
        await tx.score.create({
          data: { userId: user.id, gameId, points: newPoints },
        });
      }
    });

    // Revalidate all relevant paths after an answer is submitted
    // Leaderboards
    revalidatePath(leaderboardCurrentPath(gameId));
    revalidatePath(leaderboardAllTimePath);
    // Lobby page
    revalidatePath(lobbyPath);
    // Game details page
    revalidatePath(gamePath(gameId));
    // User's profile/game interaction (if any)
    revalidatePath(userProfileGamePath(fid, gameId));

    return { success: true, correct, points: newPoints };
  } catch (err) {
    console.error("submitAnswerAction Error:", err);
    return {
      success: false,
      error: "Failed to submit answer due to a server error.",
    };
  }
}

// Define schema for joining a game
const joinGameSchema = z.object({
  fid: z.number().int().positive("Invalid FID format."),
  gameId: z.number().int().positive("Invalid Game ID."),
});

export type JoinGameResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Records that a user has joined (started playing) a game.
 * - User must exist.
 * - Game must exist.
 * - User can only join the same game once (unique constraint).
 * - Uses GameParticipant model in Prisma.
 * - Leverages fetchGameById from @data.ts for game lookup.
 */
export async function joinGameAction(
  input: z.input<typeof joinGameSchema>
): Promise<JoinGameResult> {
  const validation = joinGameSchema.safeParse(input);
  if (!validation.success) {
    const firstError = validation.error.message || "Invalid input.";
    console.warn("joinGameAction validation failed:", validation.error.message);
    return { success: false, error: firstError };
  }
  const { fid, gameId } = validation.data;

  try {
    // Find the user by FID
    const user = await prisma.user.findUnique({
      where: { fid },
      select: { id: true },
    });
    if (!user) {
      return { success: false, error: "User not found." };
    }

    // Use cache-backed fetchGameById from @data.ts
    const game = await fetchGameById(gameId);
    if (!game) {
      return { success: false, error: "Game not found." };
    }

    // Create GameParticipant if it doesn't already exist (idempotent)
    await prisma.gameParticipant.upsert({
      where: {
        gameId_userId: {
          gameId,
          userId: user.id,
        },
      },
      update: {},
      create: {
        gameId,
        userId: user.id,
      },
    });

    // Revalidate relevant pages
    revalidatePath(gamePath(gameId));
    revalidatePath(lobbyPath);
    revalidatePath(userProfileGamePath(fid, gameId));
    revalidatePath(leaderboardCurrentPath(gameId));
    revalidatePath(leaderboardAllTimePath);

    return { success: true };
  } catch (err: unknown) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      // Still revalidate relevant pages in upsert duplicate case
      revalidatePath(gamePath(gameId));
      revalidatePath(lobbyPath);
      revalidatePath(userProfileGamePath(fid, gameId));
      revalidatePath(leaderboardCurrentPath(gameId));
      revalidatePath(leaderboardAllTimePath);
      return { success: true };
    }
    console.error("joinGameAction Error:", err);
    return {
      success: false,
      error: "Failed to join game due to a server error.",
    };
  }
}
