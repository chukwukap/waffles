"use server";

import { prisma } from "@/lib/db";
import { calculateScore } from "@/lib/scoring";
import { z } from "zod";
import { verifyAuthenticatedUser } from "@/lib/auth";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

const submitAnswerSchema = z.object({
  fid: z.coerce.number().int().positive("Invalid FID format."),
  gameId: z.coerce.number().int().positive("Invalid Game ID."),
  questionId: z.coerce.number().int().positive("Invalid Question ID."),
  selected: z.string().nullable(),
  timeTaken: z.coerce.number().nonnegative("Time taken cannot be negative."),
  authToken: z.string().optional().nullable(), // Authentication token
});

export type SubmitAnswerResult = { success: boolean; error: string };

/**
 * Accepts FormData for answer submission, following the referral validation pattern.
 */
export async function submitAnswerAction(
  previousState: SubmitAnswerResult,
  formData: FormData
): Promise<SubmitAnswerResult> {
  const rawFid = formData.get("fid");
  const rawGameId = formData.get("gameId");
  const rawQuestionId = formData.get("questionId");
  const rawSelected = formData.has("selected")
    ? formData.get("selected")
    : null;
  // Permitting blank or omitted to still mean null
  const rawTimeTaken = formData.get("timeTaken");
  const rawAuthToken = formData.get("authToken");

  const validation = submitAnswerSchema.safeParse({
    fid: rawFid,
    gameId: rawGameId,
    questionId: rawQuestionId,
    selected: rawSelected === "" ? "noanswer" : rawSelected,
    timeTaken: rawTimeTaken,
    authToken: rawAuthToken,
  });

  if (!validation.success) {
    const firstError =
      validation.error.issues?.[0]?.message || "Invalid input.";
    console.warn(
      "submitAnswerAction validation failed:",
      validation.error.issues
    );
    return { success: false, error: firstError };
  }

  const { fid, gameId, questionId, selected, timeTaken, authToken } =
    validation.data;

  // Verify authentication - REQUIRED for answer submissions
  const authResult = await verifyAuthenticatedUser(authToken ?? null, fid);
  if (!authResult.authenticated) {
    return {
      success: false,
      error: authResult.error || "Authentication required to submit answers",
    };
  }

  try {
    // 1. Get User
    const user = await prisma.user.findUnique({
      where: { fid },
      select: { id: true },
    });
    if (!user) {
      return { success: false, error: "User not found." };
    }

    // 2. Get Game and Question info
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

    // 3. Calculate score based on new submission
    const questionTimeLimit = game.config.questionTimeLimit ?? 10;
    const maxTime =
      Number.isFinite(questionTimeLimit) && questionTimeLimit > 0
        ? questionTimeLimit
        : 10;
    // Sanitize time and determine correctness
    const sanitizedTime = Math.min(Math.max(0, timeTaken), maxTime);
    const correct = selected !== null && selected === question.correctAnswer;
    const newPoints = correct ? calculateScore(sanitizedTime, maxTime) : 0;

    // 4. Use a transaction for atomic update
    await prisma.$transaction(async (tx) => {
      // Find the *previous* answer for this question, if any
      const previousAnswer = await tx.answer.findUnique({
        where: {
          userId_gameId_questionId: { userId: user.id, gameId, questionId },
        },
        select: { isCorrect: true, timeTaken: true },
      });

      // Calculate the points from the *previous* answer
      const previousPoints =
        previousAnswer?.isCorrect && Number.isFinite(previousAnswer.timeTaken)
          ? calculateScore(previousAnswer.timeTaken!, maxTime)
          : 0;

      // Upsert the new answer
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
          selected: selected ?? "", // Use empty string if null, as selected is not nullable
          isCorrect: correct,
          timeTaken: sanitizedTime,
        },
      });

      // Find the existing total Score record for this user/game
      const existingScore = await tx.score.findUnique({
        where: { userId_gameId: { userId: user.id, gameId } },
        select: { points: true },
      });

      // Calculate the *change* in points
      const pointsDelta = newPoints - previousPoints;

      if (existingScore) {
        // If score exists, update it with the delta
        const nextTotalPoints = Math.max(0, existingScore.points + pointsDelta);
        await tx.score.update({
          where: { userId_gameId: { userId: user.id, gameId } },
          data: { points: nextTotalPoints },
        });
      } else {
        // If no score record exists, create one with the new points
        await tx.score.create({
          data: { userId: user.id, gameId, points: newPoints },
        });
      }
    });

    // Revalidate the game path to ensure data is fresh for the next load
    revalidatePath(`/game/${gameId}`);

    return { success: true, error: "" };
  } catch (err) {
    console.error("submitAnswerAction Error:", err);
    // Handle potential Prisma unique constraint violation (though upsert should prevent this)
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return {
        success: false,
        error: "A database conflict occurred. Please try again.",
      };
    }
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
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: { config: true },
    });
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

    // Revalidate the game path
    revalidatePath(`/game/${gameId}`);

    return { success: true };
  } catch (err: unknown) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return { success: true };
    }
    console.error("joinGameAction Error:", err);
    return {
      success: false,
      error: "Failed to join game due to a server error.",
    };
  }
}
// LeaveGame schema and handler for removing user participation from the current active game (deleting GameParticipant)

const leaveGameSchema = z.object({
  fid: z.number().int().positive("Invalid FID."),
});

export type LeaveGameResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Removes the GameParticipant record (user's participation) for the current active game.
 * - Only removes participation for the *currently* active Game.
 * - Does NOT revoke ticket or answers; only removes participation.
 * - Safe to call multiple times (idempotent).
 * - Triggers revalidation of the game view if any.
 *
 * Expects only fid.
 */
export async function leaveGameAction(
  input: z.input<typeof leaveGameSchema>
): Promise<LeaveGameResult> {
  const validated = leaveGameSchema.safeParse(input);
  if (!validated.success) {
    const firstError = validated.error.message || "Invalid input.";
    console.warn("leaveGameAction validation failed:", validated.error.message);
    return { success: false, error: firstError };
  }
  const { fid } = validated.data;

  try {
    // Find user by FID
    const user = await prisma.user.findUnique({
      where: { fid },
      select: { id: true },
    });
    if (!user) {
      return { success: false, error: "User not found." };
    }

    // Find active GameParticipant record for this user.
    // Active game is one where game.startTime <= now <= game.endTime
    const now = new Date();
    const activeParticipant = await prisma.gameParticipant.findFirst({
      where: {
        userId: user.id,
        game: {
          startTime: { lte: now },
          endTime: { gte: now },
        },
      },
      include: { game: true },
    });

    if (!activeParticipant || !activeParticipant.game) {
      return { success: false, error: "No active game participation found." };
    }

    // Remove participation (delete the record)
    await prisma.gameParticipant.deleteMany({
      where: { userId: user.id, gameId: activeParticipant.gameId },
    });

    // Revalidate the game path for the game left
    revalidatePath(`/game/${activeParticipant.gameId}`);

    return { success: true };
  } catch (err: unknown) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      (err.code === "P2025" || err.code === "P2001")
    ) {
      // No record exists, treat as successful (idempotency)
      return { success: true };
    }
    console.error("leaveGameAction Error:", err);
    return {
      success: false,
      error: "Failed to leave game due to a server error.",
    };
  }
}
