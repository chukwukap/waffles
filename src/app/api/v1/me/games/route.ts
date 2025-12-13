import { NextResponse } from "next/server";
import { withAuth, type AuthResult, type ApiError } from "@/lib/auth";
import { prisma } from "@/lib/db";

interface GameHistoryResponse {
  id: number;
  gameId: number;
  score: number;
  rank: number | null;
  joinedAt: Date;
  game: {
    id: number;
    startsAt: Date;
    endsAt: Date;
    status: string;
    prizePool: number;
    _count: {
      players: number;
    };
  };
}

/**
 * GET /api/v1/me/games
 * Get game history for the authenticated user
 */
export const GET = withAuth(async (request, auth: AuthResult) => {
  try {
    const gamePlayers = await prisma.gamePlayer.findMany({
      where: { userId: auth.userId },
      include: {
        game: {
          select: {
            id: true,
            startsAt: true,
            endsAt: true,
            status: true,
            prizePool: true,
            _count: {
              select: {
                players: true,
              },
            },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    // Calculate rank for each game
    const response: GameHistoryResponse[] = await Promise.all(
      gamePlayers.map(async (gp) => {
        // Get rank by counting players with higher scores
        const higherScores = await prisma.gamePlayer.count({
          where: {
            gameId: gp.gameId,
            score: { gt: gp.score },
          },
        });

        return {
          id: gp.id,
          gameId: gp.gameId,
          score: gp.score,
          rank: higherScores + 1,
          joinedAt: gp.joinedAt,
          game: gp.game,
        };
      })
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error("GET /api/v1/me/games Error:", error);
    return NextResponse.json<ApiError>(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
});
