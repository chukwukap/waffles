import { NextResponse } from "next/server";
import { withAuth, type AuthResult, type ApiError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getGamePhase } from "@/lib/types";

interface EntryResponse {
  id: number;
  status: string;
  amountUSDC: number;
  gameId: number;
  paidAt: Date | null;
  createdAt: Date;
  score: number;
  answered: number;
  game: {
    id: number;
    startsAt: Date;
    endsAt: Date;
    status: string;
    ticketPrice: number;
  };
}

/**
 * GET /api/v1/me/tickets
 * Get all game entries (tickets) for the authenticated user
 * Optional query param: ?gameId=X to filter by specific game
 */
export const GET = withAuth(async (request, auth: AuthResult) => {
  try {
    const { searchParams } = new URL(request.url);
    const gameIdParam = searchParams.get("gameId");

    const whereClause: { userId: number; gameId?: number } = {
      userId: auth.userId,
    };

    if (gameIdParam) {
      const gameId = parseInt(gameIdParam, 10);
      if (!isNaN(gameId)) {
        whereClause.gameId = gameId;
      }
    }

    const entries = await prisma.gameEntry.findMany({
      where: whereClause,
      include: {
        game: {
          select: {
            id: true,
            startsAt: true,
            endsAt: true,
            tierPrices: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const response: EntryResponse[] = entries.map((entry) => ({
      id: entry.id,
      status: entry.paidAt ? "PAID" : "PENDING",
      amountUSDC: entry.game.tierPrices[0] ?? 0,
      gameId: entry.gameId,
      paidAt: entry.paidAt,
      createdAt: entry.createdAt,
      score: entry.score,
      answered: entry.answered,
      game: {
        id: entry.game.id,
        startsAt: entry.game.startsAt,
        endsAt: entry.game.endsAt,
        status: getGamePhase(entry.game),
        ticketPrice: entry.game.tierPrices[0] ?? 0,
      },
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error("GET /api/v1/me/tickets Error:", error);
    return NextResponse.json<ApiError>(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
});
