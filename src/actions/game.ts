"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma";
import { notifyTicketPurchased } from "@/lib/partykit";
import { sendToUser } from "@/lib/notifications";
import { env } from "@/lib/env";
import { PAYMENT_TOKEN_DECIMALS, verifyTicketPurchase } from "@/lib/chain";
import { parseUnits } from "viem";

const SERVICE = "game-actions";

// ============================================================================
// Types
// ============================================================================

export type PurchaseResult =
  | { success: true; entryId: string }
  | { success: false; error: string; code?: string };

interface PurchaseInput {
  gameId: string;
  fid: number;
  txHash: string;
  paidAmount: number;
  payerWallet: string;
}

// ============================================================================
// Helper: Format game start time
// ============================================================================

function formatGameTime(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffHours > 24) {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  } else if (diffHours > 0) {
    return `in ${diffHours}h ${diffMins}m`;
  } else if (diffMins > 0) {
    return `in ${diffMins} minutes`;
  }
  return "soon";
}

// ============================================================================
// Server Action: Purchase Game Ticket
// ============================================================================

/**
 * Records a ticket purchase after on-chain transaction succeeds.
 * Creates game entry, updates prize pool, sends notification, and revalidates cache.
 */
export async function purchaseGameTicket(
  input: PurchaseInput,
): Promise<PurchaseResult> {
  const { gameId, fid, txHash, paidAmount, payerWallet } = input;

  // Validate input
  if (!gameId || !txHash || !fid) {
    return {
      success: false,
      error: "Missing required fields",
      code: "INVALID_INPUT",
    };
  }

  if (typeof paidAmount !== "number" || paidAmount <= 0) {
    return {
      success: false,
      error: "Invalid payment amount",
      code: "INVALID_INPUT",
    };
  }

  try {
    // Get user by fid
    const user = await prisma.user.findUnique({
      where: { fid },
      select: { id: true, fid: true, username: true, pfpUrl: true },
    });

    if (!user) {
      return { success: false, error: "User not found", code: "NOT_FOUND" };
    }

    // Check if entry already exists (idempotent)
    const existing = await prisma.gameEntry.findUnique({
      where: { gameId_userId: { gameId, userId: user.id } },
    });

    if (existing) {
      // Entry exists - revalidate and return success
      revalidatePath("/game");
      revalidatePath("/(app)/(game)", "layout");
      return { success: true, entryId: existing.id };
    }

    // Verify game exists and is valid
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: {
        id: true,
        onchainId: true,
        startsAt: true,
        endsAt: true,
        prizePool: true,
        playerCount: true,
        maxPlayers: true,
        tierPrices: true,
      },
    });

    if (!game) {
      return { success: false, error: "Game not found", code: "NOT_FOUND" };
    }

    // Validate payment amount against allowed tiers
    const isValidTier = game.tierPrices.some(
      (price) => Math.abs(price - paidAmount) < 0.0001,
    );
    if (!isValidTier) {
      return {
        success: false,
        error: `Invalid payment tier. Allowed: ${game.tierPrices.join(", ")}`,
        code: "INVALID_INPUT",
      };
    }

    // Check game status
    if (new Date() >= game.endsAt) {
      return { success: false, error: "Game has ended", code: "GAME_ENDED" };
    }

    if (game.playerCount >= game.maxPlayers) {
      return { success: false, error: "Game is full", code: "GAME_FULL" };
    }

    // =========================================================================
    // CRITICAL: Verify payment on-chain before recording
    // =========================================================================
    if (!game.onchainId) {
      return {
        success: false,
        error: "Game not deployed on-chain",
        code: "NOT_ONCHAIN",
      };
    }

    const verification = await verifyTicketPurchase({
      txHash: txHash as `0x${string}`,
      expectedGameId: game.onchainId as `0x${string}`,
      expectedBuyer: payerWallet as `0x${string}`,
      minimumAmount: parseUnits(paidAmount.toString(), PAYMENT_TOKEN_DECIMALS),
    });

    if (!verification.verified) {
      console.error("["+SERVICE+"]", "payment_verification_failed", {
        gameId,
        fid,
        txHash,
        payerWallet,
        error: verification.error,
      });
      return {
        success: false,
        error: verification.error || "Payment verification failed",
        code: "VERIFICATION_FAILED",
      };
    }

    console.log("["+SERVICE+"]", "payment_verified", {
      gameId,
      fid,
      txHash,
      verifiedAmount: verification.details?.amountFormatted,
    });

    // Create entry and update game atomically
    const entry = await prisma.$transaction(async (tx) => {
      const newEntry = await tx.gameEntry.create({
        data: {
          gameId,
          userId: user.id,
          txHash,
          payerWallet: payerWallet || null,
          paidAmount,
          paidAt: new Date(),
        },
      });

      await tx.game.update({
        where: { id: gameId },
        data: {
          playerCount: { increment: 1 },
          prizePool: { increment: paidAmount },
        },
      });

      // Check if first game - unlock referral rewards
      const entryCount = await tx.gameEntry.count({
        where: { userId: user.id },
      });

      if (entryCount === 1) {
        await tx.referralReward.updateMany({
          where: { inviteeId: user.id, status: "PENDING" },
          data: { status: "UNLOCKED", unlockedAt: new Date() },
        });
      }

      return newEntry;
    });

    // Revalidate cache - THE KEY FIX FOR STALE DATA
    revalidatePath("/game");
    revalidatePath("/(app)/(game)", "layout");

    // Async: Send notification (don't await)
    const timeStr = formatGameTime(game.startsAt);
    sendToUser(fid, {
      title: "🧇 Ticket Secured!",
      body: `Game starts ${timeStr}. Don't miss it!`,
      targetUrl: `${env.rootUrl}/game`,
    }).catch((err) =>
      console.error("["+SERVICE+"]", "notification_error", {
        gameId,
        fid,
        error: (err instanceof Error ? err.message : String(err)),
      }),
    );

    // Async: Notify PartyKit of ticket purchase (stats + entrant atomically)
    notifyTicketPurchased(gameId, {
      username: user.username || "Player",
      pfpUrl: user.pfpUrl || null,
      prizePool: game.prizePool + paidAmount,
      playerCount: game.playerCount + 1,
    }).catch((err) =>
      console.error("["+SERVICE+"]", "partykit_notify_error", {
        gameId,
        error: (err instanceof Error ? err.message : String(err)),
      }),
    );

    console.log("["+SERVICE+"]", "ticket_purchased", {
      gameId,
      entryId: entry.id,
      fid,
      paidAmount,
    });

    return { success: true, entryId: entry.id };
  } catch (error) {
    console.error("["+SERVICE+"]", "purchase_error", {
      gameId,
      fid,
      error: (error instanceof Error ? error.message : String(error)),
    });
    return { success: false, error: "Purchase failed", code: "INTERNAL_ERROR" };
  }
}

