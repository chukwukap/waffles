import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type {
  GameStatus,
  Prisma,
} from "../../../../../prisma/generated/client";

/**
 * GET /api/v1/games
 * List all games (public endpoint - no auth required)
 * Query params:
 *   - status: filter by status (SCHEDULED, LIVE, ENDED)
 *   - limit: max results (default 10)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as GameStatus | null;
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const whereClause: Prisma.GameWhereInput = {};
    if (
      status &&
      ["SCHEDULED", "LIVE", "ENDED", "CANCELLED"].includes(status)
    ) {
      whereClause.status = status;
    }

    const games = await prisma.game.findMany({
      where: whereClause,
      select: {
        id: true,
        startsAt: true,
        endsAt: true,
        status: true,
        entryFee: true,
        prizePool: true,
        _count: {
          select: {
            tickets: true,
            players: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 50),
    });

    return NextResponse.json(games);
  } catch (error) {
    console.error("GET /api/v1/games Error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
