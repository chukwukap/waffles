import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthResult, type ApiError } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Params = { fid: string };

interface Mutual {
  fid: number;
  username: string | null;
  pfpUrl: string | null;
}

/**
 * GET /api/v1/users/[fid]/mutuals
 * Get mutual followers with another user (auth required)
 *
 * Note: This requires integration with Farcaster API for actual mutual data
 * Currently returns a placeholder implementation
 */
export const GET = withAuth<Params>(
  async (request: NextRequest, auth: AuthResult, params) => {
    try {
      const { fid } = params;
      const targetFid = parseInt(fid, 10);

      if (isNaN(targetFid)) {
        return NextResponse.json<ApiError>(
          { error: "Invalid FID", code: "INVALID_PARAM" },
          { status: 400 }
        );
      }

      const { searchParams } = new URL(request.url);
      const context = searchParams.get("context") || "game";

      // Check if target user exists
      const targetUser = await prisma.user.findUnique({
        where: { fid: targetFid },
        select: { id: true },
      });

      if (!targetUser) {
        return NextResponse.json<ApiError>(
          { error: "User not found", code: "NOT_FOUND" },
          { status: 404 }
        );
      }

      // TODO: Integrate with Farcaster Hub or Neynar API to get actual mutuals
      // For now, return users who have played games together

      // Get games the authenticated user has played (paid entries)
      const myEntries = await prisma.gameEntry.findMany({
        where: { userId: auth.userId, paidAt: { not: null } },
        select: { gameId: true },
      });

      const myGameIds = myEntries.map((e) => e.gameId);

      // Find other users who played the same games
      const mutualPlayers = await prisma.gameEntry.findMany({
        where: {
          gameId: { in: myGameIds },
          userId: { not: auth.userId },
          paidAt: { not: null },
        },
        include: {
          user: {
            select: {
              fid: true,
              username: true,
              pfpUrl: true,
            },
          },
        },
        distinct: ["userId"],
        take: 20,
      });

      const mutuals: Mutual[] = mutualPlayers.map((entry) => ({
        fid: entry.user.fid,
        username: entry.user.username,
        pfpUrl: entry.user.pfpUrl,
      }));

      return NextResponse.json({
        mutuals,
        context,
        count: mutuals.length,
      });
    } catch (error) {
      console.error("GET /api/v1/users/[fid]/mutuals Error:", error);
      return NextResponse.json<ApiError>(
        { error: "Internal server error", code: "INTERNAL_ERROR" },
        { status: 500 }
      );
    }
  }
);
