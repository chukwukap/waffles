import { NextResponse } from "next/server";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

// GET /api/tickets
export async function GET(request: Request) {
  const farcasterId = request.headers.get("x-farcaster-id");
  if (!farcasterId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { farcasterId },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const tickets = await prisma.ticket.findMany({
    where: { userId: user.id },
    include: { game: true },
  });
  const result = tickets.map((ticket) => ({
    ticketId: ticket.id,
    gameId: ticket.gameId,
    gameTitle: ticket.game.name,
    code: ticket.code,
    amountUSDC: ticket.amountUSDC,
    purchasedAt: ticket.purchasedAt,
  }));
  return NextResponse.json(result);
}

// POST /api/tickets
export async function POST(request: Request) {
  const schema = z.object({
    typeId: z.string().min(1),
  });
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parseResult = schema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { typeId } = parseResult.data;
  const farcasterId = request.headers.get("x-farcaster-id");
  if (!farcasterId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { farcasterId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  // Find game by slug or typeId
  const game = await prisma.game.findUnique({
    where: { id: parseInt(typeId, 10) },
  });
  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }
  const now = new Date();
  if (game.startTime && now >= game.startTime) {
    return NextResponse.json(
      { error: "Game has already started" },
      { status: 400 }
    );
  }
  const existing = await prisma.ticket.findFirst({
    where: { userId: user.id, gameId: game.id },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Ticket already purchased" },
      { status: 400 }
    );
  }
  const ticket = await prisma.ticket.create({
    data: {
      userId: user.id,
      gameId: game.id,
      amountUSDC: 50,
      code: randomBytes(4).toString("hex").toUpperCase(),
      txHash: null,
      status: "pending",
    },
  });
  return NextResponse.json({
    ticketId: ticket.id,
    waffleType: game.name,
    message: "Purchase successful",
  });
}
