"use server";

import { prisma } from "@/lib/db";
import { calculateScore, QuestionDifficulty } from "@/lib/scoring";
import { z } from "zod";
import { verifyAuthenticatedUser } from "@/lib/auth";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/lib/db";

const submitAnswerSchema = z.object({
  fid: z.coerce.number().int().positive("Invalid FID format."),
  gameId: z.coerce.number().int().positive("Invalid Game ID."),
  questionId: z.coerce.number().int().positive("Invalid Question ID."),
  // CHANGED: Expecting the index (0, 1, 2, 3) or null for no answer
  selectedIndex: z.coerce.number().int().optional().nullable(),
  // CHANGED: Expecting milliseconds
  timeTakenMs: z.coerce.number().nonnegative("Time taken cannot be negative."),
  authToken: z.string().optional().nullable(), // Authentication token
});

export type SubmitAnswerResult = { success: boolean; error: string };

/**
 * Accepts FormData for answer submission, following the new schema.
 */
export async function submitAnswerAction(
  previousState: SubmitAnswerResult,
  formData: FormData
): Promise<SubmitAnswerResult> {
  console.log("[submitAnswerAction] ----------------------------");
  console.log("[submitAnswerAction] Incoming FormData:");
  for (const [key, value] of formData.entries()) {
    console.log(`  ${key}:`, value);
  }

  // CHANGED: Read new form fields
  const rawFid = formData.get("fid");
  const rawGameId = formData.get("gameId");
  const rawQuestionId = formData.get("questionId");
  const rawSelectedIndex = formData.get("selectedIndex"); // This will be "0", "1", etc. or null
  const rawTimeTakenMs = formData.get("timeTakenMs");
  const rawAuthToken = formData.get("authToken");

  const validation = submitAnswerSchema.safeParse({
    fid: rawFid,
    gameId: rawGameId,
    questionId: rawQuestionId,
    selectedIndex: rawSelectedIndex, // Zod will coerce to number or null
    timeTakenMs: rawTimeTakenMs,
    authToken: rawAuthToken,
  });

  if (!validation.success) {
    const firstError =
      validation.error.issues?.[0]?.message || "Invalid input.";
    console.warn(
      "[submitAnswerAction] Validation failed:",
      validation.error.issues
    );
    return { success: false, error: firstError };
  }

  // CHANGED: Use new validated fields
  const { fid, gameId, questionId, selectedIndex, timeTakenMs, authToken } =
    validation.data;
  const selectedIndexValue = selectedIndex ?? -1; // Use -1 for "no answer"

  console.log("[submitAnswerAction] Parsed Form Data:", {
    fid,
    gameId,
    questionId,
    selectedIndex,
    timeTakenMs,
    hasAuthToken: !!authToken,
  });

  // Verify authentication - REQUIRED for answer submissions
  const authResult = await verifyAuthenticatedUser(authToken ?? null, fid);
  console.log("[submitAnswerAction] Auth result:", authResult);
  if (!authResult.authenticated) {
    console.warn(
      "[submitAnswerAction] Authentication failed:",
      authResult.error
    );
    return {
      success: false,
      error: authResult.error || "Authentication required to submit answers",
    };
  }

  try {
    // 1. Get User
    const user = await prisma.user.findUnique({
      where: { fid },
      select: { id: true, status: true }, // Added status
    });
    console.log("[submitAnswerAction] User fetch:", user);
    if (!user) {
      console.warn("[submitAnswerAction] User not found for fid:", fid);
      return { success: false, error: "User not found." };
    }

    // Enforce access control
    if (user.status !== "ACTIVE") {
      return {
        success: false,
        error: "Access denied. You must be invited to play.",
      };
    }

    // 2. Get Game and Question info
    // CHANGED: Removed game fetch, simplified question fetch
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: { correctIndex: true, durationSec: true }, // Get new fields
    });

    console.log("[submitAnswerAction] Question fetch:", question);

    if (!question) {
      console.warn("[submitAnswerAction] Question not found (id):", questionId);
      return { success: false, error: "Question not found." };
    }

    // 3. Calculate score based on new submission
    const maxTimeSec = question.durationSec ?? 10;
    // Compare index with correctIndex
    const correct = selectedIndex === question.correctIndex;

    // Calculate consecutive correct answers for combo bonus
    // Fetch recent answers for this game to determine streak
    const recentAnswers = await prisma.answer.findMany({
      where: {
        userId: user.id,
        gameId: gameId,
        questionId: { not: questionId }, // Exclude current question
      },
      orderBy: { createdAt: "desc" },
      take: 10, // Look back enough to cover max combo
      select: { isCorrect: true },
    });

    let consecutiveCorrect = 0;
    for (const ans of recentAnswers) {
      if (ans.isCorrect) consecutiveCorrect++;
      else break;
    }

    // Use new scoring algorithm
    const scoreResult = calculateScore({
      timeTakenMs,
      maxTimeSec,
      isCorrect: correct,
      difficulty: QuestionDifficulty.MEDIUM, // Default difficulty for now
      consecutiveCorrect,
    });

    const newPoints = scoreResult.score;

    console.log("[submitAnswerAction] Calculation:", {
      timeTakenMs,
      maxTimeSec,
      correct,
      consecutiveCorrect,
      newPoints,
      breakdown: scoreResult.breakdown,
    });

    // 4. Use a transaction for atomic update
    await prisma.$transaction(async (tx) => {
      // Find the *previous* answer for this question, if any
      const previousAnswer = await tx.answer.findUnique({
        where: {
          // userId_gameId_questionId: { userId: user.id, gameId, questionId },
          userId_questionId: { userId: user.id, questionId },
        },
        select: { isCorrect: true, latencyMs: true, pointsEarned: true }, // CHANGED: Added pointsEarned
      });

      console.log("[submitAnswerAction] Previous answer:", previousAnswer);

      // Calculate the points from the *previous* answer
      // Calculate the points from the *previous* answer
      // Note: We don't easily know the combo state at that previous time without complex queries.
      // For simplicity in delta calculation, we'll assume the same combo or 0.
      // Ideally, we should store the pointsEarned in the DB (which we do) and use that.
      const previousPoints = previousAnswer?.pointsEarned ?? 0;

      // Upsert the new answer
      await tx.answer.upsert({
        where: {
          // userId_gameId_questionId: { userId: user.id, gameId, questionId },
          userId_questionId: { userId: user.id, questionId },
        },
        update: {
          // CHANGED: Save index and latency
          selectedIndex: selectedIndexValue,
          isCorrect: correct,
          latencyMs: timeTakenMs,
          pointsEarned: newPoints,
        },
        create: {
          userId: user.id,
          gameId,
          questionId,
          // CHANGED: Save index and latency
          selectedIndex: selectedIndexValue,
          isCorrect: correct,
          latencyMs: timeTakenMs,
          pointsEarned: newPoints,
        },
      });

      console.log("[submitAnswerAction] Answer upserted!");

      // Find the existing total Score record for this user/game (now on GamePlayer)
      // CHANGED: Query GamePlayer
      const existingScore = await tx.gamePlayer.findUnique({
        where: { gameId_userId: { gameId, userId: user.id } },
        select: { score: true },
      });

      // Calculate the *change* in points
      const pointsDelta = newPoints - previousPoints;

      console.log(
        "[submitAnswerAction] Existing score:",
        existingScore,
        "pointsDelta:",
        pointsDelta
      );

      if (existingScore) {
        // If score exists, update it with the delta
        const nextTotalPoints = Math.max(0, existingScore.score + pointsDelta);
        // CHANGED: Update GamePlayer
        await tx.gamePlayer.update({
          where: { gameId_userId: { gameId, userId: user.id } },
          data: { score: nextTotalPoints },
        });
        console.log(
          "[submitAnswerAction] Updated existing score to",
          nextTotalPoints
        );
      } else {
        // If no score record exists, create one with the new points
        // This should ideally be created by joinGameAction, but this is a safeguard
        // CHANGED: Create GamePlayer
        await tx.gamePlayer.create({
          data: { userId: user.id, gameId, score: newPoints },
        });
        console.log(
          "[submitAnswerAction] Created new score record with points",
          newPoints
        );
      }
    });

    console.log(
      "[submitAnswerAction] Revalidating path:",
      `/game/${gameId}/live`
    );
    console.log("[submitAnswerAction] SUCCESS!");
    console.log("[submitAnswerAction] ----------------------------");

    return { success: true, error: "" };
  } catch (err) {
    console.error("[submitAnswerAction] Error caught:", err);
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      console.warn(
        "[submitAnswerAction] Prisma unique constraint violation (P2002)"
      );
      return {
        success: false,
        error: "A database conflict occurred. Please try again.",
      };
    }
    // Don't re-throw, just return error
    return {
      success: false,
      error: "An unexpected server error occurred.",
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
 * - Uses GamePlayer model in Prisma. (CHANGED)
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

    // Find game
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true }, // Simplified, no longer need config
    });
    if (!game) {
      return { success: false, error: "Game not found." };
    }

    // 3. Verify and Redeem Ticket
    const ticket = await prisma.ticket.findUnique({
      where: {
        gameId_userId: {
          gameId,
          userId: user.id,
        },
      },
    });

    if (!ticket || ticket.status !== "PAID") {
      // Allow re-joining if already REDEEMED
      if (ticket?.status === "REDEEMED") {
        // Already redeemed, proceed to ensure GamePlayer exists
      } else {
        return { success: false, error: "Valid ticket required to join." };
      }
    } else {
      // Mark ticket as REDEEMED
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          status: "REDEEMED",
          redeemedAt: new Date(),
        },
      });
    }

    // 4. Create GamePlayer if it doesn't already exist (idempotent)
    // CHANGED: Renamed to gamePlayer
    await prisma.gamePlayer.upsert({
      where: {
        gameId_userId: {
          gameId,
          userId: user.id,
        },
      },
      update: {}, // Nothing to update if they already joined
      create: {
        gameId,
        userId: user.id,
        score: 0, // Start with 0 score
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
      // This is now expected behavior for an upsert, means they already joined.
      return { success: true };
    }
    console.error("joinGameAction Error:", err);
    return {
      success: false,
      error: "Failed to join game due to a server error.",
    };
  }
}
// LeaveGame schema and handler for removing user participation
// CHANGED: Uses GamePlayer

const leaveGameSchema = z.object({
  fid: z.coerce.number().int().positive("Invalid FID."),
  gameId: z.coerce.number().int().positive("Invalid Game ID."),
});

export type LeaveGameResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Removes the GamePlayer record (user's participation) for the specified game.
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
    console.warn("leaveGameAction validation failed:", validation.error.issues);
    return { success: false, error: firstError };
  }
  const { fid, gameId } = validation.data;

  try {
    // Find user by FID
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

    // Remove participation (delete the record)
    // CHANGED: Renamed to gamePlayer
    await prisma.gamePlayer.deleteMany({
      where: { userId: user.id, gameId },
    });

    // Revalidate paths to ensure UI updates
    revalidatePath(`/game/${gameId}`);
    revalidatePath("/game");

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
