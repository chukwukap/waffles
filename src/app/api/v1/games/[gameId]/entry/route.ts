import { NextResponse } from "next/server";
import { withAuth, type AuthResult, type ApiError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendNotificationToUser } from "@/lib/notifications";
import { broadcastGameStats } from "@/lib/partykit";
import { env } from "@/lib/env";

type Params = { gameId: string };

// Helper: Format game start time nicely
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

// Helper: Send ticket notification
async function sendTicketNotification(
  fid: number,
  gameId: number,
  game: { startsAt?: Date; title?: string }
) {
  const startsAt = game.startsAt ? new Date(game.startsAt) : null;
  const timeStr = startsAt ? formatGameTime(startsAt) : "soon";

  await sendNotificationToUser({
    fid,
    title: "🧇 Ticket Secured!",
    body: `Game starts ${timeStr}. Don't miss it!`,
    targetUrl: `${env.rootUrl}/game/${gameId}`,
  });
}

/**
 * GET /api/v1/games/:gameId/entry
 * Get the current user's entry for a specific game.
 */
export const GET = withAuth<Params>(
  async (request, auth: AuthResult, params) => {
    try {
      const gameId = parseInt(params.gameId, 10);

      if (isNaN(gameId)) {
        return NextResponse.json<ApiError>(
          { error: "Invalid game ID", code: "INVALID_INPUT" },
          { status: 400 }
        );
      }

      const entry = await prisma.gameEntry.findUnique({
        where: {
          gameId_userId: {
            gameId,
            userId: auth.userId,
          },
        },
        select: {
          id: true,
          score: true,
          answered: true,
          answers: true, // JSON field with questionId keys
          paidAt: true,
          paidAmount: true,
          rank: true,
          prize: true,
          createdAt: true,
        },
      });

      if (!entry) {
        return NextResponse.json<ApiError>(
          { error: "Entry not found", code: "NOT_FOUND" },
          { status: 404 }
        );
      }

      // Extract answered question IDs from the answers JSON
      const answersObj = (entry.answers as Record<string, unknown>) || {};
      const answeredQuestionIds = Object.keys(answersObj).map(Number);

      return NextResponse.json({
        ...entry,
        answers: undefined, // Don't send full answers object
        answeredQuestionIds,
      });
    } catch (error) {
      console.error("GET /api/v1/games/:gameId/entry Error:", error);
      return NextResponse.json<ApiError>(
        { error: "Internal server error", code: "INTERNAL_ERROR" },
        { status: 500 }
      );
    }
  }
);

/**
 * POST /api/v1/games/:gameId/entry
 * Create a new entry for a game.
 * Trusts the txHash from the frontend (Simplified).
 */
export const POST = withAuth<Params>(
  async (request, auth: AuthResult, params) => {
    try {
      const gameId = parseInt(params.gameId, 10);

      if (isNaN(gameId)) {
        return NextResponse.json<ApiError>(
          { error: "Invalid game ID", code: "INVALID_INPUT" },
          { status: 400 }
        );
      }

      const body = await request.json();
      const { txHash, paidAmount, payerWallet } = body;

      // Validate required fields
      if (!txHash || typeof txHash !== "string") {
        return NextResponse.json<ApiError>(
          { error: "Transaction hash is required", code: "INVALID_INPUT" },
          { status: 400 }
        );
      }

      if (typeof paidAmount !== "number" || paidAmount <= 0) {
        return NextResponse.json<ApiError>(
          {
            error: "Valid positive paidAmount is required",
            code: "INVALID_INPUT",
          },
          { status: 400 }
        );
      }

      // Check if entry already exists
      const existing = await prisma.gameEntry.findUnique({
        where: {
          gameId_userId: {
            gameId,
            userId: auth.userId,
          },
        },
      });

      if (existing) {
        // Entry already exists - return success (idempotent)
        return NextResponse.json(existing, { status: 200 });
      }

      // Verify game exists and is not ended
      const game = await prisma.game.findUnique({
        where: { id: gameId },
        select: {
          id: true,
          startsAt: true,
          endsAt: true,
          prizePool: true,
          playerCount: true,
          maxPlayers: true,
          tierPrices: true,
        },
      });

      if (!game) {
        return NextResponse.json<ApiError>(
          { error: "Game not found", code: "NOT_FOUND" },
          { status: 404 }
        );
      }

      // Security Check: Validate paidAmount against allowed tiers
      const isValidTier = game.tierPrices.some(
        (price) => Math.abs(price - paidAmount) < 0.0001
      );
      if (!isValidTier) {
        return NextResponse.json<ApiError>(
          {
            error: `Invalid payment amount. Allowed tiers: ${game.tierPrices.join(
              ", "
            )}`,
            code: "INVALID_INPUT",
          },
          { status: 400 }
        );
      }

      // Game time/capacity checks
      if (new Date() >= game.endsAt) {
        return NextResponse.json<ApiError>(
          { error: "Game has ended", code: "GAME_ENDED" },
          { status: 400 }
        );
      }

      if (game.playerCount >= game.maxPlayers) {
        return NextResponse.json<ApiError>(
          { error: "Game is full", code: "GAME_FULL" },
          { status: 400 }
        );
      }

      // Create entry and update game counters atomically
      const entry = await prisma.$transaction(async (tx) => {
        const newEntry = await tx.gameEntry.create({
          data: {
            gameId,
            userId: auth.userId,
            txHash,
            payerWallet: payerWallet || null, // Store the wallet that paid
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

        // Check if this is user's first game entry ever
        const entryCount = await tx.gameEntry.count({
          where: { userId: auth.userId },
        });

        if (entryCount === 1) {
          // First game played - unlock any pending referral rewards for this user
          await tx.referralReward.updateMany({
            where: { inviteeId: auth.userId, status: "PENDING" },
            data: { status: "UNLOCKED", unlockedAt: new Date() },
          });
        }

        return newEntry;
      });

      // Send ticket purchase notification (async, don't block response)
      sendTicketNotification(auth.fid, gameId, game).catch((err) =>
        console.error("[Entry] Notification error:", err)
      );

      // Broadcast updated stats to connected clients (async, don't block response)
      broadcastGameStats(gameId, {
        prizePool: game.prizePool + paidAmount,
        playerCount: game.playerCount + 1,
      }).catch((err) => console.error("[Entry] Stats broadcast error:", err));

      return NextResponse.json(entry, { status: 201 });
    } catch (error) {
      console.error("POST /api/v1/games/:gameId/entry Error:", error);
      return NextResponse.json<ApiError>(
        { error: "Internal server error", code: "INTERNAL_ERROR" },
        { status: 500 }
      );
    }
  }
);
