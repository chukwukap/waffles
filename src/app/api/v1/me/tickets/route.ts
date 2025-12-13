import { NextResponse } from "next/server";
import { withAuth, type AuthResult, type ApiError } from "@/lib/auth";
import { prisma } from "@/lib/db";

interface TicketResponse {
  id: number;
  code: string;
  status: string;
  amountUSDC: number;
  gameId: number;
  purchasedAt: Date;
  redeemedAt: Date | null;
  game: {
    id: number;
    startsAt: Date;
    endsAt: Date;
    status: string;
  };
}

/**
 * GET /api/v1/me/tickets
 * Get all tickets for the authenticated user
 * Optional query param: ?gameId=X to filter by specific game
 */
export const GET = withAuth(async (request, auth: AuthResult) => {
  try {
    const { searchParams } = new URL(request.url);
    const gameIdParam = searchParams.get("gameId");

    const whereClause: { userId: number; gameId?: number } = {
      userId: auth.userId,
    };

    if (gameIdParam) {
      const gameId = parseInt(gameIdParam, 10);
      if (!isNaN(gameId)) {
        whereClause.gameId = gameId;
      }
    }

    const tickets = await prisma.ticket.findMany({
      where: whereClause,
      include: {
        game: {
          select: {
            id: true,
            startsAt: true,
            endsAt: true,
            status: true,
          },
        },
      },
      orderBy: { purchasedAt: "desc" },
    });

    const response: TicketResponse[] = tickets.map((ticket) => ({
      id: ticket.id,
      code: ticket.code,
      status: ticket.status,
      amountUSDC: ticket.amountUSDC,
      gameId: ticket.gameId,
      purchasedAt: ticket.purchasedAt,
      redeemedAt: ticket.redeemedAt,
      game: ticket.game,
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error("GET /api/v1/me/tickets Error:", error);
    return NextResponse.json<ApiError>(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
});
