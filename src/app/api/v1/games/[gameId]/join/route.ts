import { NextResponse } from "next/server";
import { withAuth, type AuthResult, type ApiError } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Params = { gameId: string };

/**
 * POST /api/v1/games/[gameId]/join
 * Join a game (auth required)
 * User must have a valid ticket for this game
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
        select: { id: true, status: true },
      });

      if (!game) {
        return NextResponse.json<ApiError>(
          { error: "Game not found", code: "NOT_FOUND" },
          { status: 404 }
        );
      }

      // Verify and redeem ticket
      const ticket = await prisma.ticket.findUnique({
        where: {
          gameId_userId: {
            gameId: gameIdNum,
            userId: auth.userId,
          },
        },
      });

      if (!ticket || ticket.status !== "PAID") {
        // Allow re-joining if already REDEEMED
        if (ticket?.status === "REDEEMED") {
          // Already redeemed, proceed to ensure GamePlayer exists
        } else {
          return NextResponse.json<ApiError>(
            { error: "Valid ticket required to join", code: "TICKET_REQUIRED" },
            { status: 403 }
          );
        }
      } else {
        // Mark ticket as REDEEMED
        await prisma.ticket.update({
          where: { id: ticket.id },
          data: {
            status: "REDEEMED",
            redeemedAt: new Date(),
          },
        });
      }

      // Create GamePlayer if it doesn't already exist (idempotent)
      await prisma.gamePlayer.upsert({
        where: {
          gameId_userId: {
            gameId: gameIdNum,
            userId: auth.userId,
          },
        },
        update: {}, // Nothing to update if they already joined
        create: {
          gameId: gameIdNum,
          userId: auth.userId,
          score: 0,
        },
      });

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
