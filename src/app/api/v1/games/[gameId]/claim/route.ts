import { NextResponse } from "next/server";
import { withAuth, type AuthResult, type ApiError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendToUser } from "@/lib/notifications";
import { env } from "@/lib/env";
import { WINNERS_COUNT } from "@/lib/game/prizeDistribution";

type Params = { gameId: string };

interface ClaimResponse {
  success: true;
  message: string;
  claimedAt: string;
}

/**
 * POST /api/v1/games/[gameId]/claim
 * Sync prize claim winnings with backend after on-chain transaction.
 * Marks the prize as claimed in DB and sends notifications.
 */
export const POST = withAuth<Params>(
  async (request, auth: AuthResult, params) => {
    try {
      const { gameId } = params;

      if (!gameId) {
        return NextResponse.json<ApiError>(
          { error: "Invalid Game ID", code: "INVALID_ID" },
          { status: 400 }
        );
      }

      // Find game entry with user fid, prize, and access status
      const entry = await prisma.gameEntry.findUnique({
        where: { gameId_userId: { gameId, userId: auth.userId } },
        select: {
          claimedAt: true,
          rank: true,
          score: true,
          paidAt: true,
          prize: true,
          user: { select: { fid: true, hasGameAccess: true, isBanned: true } },
        },
      });

      if (!entry) {
        return NextResponse.json<ApiError>(
          { error: "Game entry not found", code: "NOT_FOUND" },
          { status: 404 }
        );
      }

      // Check if already claimed
      if (entry.claimedAt) {
        return NextResponse.json<ApiError>(
          { error: "Prize already claimed", code: "ALREADY_CLAIMED" },
          { status: 400 }
        );
      }

      // Check if paid
      if (!entry.paidAt) {
        return NextResponse.json<ApiError>(
          { error: "Entry not paid", code: "NOT_PAID" },
          { status: 400 }
        );
      }

      // Check eligibility (top winners get prizes)
      const isEligible =
        entry.rank !== null &&
        entry.rank <= WINNERS_COUNT &&
        entry.prize !== null &&
        entry.prize > 0;

      if (!isEligible) {
        return NextResponse.json<ApiError>(
          { error: "Not eligible for a prize", code: "NOT_ELIGIBLE" },
          { status: 400 }
        );
      }

      // Claim the prize in DB
      const claimedAt = new Date();
      await prisma.gameEntry.update({
        where: { gameId_userId: { gameId, userId: auth.userId } },
        data: { claimedAt },
      });

      // Send congratulations notification (only if user has access)
      if (entry.user.hasGameAccess && !entry.user.isBanned) {
        const prizeAmount = entry.prize ?? 0;
        sendToUser(entry.user.fid, {
          title: "💰 Prize Claimed!",
          body: `Congratulations! $${prizeAmount.toFixed(
            2
          )} has been sent to your wallet.`,
          targetUrl: `${env.rootUrl}/profile`,
        }).catch((err: Error) =>
          console.error("[Claim] Notification error:", err)
        );
      }

      return NextResponse.json<ClaimResponse>({
        success: true,
        message: "Prize claimed successfully!",
        claimedAt: claimedAt.toISOString(),
      });
    } catch (error) {
      console.error("POST /api/v1/games/[gameId]/claim Error:", error);
      return NextResponse.json<ApiError>(
        { error: "Internal server error", code: "INTERNAL_ERROR" },
        { status: 500 }
      );
    }
  }
);
