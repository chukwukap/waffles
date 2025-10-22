import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/tickets/verify
export async function GET(request: Request) {
  const farcasterId = request.headers.get("x-farcaster-id");
  if (!farcasterId) {
    return NextResponse.json(
      { valid: false, message: "Unauthorized" },
      { status: 401 }
    );
  }
  const user = await prisma.user.findUnique({ where: { farcasterId } });
  if (!user) {
    return NextResponse.json(
      { valid: false, message: "User not found" },
      { status: 404 }
    );
  }
  const url = new URL(request.url);
  const gameIdParam = url.searchParams.get("gameId");
  if (!gameIdParam) {
    return NextResponse.json(
      { valid: false, message: "Missing gameId" },
      { status: 400 }
    );
  }
  const gameId = parseInt(gameIdParam, 10);
  if (isNaN(gameId)) {
    return NextResponse.json(
      { valid: false, message: "Invalid gameId" },
      { status: 400 }
    );
  }
  const ticket = await prisma.ticket.findFirst({
    where: { userId: user.id, gameId },
  });
  if (!ticket) {
    return NextResponse.json({ valid: false, message: "Ticket not found" });
  }
  return NextResponse.json({ valid: true });
}
