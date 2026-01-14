import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Params = { fid: string };

interface ApiError {
  error: string;
  code?: string;
}

interface Mutual {
  fid: number;
  username: string | null;
  pfpUrl: string | null;
}

/**
 * GET /api/v1/users/[fid]/mutuals
 * Get mutual game players (public endpoint)
 * Returns users who have played games together
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
        { error: "Invalid FID", code: "INVALID_PARAM" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const context = searchParams.get("context") || "game";

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

    // Get games the user has played (paid entries)
    const myEntries = await prisma.gameEntry.findMany({
      where: { userId: user.id, paidAt: { not: null } },
      select: { gameId: true },
    });

    const myGameIds = myEntries.map((e) => e.gameId);

    // Find other users who played the same games
    const mutualPlayers = await prisma.gameEntry.findMany({
      where: {
        gameId: { in: myGameIds },
        userId: { not: user.id },
        paidAt: { not: null },
      },
      include: {
        user: {
          select: {
            fid: true,
            username: true,
            pfpUrl: true,
          },
        },
      },
      distinct: ["userId"],
      take: 20,
    });

    const mutuals: Mutual[] = mutualPlayers.map((entry) => ({
      fid: entry.user.fid,
      username: entry.user.username,
      pfpUrl: entry.user.pfpUrl,
    }));

    return NextResponse.json({
      mutuals,
      context,
      count: mutuals.length,
    });
  } catch (error) {
    console.error("GET /api/v1/users/[fid]/mutuals Error:", error);
    return NextResponse.json<ApiError>(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
