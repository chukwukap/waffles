"use server";

import { prisma } from "@/lib/db";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { verifyAuthenticatedUser } from "@/lib/auth";

const claimPrizeSchema = z.object({
  fid: z.coerce.number().int().positive("Invalid FID format."),
  gameId: z.coerce.number().int().positive("Invalid Game ID."),
  // authToken is optional here if you handle auth differently,
  // but usually required for sensitive actions
  authToken: z.string().optional(),
});

export type ClaimPrizeResult =
  | { success: true; message: string; claimedAt: Date }
  | { success: false; error: string };

/**
 * Server Action to handle the user claiming their prize money.
 * Updates the GamePlayer record with a claimedAt timestamp.
 */
export async function claimPrizeAction(
  _prevState: ClaimPrizeResult,
  formData: FormData
): Promise<ClaimPrizeResult> {
  const rawFid = formData.get("fid");
  const rawGameId = formData.get("gameId");
  const rawAuthToken = formData.get("authToken");

  const validation = claimPrizeSchema.safeParse({
    fid: rawFid,
    gameId: rawGameId,
    authToken: rawAuthToken,
  });

  if (!validation.success) {
    const error = validation.error.issues[0]?.message ?? "Invalid input.";
    return { success: false, error: error };
  }

  const { fid, gameId, authToken } = validation.data;

  // 1. Authentication Check (Optional but recommended)
  if (authToken) {
    const authResult = await verifyAuthenticatedUser(authToken, fid);
    if (!authResult.authenticated) {
      return {
        success: false,
        error: authResult.error || "Authentication failed",
      };
    }
  }

  try {
    // 2. Find User & Game Record
    const user = await prisma.user.findUnique({
      where: { fid },
      select: { id: true, wallet: true },
    });

    if (!user) {
      return { success: false, error: "User not found." };
    }

    const gamePlayer = await prisma.gamePlayer.findUnique({
      where: { gameId_userId: { gameId, userId: user.id } },
      select: {
        claimedAt: true,
        rank: true,
        score: true,
        game: {
          select: {
            tickets: {
              where: { userId: user.id, status: "PAID" },
              select: { amountUSDC: true },
            },
          },
        },
      },
    });

    if (!gamePlayer) {
      return { success: false, error: "Game record not found." };
    }

    // 3. Validation Logic
    if (gamePlayer.claimedAt) {
      return { success: false, error: "Prize already claimed." };
    }

    // Check if they actually have winnings to claim
    const winnings = gamePlayer.game.tickets[0]?.amountUSDC ?? 0;
    // Assuming Rank 1 is the only winner for now, OR if winnings > 0
    const isEligible = gamePlayer.rank === 1 || winnings > 0;

    if (!isEligible) {
      return { success: false, error: "Not eligible for a prize." };
    }

    // 4. Simulate/Execute Payout (Mocked for now)
    // In production, you'd trigger a payout via OnchainKit or a backend wallet here.
    // await sendUSDC(user.wallet, winnings);

    // 5. Update Database
    const claimedAt = new Date();
    await prisma.gamePlayer.update({
      where: { gameId_userId: { gameId, userId: user.id } },
      data: {
        claimedAt: claimedAt,
      },
    });

    // 6. Revalidate UI
    revalidatePath(`/profile/${gameId}`);
    revalidatePath(`/profile`);

    return {
      success: true,
      message: "Prize claimed successfully!",
      claimedAt: claimedAt,
    };
  } catch (error) {
    console.error("ClaimPrizeAction Error:", error);
    return { success: false, error: "Failed to process prize claim." };
  }
}
