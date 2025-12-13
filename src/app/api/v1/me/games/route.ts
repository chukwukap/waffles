import { NextResponse } from "next/server";
import { withAuth, type AuthResult, type ApiError } from "@/lib/auth";
import { prisma } from "@/lib/db";

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
            title: true,
            theme: true,
            startsAt: true,
            endsAt: true,
            status: true,
            prizePool: true,
            _count: {
              select: {
                players: true,
                questions: true,
              },
            },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    // Calculate rank and answered questions for each game
    const response = await Promise.all(
      gamePlayers.map(async (gp) => {
        // Get rank by counting players with higher scores
        const higherScores = await prisma.gamePlayer.count({
          where: {
            gameId: gp.gameId,
            score: { gt: gp.score },
          },
        });

        // Count how many questions the user has answered in this game
        const answeredCount = await prisma.answer.count({
          where: {
            userId: auth.userId,
            gameId: gp.gameId,
          },
        });

        return {
          id: gp.id,
          gameId: gp.gameId,
          score: gp.score,
          rank: higherScores + 1,
          joinedAt: gp.joinedAt,
          claimedAt: gp.claimedAt,
          answeredQuestions: answeredCount,
          game: {
            id: gp.game.id,
            title: gp.game.title,
            theme: gp.game.theme,
            startsAt: gp.game.startsAt,
            endsAt: gp.game.endsAt,
            status: gp.game.status,
            prizePool: gp.game.prizePool,
            totalQuestions: gp.game._count.questions,
            playersCount: gp.game._count.players,
          },
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
