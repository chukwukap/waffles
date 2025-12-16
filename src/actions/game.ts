"use server";

import { prisma } from "@/lib/db";
import { calculateScore, QuestionDifficulty } from "@/lib/scoring";
import { z } from "zod";
import { verifyAuthenticatedUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Prisma } from "@/lib/db";

// ==========================================
// SUBMIT ANSWER ACTION
// ==========================================

const submitAnswerSchema = z.object({
  fid: z.coerce.number().int().positive("Invalid FID format."),
  gameId: z.coerce.number().int().positive("Invalid Game ID."),
  questionId: z.coerce.number().int().positive("Invalid Question ID."),
  selectedIndex: z.coerce.number().int().optional().nullable(),
  timeTakenMs: z.coerce.number().nonnegative("Time taken cannot be negative."),
  authToken: z.string().optional().nullable(),
});

export type SubmitAnswerResult = { success: boolean; error: string };

/**
 * Submit an answer for a question.
 * Uses GameEntry model with embedded answers JSON.
 */
export async function submitAnswerAction(
  previousState: SubmitAnswerResult,
  formData: FormData
): Promise<SubmitAnswerResult> {
  const rawFid = formData.get("fid");
  const rawGameId = formData.get("gameId");
  const rawQuestionId = formData.get("questionId");
  const rawSelectedIndex = formData.get("selectedIndex");
  const rawTimeTakenMs = formData.get("timeTakenMs");
  const rawAuthToken = formData.get("authToken");

  const validation = submitAnswerSchema.safeParse({
    fid: rawFid,
    gameId: rawGameId,
    questionId: rawQuestionId,
    selectedIndex: rawSelectedIndex,
    timeTakenMs: rawTimeTakenMs,
    authToken: rawAuthToken,
  });

  if (!validation.success) {
    const firstError =
      validation.error.issues?.[0]?.message || "Invalid input.";
    return { success: false, error: firstError };
  }

  const { fid, gameId, questionId, selectedIndex, timeTakenMs, authToken } =
    validation.data;
  const selectedIndexValue = selectedIndex ?? -1;

  // Verify authentication
  const authResult = await verifyAuthenticatedUser(authToken ?? null, fid);
  if (!authResult.authenticated) {
    return {
      success: false,
      error: authResult.error || "Authentication required",
    };
  }

  try {
    // Get user
    const user = await prisma.user.findUnique({
      where: { fid },
      select: { id: true, hasGameAccess: true, isBanned: true },
    });

    if (!user) {
      return { success: false, error: "User not found." };
    }

    if (!user.hasGameAccess || user.isBanned) {
      return {
        success: false,
        error: "Access denied. You must be invited to play.",
      };
    }

    // Get question
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: { correctIndex: true, durationSec: true, points: true },
    });

    if (!question) {
      return { success: false, error: "Question not found." };
    }

    // Get user's game entry
    const entry = await prisma.gameEntry.findUnique({
      where: { gameId_userId: { gameId, userId: user.id } },
      select: { id: true, answers: true, score: true, answered: true },
    });

    if (!entry) {
      return { success: false, error: "You must have a ticket to play." };
    }

    // Parse existing answers
    const answers = (entry.answers as Record<string, unknown>) || {};
    const questionKey = String(questionId);

    // Check if already answered
    if (answers[questionKey]) {
      return { success: false, error: "Question already answered." };
    }

    // Calculate score
    const isCorrect = selectedIndexValue === question.correctIndex;
    const pointsEarned = isCorrect ? question.points ?? 100 : 0;

    // Build new answer entry
    const newAnswer = {
      selected: selectedIndexValue,
      correct: isCorrect,
      points: pointsEarned,
      ms: timeTakenMs,
    };

    // Build updated answers object
    const updatedAnswers = {
      ...answers,
      [questionKey]: newAnswer,
    } as Prisma.JsonObject;

    // Update entry atomically
    await prisma.gameEntry.update({
      where: { id: entry.id },
      data: {
        answers: updatedAnswers,
        score: entry.score + pointsEarned,
        answered: entry.answered + 1,
      },
    });

    return { success: true, error: "" };
  } catch (err) {
    console.error("[submitAnswerAction] Error:", err);
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
      error: "An unexpected server error occurred.",
    };
  }
}

// ==========================================
// JOIN GAME ACTION
// ==========================================

const joinGameSchema = z.object({
  fid: z.number().int().positive("Invalid FID format."),
  gameId: z.number().int().positive("Invalid Game ID."),
});

export type JoinGameResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Records that a user has joined (started playing) a game.
 * With new schema, this just verifies they have a valid entry.
 */
export async function joinGameAction(
  input: z.input<typeof joinGameSchema>
): Promise<JoinGameResult> {
  const validation = joinGameSchema.safeParse(input);
  if (!validation.success) {
    const firstError = validation.error.message || "Invalid input.";
    return { success: false, error: firstError };
  }
  const { fid, gameId } = validation.data;

  try {
    const user = await prisma.user.findUnique({
      where: { fid },
      select: { id: true },
    });
    if (!user) {
      return { success: false, error: "User not found." };
    }

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true },
    });
    if (!game) {
      return { success: false, error: "Game not found." };
    }

    // Check for valid entry (replaces ticket check)
    const entry = await prisma.gameEntry.findUnique({
      where: { gameId_userId: { gameId, userId: user.id } },
      select: { id: true, paidAt: true },
    });

    if (!entry || !entry.paidAt) {
      return { success: false, error: "Valid ticket required to join." };
    }

    revalidatePath(`/game/${gameId}`);
    return { success: true };
  } catch (err: unknown) {
    console.error("joinGameAction Error:", err);
    return {
      success: false,
      error: "Failed to join game due to a server error.",
    };
  }
}

// ==========================================
// LEAVE GAME ACTION
// ==========================================

const leaveGameSchema = z.object({
  fid: z.coerce.number().int().positive("Invalid FID."),
  gameId: z.coerce.number().int().positive("Invalid Game ID."),
});

export type LeaveGameResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Note: With the new schema, we don't delete entries as they
 * represent payment. This is mostly a no-op now.
 */
export async function leaveGameAction(
  previousState: LeaveGameResult,
  formData: FormData
): Promise<LeaveGameResult> {
  const rawFid = formData.get("fid");
  const rawGameId = formData.get("gameId");
  const validation = leaveGameSchema.safeParse({
    fid: rawFid,
    gameId: rawGameId,
  });
  if (!validation.success) {
    const firstError =
      validation.error.issues?.[0]?.message || "Invalid input.";
    return { success: false, error: firstError };
  }
  const { fid, gameId } = validation.data;

  try {
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { fid },
      select: { id: true },
    });
    if (!user) {
      return { success: false, error: "User not found." };
    }

    // Verify game exists
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true },
    });
    if (!game) {
      return { success: false, error: "Game not found." };
    }

    // With new schema, we don't delete entries (they represent payment)
    // Just revalidate paths
    revalidatePath(`/game/${gameId}`);
    revalidatePath("/game");

    return { success: true };
  } catch (err: unknown) {
    console.error("leaveGameAction Error:", err);
    return {
      success: false,
      error: "Failed to leave game due to a server error.",
    };
  }
}
