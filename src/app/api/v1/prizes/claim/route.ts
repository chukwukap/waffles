import { NextResponse } from "next/server";
import { withAuth, type AuthResult, type ApiError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { sendToUser } from "@/lib/notifications";
import { env } from "@/lib/env";

const claimSchema = z.object({
  gameId: z.string().min(1, "Invalid Game ID"),
});

interface ClaimResponse {
  success: true;
  message: string;
  claimedAt: string;
}

/**
 * POST /api/v1/prizes/claim
 * Claim prize winnings for a game (auth required)
 */
export const POST = withAuth(async (request, auth: AuthResult) => {
  try {
    const body = await request.json();
    const validation = claimSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json<ApiError>(
        {
          error: validation.error.issues[0]?.message || "Invalid input",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    const { gameId } = validation.data;

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

    // Check eligibility (top 3 ranks get prizes)
    const isEligible = entry.rank !== null && entry.rank <= 3;

    if (!isEligible) {
      return NextResponse.json<ApiError>(
        { error: "Not eligible for a prize", code: "NOT_ELIGIBLE" },
        { status: 400 }
      );
    }

    // Claim the prize
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
    console.error("POST /api/v1/prizes/claim Error:", error);
    return NextResponse.json<ApiError>(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
});
