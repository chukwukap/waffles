import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getGamePhase } from "@/lib/types";

type Params = { fid: string };

interface ApiError {
  error: string;
  code?: string;
}

interface EntryResponse {
  id: string;
  status: string;
  amountUSDC: number;
  gameId: string;
  paidAt: Date | null;
  createdAt: Date;
  score: number;
  answered: number;
  game: {
    id: string;
    startsAt: Date;
    endsAt: Date;
    status: string;
    ticketPrice: number;
  };
}

/**
 * GET /api/v1/users/[fid]/tickets
 * Get all game entries (tickets) for a user (public endpoint)
 * Optional query param: ?gameId=X to filter by specific game
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

    const { searchParams } = new URL(request.url);
    const gameIdParam = searchParams.get("gameId");

    const whereClause: { userId: string; gameId?: string } = {
      userId: user.id,
    };

    if (gameIdParam) {
      whereClause.gameId = gameIdParam;
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
      amountUSDC: entry.paidAmount ?? 0,
      gameId: entry.gameId,
      paidAt: entry.paidAt,
      createdAt: entry.createdAt,
      score: entry.score,
      answered: entry.answered,
      game: {
        id: entry.gameId,
        startsAt: entry.game.startsAt,
        endsAt: entry.game.endsAt,
        status: getGamePhase(entry.game),
        ticketPrice: entry.paidAmount ?? 0,
      },
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error("GET /api/v1/users/[fid]/tickets Error:", error);
    return NextResponse.json<ApiError>(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
