import { NextResponse } from "next/server";
import { withAuth, type AuthResult, type ApiError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getGamePhase } from "@/lib/game-utils";

type Params = { gameId: string };

/**
 * POST /api/v1/games/[gameId]/join
 * Join a game (auth required)
 * Creates a game entry if user doesn't have one
 *
 * Note: This is a simplified join - actual ticket purchase uses /entry endpoint
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

      // Check if game exists and is joinable
      const game = await prisma.game.findUnique({
        where: { id: gameIdNum },
        select: { id: true, startsAt: true, endsAt: true },
      });

      if (!game) {
        return NextResponse.json<ApiError>(
          { error: "Game not found", code: "NOT_FOUND" },
          { status: 404 }
        );
      }

      // Check game phase
      const phase = getGamePhase(game);
      if (phase === "ENDED") {
        return NextResponse.json<ApiError>(
          { error: "Game has ended", code: "GAME_ENDED" },
          { status: 400 }
        );
      }

      // Check if user has a paid entry
      const entry = await prisma.gameEntry.findUnique({
        where: {
          gameId_userId: {
            gameId: gameIdNum,
            userId: auth.userId,
          },
        },
        select: { id: true, paidAt: true },
      });

      if (!entry) {
        return NextResponse.json<ApiError>(
          { error: "Game entry required to join", code: "ENTRY_REQUIRED" },
          { status: 403 }
        );
      }

      if (!entry.paidAt) {
        return NextResponse.json<ApiError>(
          { error: "Payment required to join", code: "PAYMENT_REQUIRED" },
          { status: 403 }
        );
      }

      return NextResponse.json({ success: true, gameId: gameIdNum });
    } catch (error) {
      console.error("POST /api/v1/games/[gameId]/join Error:", error);
      return NextResponse.json<ApiError>(
        { error: "Internal server error", code: "INTERNAL_ERROR" },
        { status: 500 }
      );
    }
  }
);
