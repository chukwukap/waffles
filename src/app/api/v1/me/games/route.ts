import { NextResponse } from "next/server";
import { withAuth, type AuthResult, type ApiError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getGamePhase } from "@/lib/types";

/**
 * GET /api/v1/me/games
 * Get game history for the authenticated user
 */
export const GET = withAuth(async (request, auth: AuthResult) => {
  try {
    // Get all entries for the user
    const entries = await prisma.gameEntry.findMany({
      where: {
        userId: auth.userId,
        paidAt: { not: null }, // Only paid entries
      },
      include: {
        game: {
          select: {
            id: true,
            title: true,
            theme: true,
            startsAt: true,
            endsAt: true,
            prizePool: true,
            playerCount: true,
            _count: {
              select: {
                questions: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate rank for each game entry
    const response = await Promise.all(
      entries.map(async (entry) => {
        // Get rank by counting entries with higher scores in the same game
        const higherScores = await prisma.gameEntry.count({
          where: {
            gameId: entry.gameId,
            paidAt: { not: null },
            score: { gt: entry.score },
          },
        });

        const phase = getGamePhase(entry.game);

        return {
          id: entry.id,
          gameId: entry.gameId,
          score: entry.score,
          rank: entry.rank ?? higherScores + 1,
          paidAt: entry.paidAt,
          claimedAt: entry.claimedAt,
          answeredQuestions: entry.answered,
          game: {
            id: entry.game.id,
            title: entry.game.title,
            theme: entry.game.theme,
            startsAt: entry.game.startsAt,
            endsAt: entry.game.endsAt,
            status: phase,
            prizePool: entry.game.prizePool,
            totalQuestions: entry.game._count.questions,
            playersCount: entry.game.playerCount,
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
