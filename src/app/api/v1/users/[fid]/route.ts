import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Params = { fid: string };

/**
 * GET /api/v1/users/[fid]
 * Get public user profile (public endpoint - no auth required)
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  try {
    const { fid } = await context.params;
    const fidNum = parseInt(fid, 10);

    if (isNaN(fidNum)) {
      return NextResponse.json(
        { error: "Invalid FID", code: "INVALID_PARAM" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { fid: fidNum },
      select: {
        id: true,
        fid: true,
        username: true,
        pfpUrl: true,
        createdAt: true,
        _count: {
          select: {
            games: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Get user stats (public info only)
    const stats = await prisma.gamePlayer.aggregate({
      where: { userId: user.id },
      _sum: { score: true },
      _count: { _all: true },
    });

    // Calculate wins (rank 1)
    const wins = await prisma.gamePlayer.count({
      where: { userId: user.id, rank: 1 },
    });

    return NextResponse.json({
      fid: user.fid,
      username: user.username,
      pfpUrl: user.pfpUrl,
      createdAt: user.createdAt,
      stats: {
        gamesPlayed: stats._count._all,
        totalScore: stats._sum.score ?? 0,
        wins,
      },
    });
  } catch (error) {
    console.error("GET /api/v1/users/[fid] Error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