// ============================================================================
// Server Action: Leave Game
// ============================================================================

export type LeaveGameResult =
  | { success: true; leftAt: Date }
  | { success: false; error: string; code?: string };

interface LeaveGameInput {
  gameId: string;
  fid: number;
}

/**
 * Leaves/forfeits a game during live phase.
 * Sets leftAt timestamp on GameEntry.
 */
export async function leaveGame(
  input: LeaveGameInput,
): Promise<LeaveGameResult> {
  const { gameId, fid } = input;

  if (!gameId || !fid) {
    return {
      success: false,
      error: "Missing required fields",
      code: "INVALID_INPUT",
    };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { fid },
      select: { id: true },
    });

    if (!user) {
      return { success: false, error: "User not found", code: "NOT_FOUND" };
    }

    const entry = await prisma.gameEntry.findUnique({
      where: {
        gameId_userId: {
          gameId,
          userId: user.id,
        },
      },
      select: {
        id: true,
        leftAt: true,
        game: {
          select: {
            startsAt: true,
            endsAt: true,
          },
        },
      },
    });

    if (!entry) {
      return { success: false, error: "Not in this game", code: "NOT_IN_GAME" };
    }

    if (entry.leftAt) {
      return { success: true, leftAt: entry.leftAt };
    }

    const now = new Date();
    const isLive = now >= entry.game.startsAt && now < entry.game.endsAt;

    if (!isLive) {
      return {
        success: false,
        error: "Can only leave during live game",
        code: "NOT_LIVE",
      };
    }

    const updated = await prisma.gameEntry.update({
      where: { id: entry.id },
      data: { leftAt: now },
      select: { leftAt: true },
    });

    revalidatePath("/game");
    revalidatePath("/(app)/(game)", "layout");

    console.log("["+SERVICE+"]", "game_left", { gameId, fid });

    return { success: true, leftAt: updated.leftAt! };
  } catch (error) {
    console.error("["+SERVICE+"]", "leave_error", {
      gameId,
      fid,
      error: (error instanceof Error ? error.message : String(error)),
    });
    return {
      success: false,
      error: "Failed to leave game",
      code: "INTERNAL_ERROR",
    };
  }
}

