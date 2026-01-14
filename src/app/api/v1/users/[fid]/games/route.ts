import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Params = { fid: string };

interface ApiError {
  error: string;
  code?: string;
}

/**
 * GET /api/v1/users/[fid]/games
 * Get game history for a user (public endpoint)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { fid: fidParam } = await params;
    const fid = parseInt(fidParam, 10);

    if (isNaN(fid)) {
      return NextResponse.json<ApiError>(
        { error: "Invalid fid", code: "INVALID_INPUT" },
        { status: 400 }
      );
    }

    // Look up user by fid
    const user = await prisma.user.findUnique({
      where: { fid },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json<ApiError>(
        { error: "User not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const entries = await prisma.gameEntry.findMany({
      where: { userId: user.id },
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
    console.error("GET /api/v1/users/[fid]/games Error:", error);
    return NextResponse.json<ApiError>(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
