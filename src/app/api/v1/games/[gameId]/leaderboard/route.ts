import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Params = { gameId: string };

interface LeaderboardEntry {
  rank: number;
  userId: number;
  fid: number;
  username: string | null;
  pfpUrl: string | null;
  score: number;
}

/**
 * GET /api/v1/games/[gameId]/leaderboard
 * Get game leaderboard (public endpoint - no auth required)
 * Query params:
 *   - limit: max results (default 50)
 *   - offset: pagination offset (default 0)
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  try {
    const { gameId } = await context.params;
    const gameIdNum = parseInt(gameId, 10);

    if (isNaN(gameIdNum)) {
      return NextResponse.json(
        { error: "Invalid game ID", code: "INVALID_PARAM" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "50", 10),
      100
    );
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Check if game exists
    const game = await prisma.game.findUnique({
      where: { id: gameIdNum },
      select: { id: true },
    });

    if (!game) {
      return NextResponse.json(
        { error: "Game not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Get leaderboard
    const gamePlayers = await prisma.gamePlayer.findMany({
      where: { gameId: gameIdNum },
      include: {
        user: {
          select: {
            id: true,
            fid: true,
            username: true,
            pfpUrl: true,
          },
        },
      },
      orderBy: { score: "desc" },
      take: limit,
      skip: offset,
    });

    const leaderboard: LeaderboardEntry[] = gamePlayers.map((gp, index) => ({
      rank: offset + index + 1,
      userId: gp.user.id,
      fid: gp.user.fid,
      username: gp.user.username,
      pfpUrl: gp.user.pfpUrl,
      score: gp.score,
    }));

    // Get total count for pagination
    const totalCount = await prisma.gamePlayer.count({
      where: { gameId: gameIdNum },
    });

    return NextResponse.json({
      leaderboard,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    });
  } catch (error) {
    console.error("GET /api/v1/games/[gameId]/leaderboard Error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
