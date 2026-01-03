import { NextResponse } from "next/server";
import { withAuth, type AuthResult, type ApiError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getGamePhase } from "@/lib/types";

type Params = { prizeId: string };

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
      const gameId = params.prizeId;

      if (gameId) {
        return NextResponse.json<ApiError>(
          { error: "Invalid prize ID", code: "INVALID_PARAM" },
          { status: 400 }
        );
      }

      // Find game entry
      const entry = await prisma.gameEntry.findUnique({
        where: { gameId_userId: { gameId, userId: auth.userId } },
        select: {
          claimedAt: true,
          rank: true,
          score: true,
          paidAt: true,
          game: {
            select: {
              startsAt: true,
              endsAt: true,
              tierPrices: true,
              prizePool: true,
            },
          },
        },
      });

      if (!entry) {
        return NextResponse.json<ApiError>(
          { error: "Game entry not found", code: "NOT_FOUND" },
          { status: 404 }
        );
      }

      // Check if game has ended using time-based phase
      const phase = getGamePhase(entry.game);
      if (phase !== "ENDED") {
        return NextResponse.json<ApiError>(
          { error: "Game has not ended yet", code: "GAME_NOT_ENDED" },
          { status: 400 }
        );
      }

      // Check if entry is paid
      if (!entry.paidAt) {
        return NextResponse.json<ApiError>(
          { error: "Entry not paid", code: "NOT_PAID" },
          { status: 400 }
        );
      }

      // Check if already claimed
      if (entry.claimedAt) {
        return NextResponse.json<ApiError>(
          { error: "Prize already claimed", code: "ALREADY_CLAIMED" },
          { status: 400 }
        );
      }

      // Check eligibility (top 3 ranks get prizes)
      const isEligible = entry.rank !== null && entry.rank <= 3;

      if (!isEligible) {
        return NextResponse.json<ApiError>(
          { error: "Not eligible for a prize", code: "NOT_ELIGIBLE" },
          { status: 403 }
        );
      }

      // Update entry with claim timestamp
      const claimedAt = new Date();
      await prisma.gameEntry.update({
        where: { gameId_userId: { gameId: gameId, userId: auth.userId } },
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
