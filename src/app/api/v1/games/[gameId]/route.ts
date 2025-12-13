import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Params = { gameId: string };

/**
 * GET /api/v1/games/[gameId]
 * Get game details (public endpoint - no auth required)
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

    const game = await prisma.game.findUnique({
      where: { id: gameIdNum },
      select: {
        id: true,
        title: true,
        description: true,
        theme: true,
        coverUrl: true,
        startsAt: true,
        endsAt: true,
        status: true,
        entryFee: true,
        prizePool: true,
        roundDurationSec: true,
        maxPlayers: true,
        _count: {
          select: {
            tickets: true,
            players: true,
            questions: true,
          },
        },
        questions: {
          select: {
            id: true,
            content: true,
            mediaUrl: true,
            soundUrl: true,
            options: true, // String[] field
            durationSec: true,
            roundIndex: true,
            order: true,
          },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!game) {
      return NextResponse.json(
        { error: "Game not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json(game);
  } catch (error) {
    console.error("GET /api/v1/games/[gameId] Error:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
