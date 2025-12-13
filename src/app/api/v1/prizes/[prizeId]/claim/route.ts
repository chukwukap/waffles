import { NextResponse } from "next/server";
import { withAuth, type AuthResult, type ApiError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

type Params = { prizeId: string };

const claimSchema = z.object({
  gameId: z.number().int().positive("Invalid Game ID"),
});

interface ClaimResponse {
  success: boolean;
  message: string;
  claimedAt: Date;
}

/**
 * POST /api/v1/prizes/[prizeId]/claim
 * Claim a prize (auth required)
 *
 * Note: prizeId here refers to the gameId for simplicity
 * In a more complex system, prizes would have their own IDs
 */
export const POST = withAuth<Params>(
  async (request, auth: AuthResult, params) => {
    try {
      const gameIdNum = parseInt(params.prizeId, 10);

      if (isNaN(gameIdNum)) {
        return NextResponse.json<ApiError>(
          { error: "Invalid prize ID", code: "INVALID_PARAM" },
          { status: 400 }
        );
      }

      // Find game player record
      const gamePlayer = await prisma.gamePlayer.findUnique({
        where: { gameId_userId: { gameId: gameIdNum, userId: auth.userId } },
        select: {
          claimedAt: true,
          rank: true,
          score: true,
          game: {
            select: {
              status: true,
              tickets: {
                where: { userId: auth.userId, status: "PAID" },
                select: { amountUSDC: true },
              },
            },
          },
        },
      });

      if (!gamePlayer) {
        return NextResponse.json<ApiError>(
          { error: "Game record not found", code: "NOT_FOUND" },
          { status: 404 }
        );
      }

      // Check if game has ended
      if (gamePlayer.game.status !== "ENDED") {
        return NextResponse.json<ApiError>(
          { error: "Game has not ended yet", code: "GAME_NOT_ENDED" },
          { status: 400 }
        );
      }

      // Check if already claimed
      if (gamePlayer.claimedAt) {
        return NextResponse.json<ApiError>(
          { error: "Prize already claimed", code: "ALREADY_CLAIMED" },
          { status: 400 }
        );
      }

      // Check eligibility (rank 1 or has winnings)
      const winnings = gamePlayer.game.tickets[0]?.amountUSDC ?? 0;
      const isEligible = gamePlayer.rank === 1 || winnings > 0;

      if (!isEligible) {
        return NextResponse.json<ApiError>(
          { error: "Not eligible for a prize", code: "NOT_ELIGIBLE" },
          { status: 403 }
        );
      }

      // Update database with claim timestamp
      const claimedAt = new Date();
      await prisma.gamePlayer.update({
        where: { gameId_userId: { gameId: gameIdNum, userId: auth.userId } },
        data: { claimedAt },
      });

      // TODO: In production, trigger actual payout via OnchainKit
      // await sendUSDC(user.wallet, winnings);

      const response: ClaimResponse = {
        success: true,
        message: "Prize claimed successfully!",
        claimedAt,
      };

      return NextResponse.json(response);
    } catch (error) {
      console.error("POST /api/v1/prizes/[prizeId]/claim Error:", error);
      return NextResponse.json<ApiError>(
        { error: "Internal server error", code: "INTERNAL_ERROR" },
        { status: 500 }
      );
    }
  }
);
