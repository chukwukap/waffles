import { prisma } from "@/lib/db";
import { randomBytes } from "crypto";

/**
 * POST endpoint for creating a Ticket, validated against schema.prisma.
 * - Ensures user and game exist.
 * - Respects unique ticket constraint per (gameId, userId).
 * - Checks for valid positive amount.
 * - Validates USDC amount matches game's config.ticketPrice if available.
 * - Sets status based on txHash.
 * - Returns appropriate error codes and messages for all errors.
 *
 * NOTE: This endpoint now expects `farcasterId` (not userId) and will look up the user.
 */
export async function POST(req: Request) {
  try {
    const { farcasterId, gameId, txHash } = await req.json();
    console.log("buyTicket request:", farcasterId, gameId, txHash);

    // Input validation
    if (!farcasterId || !gameId) {
      return Response.json(
        { error: "Invalid or missing farcasterId, gameId" },
        { status: 400 }
      );
    }

    // Look up user by farcasterId (assume column name is `farcasterId`)
    const user = await prisma.user.findUnique({
      where: { farcasterId: farcasterId.toString() },
    });
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }
    const userId = user.id;

    // Check if game exists and load config
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: { config: true },
    });
    if (!game) {
      return Response.json({ error: "Game not found" }, { status: 404 });
    }

    if (!game.config) {
      return Response.json({ error: "Game config not found" }, { status: 404 });
    }

    // Only one ticket per user per game: if already exists, return success
    const existingTicket = await prisma.ticket.findUnique({
      where: {
        gameId_userId: {
          gameId,
          userId,
        },
      },
    });
    if (existingTicket) {
      // Return success with the existing ticket object
      return Response.json(existingTicket, { status: 200 });
    }

    // Generate unique 8-char code
    let code: string;
    let retry = 0;
    while (true) {
      code = randomBytes(6).toString("hex").toUpperCase();
      if (!(await prisma.ticket.findUnique({ where: { code } }))) {
        break;
      }
      retry++;
      if (retry > 5) {
        return Response.json(
          { error: "Could not generate unique ticket code" },
          { status: 500 }
        );
      }
    }

    // Set status
    const status =
      typeof txHash === "string" && txHash.length > 0 ? "confirmed" : "pending";

    // Compose ticket data
    const ticket = await prisma.ticket.create({
      data: {
        user: { connect: { id: userId } },
        game: { connect: { id: gameId } },
        amountUSDC: game.config.ticketPrice,
        code,
        txHash: txHash ?? null,
        status,
      },
    });

    return Response.json(ticket);
  } catch (e) {
    // Prisma known request error for unique constraint violation
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      e.code === "P2002"
    ) {
      return Response.json(
        { error: "Ticket already exists for this user and game" },
        { status: 409 }
      );
    }
    console.error(e);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
