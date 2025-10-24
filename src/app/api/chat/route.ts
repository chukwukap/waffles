import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

// GET /api/chat?gameId=
export async function GET(request: Request) {
  const url = new URL(request.url);
  const gameIdParam = url.searchParams.get("gameId");
  if (!gameIdParam) {
    return NextResponse.json({ error: "Missing gameId" }, { status: 400 });
  }
  const gameId = parseInt(gameIdParam, 10);
  if (isNaN(gameId)) {
    return NextResponse.json({ error: "Invalid gameId" }, { status: 400 });
  }
  const messages = await prisma.chat.findMany({
    where: { gameId },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });
  // Return shape compatible with Chat components (messages with nested user)
  return NextResponse.json(
    messages.map((msg) => ({
      id: msg.id,
      gameId: msg.gameId,
      userId: msg.userId,
      user: {
        name: msg.user?.name ?? "anon",
        imageUrl: msg.user?.imageUrl ?? null,
      },
      message: msg.message,
      createdAt: msg.createdAt,
    }))
  );
}

// POST /api/chat
export async function POST(request: Request) {
  const schema = z.object({
    gameId: z.number(),
    message: z.string().min(1),
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
  const { gameId, message } = parseResult.data;
  // Allow either header or body to provide farcasterId
  let farcasterId = request.headers.get("x-farcaster-id");
  if (!farcasterId) {
    try {
      const bodyJson = await request.clone().json();
      if (bodyJson?.farcasterId) farcasterId = String(bodyJson.farcasterId);
    } catch {}
  }
  if (!farcasterId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { farcasterId: String(farcasterId) },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }
  const chat = await prisma.chat.create({
    data: {
      userId: user.id,
      gameId,
      message,
    },
  });
  return NextResponse.json(chat);
}
