import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const resolved = await context.params;
    const gameId = Number(resolved.id);
    if (!Number.isInteger(gameId)) {
      return NextResponse.json({ error: "Invalid game id" }, { status: 400 });
    }

    const game = await prisma.game.findUnique({ where: { id: gameId } });
    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const questions = await prisma.question.findMany({
      where: { gameId },
      orderBy: { id: "asc" },
      select: {
        id: true,
        text: true,
        imageUrl: true,
        options: true,
        correctAnswer: true,
      },
    });

    return NextResponse.json({ gameId, questions });
  } catch (e) {
    console.error("questions GET error", e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
