import { NextResponse } from "next/server";
import { prisma, type Prisma } from "@/lib/db";
import { getGamePhase, type GamePhase } from "@/lib/game-utils";

/**
 * GET /api/v1/games
 * List all games (public endpoint - no auth required)
 * Query params:
 *   - status: filter by phase (SCHEDULED, LIVE, ENDED)
 *   - limit: max results (default 10)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phaseFilter = searchParams.get("status") as GamePhase | null;
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const now = new Date();

    // Build where clause for time-based phase filtering
    const whereClause: Prisma.GameWhereInput = {};

    if (phaseFilter === "LIVE") {
      whereClause.startsAt = { lte: now };
      whereClause.endsAt = { gt: now };
    } else if (phaseFilter === "ENDED") {
      whereClause.endsAt = { lte: now };
    } else if (phaseFilter === "SCHEDULED") {
      whereClause.startsAt = { gt: now };
    }

    const games = await prisma.game.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        theme: true,
        startsAt: true,
        endsAt: true,
        tierPrices: true,
        prizePool: true,
        playerCount: true,
        maxPlayers: true,
      },
      orderBy: { startsAt: "desc" },
      take: Math.min(limit, 50),
    });

    // Add computed phase to each game
    const gamesWithPhase = games.map((game) => ({
      ...game,
      status: getGamePhase(game),
    }));

    return NextResponse.json(gamesWithPhase);
  } catch (error) {
    console.error("GET /api/v1/games Error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
