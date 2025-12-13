import { NextResponse } from "next/server";
import { withAuth, type AuthResult, type ApiError } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Params = { gameId: string };

/**
 * POST /api/v1/games/[gameId]/leave
 * Leave a game (auth required)
 */
export const POST = withAuth<Params>(
  async (request, auth: AuthResult, params) => {
    try {
      const gameIdNum = parseInt(params.gameId, 10);

      if (isNaN(gameIdNum)) {
        return NextResponse.json<ApiError>(
          { error: "Invalid game ID", code: "INVALID_PARAM" },
          { status: 400 }
        );
      }

      // Check if game exists
      const game = await prisma.game.findUnique({
        where: { id: gameIdNum },
        select: { id: true },
      });

      if (!game) {
        return NextResponse.json<ApiError>(
          { error: "Game not found", code: "NOT_FOUND" },
          { status: 404 }
        );
      }

      // Remove participation (delete the record)
      await prisma.gamePlayer.deleteMany({
        where: { userId: auth.userId, gameId: gameIdNum },
      });

      return NextResponse.json({ success: true, gameId: gameIdNum });
    } catch (error) {
      console.error("POST /api/v1/games/[gameId]/leave Error:", error);
      return NextResponse.json<ApiError>(
        { error: "Internal server error", code: "INTERNAL_ERROR" },
        { status: 500 }
      );
    }
  }
);