// ============================================================================
// Server Action: Submit Answer
// ============================================================================

export type SubmitAnswerResult =
  | {
      success: true;
      isCorrect: boolean;
      pointsEarned: number;
      totalScore: number;
    }
  | { success: false; error: string; code?: string };

interface SubmitAnswerInput {
  gameId: string;
  fid: number;
  questionId: string;
  selectedIndex: number | null;
  timeTakenMs: number;
}

interface AnswerEntry {
  selected: number;
  correct: boolean;
  points: number;
  ms: number;
}

/**
 * Submit an answer for a question in a live game.
 */
export async function submitAnswer(
  input: SubmitAnswerInput,
): Promise<SubmitAnswerResult> {
  const { gameId, fid, questionId, selectedIndex, timeTakenMs } = input;

  if (!gameId || !fid || !questionId) {
    return {
      success: false,
      error: "Missing required fields",
      code: "INVALID_INPUT",
    };
  }

  const selectedIndexValue = selectedIndex ?? -1;

  try {
    const user = await prisma.user.findUnique({
      where: { fid },
      select: { id: true },
    });

    if (!user) {
      return { success: false, error: "User not found", code: "NOT_FOUND" };
    }

    // Check if game has ended
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { endsAt: true },
    });

    if (!game) {
      return { success: false, error: "Game not found", code: "NOT_FOUND" };
    }

    if (new Date() > game.endsAt) {
      return { success: false, error: "Game has ended", code: "GAME_ENDED" };
    }

    // Verify user has a game entry
    const entry = await prisma.gameEntry.findUnique({
      where: {
        gameId_userId: {
          gameId,
          userId: user.id,
        },
      },
      select: {
        id: true,
        score: true,
        answered: true,
        answers: true,
        paidAt: true,
      },
    });

    if (!entry) {
      return { success: false, error: "Not in this game", code: "NOT_IN_GAME" };
    }

    if (!entry.paidAt) {
      return {
        success: false,
        error: "Payment required",
        code: "PAYMENT_REQUIRED",
      };
    }

    // Get question details
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: {
        correctIndex: true,
        durationSec: true,
        gameId: true,
        points: true,
      },
    });

    if (!question) {
      return { success: false, error: "Question not found", code: "NOT_FOUND" };
    }

    if (question.gameId !== gameId) {
      return {
        success: false,
        error: "Question not in this game",
        code: "INVALID_QUESTION",
      };
    }

    // Parse existing answers
    const existingAnswers =
      (entry.answers as unknown as Record<string, AnswerEntry>) || {};
    const questionKey = String(questionId);

    // Check if already answered (idempotent)
    if (existingAnswers[questionKey]) {
      const existing = existingAnswers[questionKey];
      return {
        success: true,
        isCorrect: existing.correct,
        pointsEarned: existing.points,
        totalScore: entry.score,
      };
    }

    // Calculate score using inline logic (avoid import issues)
    const maxTimeSec = question.durationSec ?? 10;
    const isCorrect = selectedIndexValue === question.correctIndex;

    // Score calculation: base points * time bonus if correct, 0 if wrong
    let pointsEarned = 0;
    if (isCorrect) {
      const maxTimeMs = maxTimeSec * 1000;
      const timeBonus = Math.max(0, 1 - timeTakenMs / maxTimeMs);
      const basePoints = question.points ?? 100;
      pointsEarned = Math.round(basePoints * (0.5 + 0.5 * timeBonus));
    }

    const newTotalScore = entry.score + pointsEarned;

    // Build new answer entry
    const newAnswer: AnswerEntry = {
      selected: selectedIndexValue,
      correct: isCorrect,
      points: pointsEarned,
      ms: timeTakenMs,
    };

    // Build updated answers object
    const updatedAnswers = {
      ...existingAnswers,
      [questionKey]: newAnswer,
    } as unknown as Prisma.JsonObject;

    // Update entry
    await prisma.gameEntry.update({
      where: { id: entry.id },
      data: {
        answers: updatedAnswers,
        score: newTotalScore,
        answered: entry.answered + 1,
      },
    });

    return {
      success: true,
      isCorrect,
      pointsEarned,
      totalScore: newTotalScore,
    };
  } catch (error) {
    console.error("["+SERVICE+"]", "answer_error", {
      gameId,
      fid,
      questionId,
      error: (error instanceof Error ? error.message : String(error)),
    });
    return {
      success: false,
      error: "Failed to submit answer",
      code: "INTERNAL_ERROR",
    };
  }
}
