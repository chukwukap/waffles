import { NextResponse } from "next/server";
import { withAuth, type AuthResult, type ApiError } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Params = { gameId: string };

/**
 * GET /api/v1/games/:gameId/entry
 * Get the current user's entry for a specific game.
 */
export const GET = withAuth<Params>(
  async (request, auth: AuthResult, params) => {
    try {
      const gameId = parseInt(params.gameId, 10);

      if (isNaN(gameId)) {
        return NextResponse.json<ApiError>(
          { error: "Invalid game ID", code: "INVALID_INPUT" },
          { status: 400 }
        );
      }

      const entry = await prisma.gameEntry.findUnique({
        where: {
          gameId_userId: {
            gameId,
            userId: auth.userId,
          },
        },
        select: {
          id: true,
          score: true,
          answered: true,
          paidAt: true,
          rank: true,
          prize: true,
          createdAt: true,
        },
      });

      if (!entry) {
        return NextResponse.json<ApiError>(
          { error: "Entry not found", code: "NOT_FOUND" },
          { status: 404 }
        );
      }

      return NextResponse.json(entry);
    } catch (error) {
      console.error("GET /api/v1/games/:gameId/entry Error:", error);
      return NextResponse.json<ApiError>(
        { error: "Internal server error", code: "INTERNAL_ERROR" },
        { status: 500 }
      );
    }
  }
);

/**
 * POST /api/v1/games/:gameId/entry
 * Create a new entry for a game after payment.
 */
export const POST = withAuth<Params>(
  async (request, auth: AuthResult, params) => {
    try {
      const gameId = parseInt(params.gameId, 10);

      if (isNaN(gameId)) {
        return NextResponse.json<ApiError>(
          { error: "Invalid game ID", code: "INVALID_INPUT" },
          { status: 400 }
        );
      }

      const body = await request.json();
      const { txHash } = body;

      if (!txHash || typeof txHash !== "string") {
        return NextResponse.json<ApiError>(
          { error: "Transaction hash is required", code: "INVALID_INPUT" },
          { status: 400 }
        );
      }

      // Check if entry already exists
      const existing = await prisma.gameEntry.findUnique({
        where: {
          gameId_userId: {
            gameId,
            userId: auth.userId,
          },
        },
      });

      if (existing) {
        return NextResponse.json<ApiError>(
          { error: "Entry already exists", code: "ALREADY_EXISTS" },
          { status: 409 }
        );
      }

      // Verify game exists and is not ended
      const game = await prisma.game.findUnique({
        where: { id: gameId },
        select: {
          id: true,
          endsAt: true,
          playerCount: true,
          maxPlayers: true,
          ticketPrice: true,
        },
      });

      if (!game) {
        return NextResponse.json<ApiError>(
          { error: "Game not found", code: "NOT_FOUND" },
          { status: 404 }
        );
      }

      if (new Date() >= game.endsAt) {
        return NextResponse.json<ApiError>(
          { error: "Game has ended", code: "GAME_ENDED" },
          { status: 400 }
        );
      }

      if (game.playerCount >= game.maxPlayers) {
        return NextResponse.json<ApiError>(
          { error: "Game is full", code: "GAME_FULL" },
          { status: 400 }
        );
      }

      // Create entry and update game counters atomically
      const entry = await prisma.$transaction(async (tx) => {
        const newEntry = await tx.gameEntry.create({
          data: {
            gameId,
            userId: auth.userId,
            txHash,
            paidAt: new Date(),
          },
        });

        await tx.game.update({
          where: { id: gameId },
          data: {
            playerCount: { increment: 1 },
            prizePool: { increment: game.ticketPrice },
          },
        });

        return newEntry;
      });

      return NextResponse.json(entry, { status: 201 });
    } catch (error) {
      console.error("POST /api/v1/games/:gameId/entry Error:", error);
      return NextResponse.json<ApiError>(
        { error: "Internal server error", code: "INTERNAL_ERROR" },
        { status: 500 }
      );
    }
  }
);
