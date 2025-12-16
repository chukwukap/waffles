import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyQuickAuthRequest } from "@/lib/auth";

interface LeaderboardEntry {
  rank: number;
  fid: number;
  username: string | null;
  pfpUrl: string | null;
  points: number;
  isCurrentUser: boolean;
}

interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  userRank: number | null;
  totalParticipants: number;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * GET /api/v1/waitlist/leaderboard
 * Get waitlist leaderboard (public endpoint - no auth required)
 * If authenticated, includes user's rank and highlights their entry
 * Query params:
 *   - limit: max results (default 50)
 *   - offset: pagination offset (default 0)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "50", 10),
      100
    );
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Check for optional auth to personalize response
    const auth = await verifyQuickAuthRequest(request);
    const currentFid = auth?.fid ?? null;

    const users = await prisma.user.findMany({
      where: {
        OR: [{ joinedWaitlistAt: { not: null } }, { hasGameAccess: true }],
      },
      orderBy: [
        { waitlistPoints: "desc" },
        { createdAt: "asc" }, // Tie-breaker: earlier joiners rank higher
      ],
      skip: offset,
      take: limit,
      select: {
        fid: true,
        username: true,
        pfpUrl: true,
        waitlistPoints: true,
      },
    });

    const totalParticipants = await prisma.user.count({
      where: {
        OR: [{ joinedWaitlistAt: { not: null } }, { hasGameAccess: true }],
      },
    });

    // Calculate user rank if authenticated
    let userRank: number | null = null;
    if (currentFid) {
      const user = await prisma.user.findUnique({
        where: { fid: currentFid },
        select: { waitlistPoints: true },
      });

      if (user) {
        const rank = await prisma.user.count({
          where: {
            waitlistPoints: {
              gt: user.waitlistPoints,
            },
            OR: [{ joinedWaitlistAt: { not: null } }, { hasGameAccess: true }],
          },
        });
        userRank = rank + 1;
      }
    }

    const entries: LeaderboardEntry[] = users.map((user, index) => ({
      rank: offset + index + 1,
      fid: user.fid,
      username: user.username,
      pfpUrl: user.pfpUrl,
      points: user.waitlistPoints,
      isCurrentUser: currentFid ? user.fid === currentFid : false,
    }));

    const response: LeaderboardResponse = {
      entries,
      userRank,
      totalParticipants,
      pagination: {
        total: totalParticipants,
        limit,
        offset,
        hasMore: offset + limit < totalParticipants,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("GET /api/v1/waitlist/leaderboard Error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
