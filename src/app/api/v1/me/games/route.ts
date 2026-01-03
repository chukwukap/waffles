import { NextResponse } from "next/server";
import { withAuth, type AuthResult, type ApiError } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * GET /api/v1/me/games
 * Get game history for the authenticated user
 */
export const GET = withAuth(async (request, auth: AuthResult) => {
  try {
    // Single efficient query - no N+1 problem
    const entries = await prisma.gameEntry.findMany({
      where: { userId: auth.userId },
      select: {
        id: true,
        gameId: true,
        score: true,
        rank: true,
        prize: true,
        paidAt: true,
        claimedAt: true,
        answered: true,
        game: {
          select: {
            id: true,
            gameNumber: true,
            onchainId: true,
            title: true,
            theme: true,
            startsAt: true,
            endsAt: true,
            prizePool: true,
            playerCount: true,
            _count: { select: { questions: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Map to response format (no extra queries needed)
    const response = entries.map((entry) => ({
      id: entry.id,
      gameId: entry.gameId,
      score: entry.score,
      rank: entry.rank,
      prize: entry.prize ?? 0,
      paidAt: entry.paidAt,
      claimedAt: entry.claimedAt,
      answeredQuestions: entry.answered,
      game: {
        id: entry.game.id,
        gameNumber: entry.game.gameNumber,
        onchainId: entry.game.onchainId,
        title: entry.game.title,
        theme: entry.game.theme,
        startsAt: entry.game.startsAt,
        endsAt: entry.game.endsAt,
        prizePool: entry.game.prizePool,
        totalQuestions: entry.game._count.questions,
        playersCount: entry.game.playerCount,
      },
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error("GET /api/v1/me/games Error:", error);
    return NextResponse.json<ApiError>(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
});
