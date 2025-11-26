import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export interface LeaderboardEntry {
  rank: number;
  fid: number;
  username: string | null;
  pfpUrl: string | null;
  points: number;
  isCurrentUser: boolean;
}

export interface LeaderboardData {
  topUsers: LeaderboardEntry[];
  currentUser: LeaderboardEntry | null;
  totalUsers: number;
}

/**
 * GET /api/leaderboard?fid=<fid>&limit=<limit>
 * Returns leaderboard data with top users ranked by points
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fidParam = searchParams.get("fid");
    const limitParam = searchParams.get("limit");

    const currentUserFid = fidParam ? Number(fidParam) : null;
    const limit = limitParam ? Number(limitParam) : 50;

    // Get total count of users with points
    const totalUsers = await prisma.user.count({
      where: {
        waitlistPoints: { gt: 0 },
      },
    });

    // Get top users ordered by points
    const topUsers = await prisma.user.findMany({
      where: {
        waitlistPoints: { gt: 0 },
      },
      orderBy: [
        { waitlistPoints: "desc" },
        { createdAt: "asc" }, // Tiebreaker: earlier join wins
      ],
      take: limit,
      select: {
        fid: true,
        username: true,
        pfpUrl: true,
        waitlistPoints: true,
      },
    });

    // Map to leaderboard entries with rank
    const topEntries: LeaderboardEntry[] = topUsers.map((user, index) => ({
      rank: index + 1,
      fid: user.fid,
      username: user.username,
      pfpUrl: user.pfpUrl,
      points: user.waitlistPoints,
      isCurrentUser: currentUserFid ? user.fid === currentUserFid : false,
    }));

    // Get current user's data if specified
    let currentUserEntry: LeaderboardEntry | null = null;
    if (currentUserFid) {
      // Check if already in top list
      const inTopList = topEntries.find(
        (entry) => entry.fid === currentUserFid
      );

      if (inTopList) {
        currentUserEntry = inTopList;
      } else {
        // User not in top list, need to fetch their data and calculate rank
        const currentUser = await prisma.user.findUnique({
          where: { fid: currentUserFid },
          select: {
            fid: true,
            username: true,
            pfpUrl: true,
            waitlistPoints: true,
            createdAt: true,
          },
        });

        if (currentUser && currentUser.waitlistPoints > 0) {
          // Get count of users with better scores (more points OR same points but earlier join)
          const betterCount = await prisma.user.count({
            where: {
              OR: [
                { waitlistPoints: { gt: currentUser.waitlistPoints } },
                {
                  waitlistPoints: currentUser.waitlistPoints,
                  createdAt: { lt: currentUser.createdAt },
                },
              ],
            },
          });

          currentUserEntry = {
            rank: betterCount + 1,
            fid: currentUser.fid,
            username: currentUser.username,
            pfpUrl: currentUser.pfpUrl,
            points: currentUser.waitlistPoints,
            isCurrentUser: true,
          };
        }
      }
    }

    const leaderboardData: LeaderboardData = {
      topUsers: topEntries,
      currentUser: currentUserEntry,
      totalUsers,
    };

    return NextResponse.json(leaderboardData);
  } catch (error) {
    console.error("GET /api/leaderboard Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
