import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const farcasterId = request.headers.get("x-farcaster-id");
    if (!farcasterId || !/^\d+$/.test(farcasterId)) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or missing Farcaster ID header" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { fid: Number(farcasterId) },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const gameIdParam = searchParams.get("gameId");
    const gameId = gameIdParam ? parseInt(gameIdParam, 10) : null;

    const tickets = await prisma.ticket.findMany({
      where: {
        userId: user.id,
        ...(gameId && !isNaN(gameId) && { gameId: gameId }),
      },
      include: {
        game: { select: { name: true } },
      },
      orderBy: { purchasedAt: "desc" },
    });

    const result = tickets.map((ticket) => ({
      id: ticket.id,
      gameId: ticket.gameId,
      gameTitle: ticket.game.name,
      code: ticket.code,
      amountUSDC: ticket.amountUSDC,
      status: ticket.status,
      txHash: ticket.txHash,
      purchasedAt: ticket.purchasedAt,
      usedAt: ticket.usedAt,
    }));
    return NextResponse.json(result);
  } catch (error) {
    // Catch unexpected errors
    console.error("GET /api/tickets Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

const postBodySchema = z.object({
  gameId: z.number().int().positive("Game ID must be a positive integer."),
});

export async function POST(request: NextRequest) {
  try {
    const farcasterId = request.headers.get("x-farcaster-id");
    if (!farcasterId || !/^\d+$/.test(farcasterId)) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or missing Farcaster ID header" },
        { status: 401 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const parseResult = postBodySchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          issues: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }
    const { gameId } = parseResult.data;

    const user = await prisma.user.findUnique({
      where: { fid: Number(farcasterId) },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const referral = await prisma.referral.findFirst({
      where: { inviteeId: user.id },
    });
    if (!referral) {
      return NextResponse.json(
        { error: "A valid invite is required to reserve a ticket." },
        { status: 403 }
      );
    }

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: { config: true },
    });
    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }
    if (!game.config) {
      return NextResponse.json(
        { error: "Game configuration missing" },
        { status: 500 }
      );
    }
    const now = new Date();
    if (game.startTime && now >= game.startTime) {
      return NextResponse.json(
        { error: "Cannot reserve ticket: Game has already started" },
        { status: 400 }
      );
    }

    const existingTicket = await prisma.ticket.findUnique({
      where: {
        gameId_userId: { userId: user.id, gameId: game.id },
      },
      include: { game: { select: { name: true } } },
    });
    if (existingTicket) {
      const result = {
        id: existingTicket.id,
        gameId: existingTicket.gameId,
        gameTitle: existingTicket.game.name,
        code: existingTicket.code,
        amountUSDC: existingTicket.amountUSDC,
        status: existingTicket.status,
        txHash: existingTicket.txHash,
        purchasedAt: existingTicket.purchasedAt,
        usedAt: existingTicket.usedAt,
      };
      return NextResponse.json(result, { status: 200 });
    }

    // 7. Generate Unique Code
    let code: string;
    for (let attempt = 0; attempt < 10; attempt++) {
      code = randomBytes(6).toString("hex").toUpperCase();
      if (!(await prisma.ticket.findUnique({ where: { code } }))) {
        break;
      }
      if (attempt === 9) {
        throw new Error("Could not generate unique ticket code");
      }
    }

    const ticket = await prisma.ticket.create({
      data: {
        userId: user.id,
        gameId: game.id,
        amountUSDC: game.config.ticketPrice,
        code: code!,
        txHash: null,
        status: "pending",
      },
      include: { game: { select: { name: true } } },
    });

    const result = {
      id: ticket.id,
      gameId: ticket.gameId,
      gameTitle: ticket.game.name,
      code: ticket.code,
      amountUSDC: ticket.amountUSDC,
      status: ticket.status,
      txHash: ticket.txHash,
      purchasedAt: ticket.purchasedAt,
      usedAt: ticket.usedAt,
    };
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("POST /api/tickets Error:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Ticket already exists (race condition)." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Ensure dynamic execution for GET requests
export const dynamic = "force-dynamic";
