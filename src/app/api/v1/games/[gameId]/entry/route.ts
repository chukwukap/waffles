import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Params = { gameId: string };

interface ApiError {
  error: string;
  code?: string;
}

/**
 * GET /api/v1/games/:gameId/entry?fid=123
 * Get a user's entry for a specific game.
 * Public endpoint - requires fid query parameter.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { gameId } = await params;
    const { searchParams } = new URL(request.url);
    const fidParam = searchParams.get("fid");

    if (!gameId) {
      return NextResponse.json<ApiError>(
        { error: "Invalid game ID", code: "INVALID_INPUT" },
        { status: 400 }
      );
    }

    if (!fidParam) {
      return NextResponse.json<ApiError>(
        { error: "fid query parameter required", code: "INVALID_INPUT" },
        { status: 400 }
      );
    }

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

    const entry = await prisma.gameEntry.findUnique({
      where: {
        gameId_userId: {
          gameId,
          userId: user.id,
        },
      },
      select: {
        id: true,
        score: true,
        answered: true,
        answers: true,
        paidAt: true,
        paidAmount: true,
        rank: true,
        prize: true,
        claimedAt: true,
        createdAt: true,
      },
    });

    if (!entry) {
      return NextResponse.json<ApiError>(
        { error: "Entry not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Extract answered question IDs from the answers JSON
    const answersObj = (entry.answers as Record<string, unknown>) || {};
    const answeredQuestionIds = Object.keys(answersObj);

    return NextResponse.json({
      ...entry,
      answers: undefined,
      answeredQuestionIds,
    });
  } catch (error) {
    console.error("GET /api/v1/games/:gameId/entry Error:", error);
    return NextResponse.json<ApiError>(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

// Note: POST handler moved to Server Action: src/actions/game.ts (purchaseGameTicket)
