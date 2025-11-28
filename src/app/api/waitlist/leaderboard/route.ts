import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export type LeaderboardEntry = {
  rank: number;
  fid: number;
  username: string;
  pfpUrl: string;
  points: number;
  isCurrentUser: boolean;
};

export type LeaderboardData = {
  entries: LeaderboardEntry[];
  userRank: number | null;
  totalParticipants: number;
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fid = searchParams.get("fid");
    const limit = parseInt(searchParams.get("limit") || "100");

    const users = await prisma.user.findMany({
      where: {
        status: {
          in: ["WAITLIST", "ACTIVE"],
        },
      },
      orderBy: [
        { waitlistPoints: "desc" },
        { createdAt: "asc" }, // Tie-breaker: earlier joiners rank higher
      ],
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
        status: {
          in: ["WAITLIST", "ACTIVE"],
        },
      },
    });

    let userRank = null;
    if (fid) {
      const user = await prisma.user.findUnique({
        where: { fid: parseInt(fid) },
        select: { waitlistPoints: true },
      });

      if (user) {
        const rank = await prisma.user.count({
          where: {
            waitlistPoints: {
              gt: user.waitlistPoints,
            },
            status: {
              in: ["WAITLIST", "ACTIVE"],
            },
          },
        });
        userRank = rank + 1;
      }
    }

    const entries: LeaderboardEntry[] = users.map((user, index) => ({
      rank: index + 1,
      fid: user.fid,
      username: user.username || `User ${user.fid}`,
      pfpUrl: user.pfpUrl || "",
      points: user.waitlistPoints,
      isCurrentUser: fid ? user.fid === parseInt(fid) : false,
    }));

    return NextResponse.json({
      entries,
      userRank,
      totalParticipants,
    });
  } catch (error) {
    console.error("Error fetching waitlist leaderboard:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
