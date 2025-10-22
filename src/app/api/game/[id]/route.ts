import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/games/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const gameId = parseInt(params.id, 10);
  if (isNaN(gameId)) {
    return NextResponse.json({ error: "Invalid game ID" }, { status: 400 });
  }
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: { questions: true },
  });
  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }
  // Exclude correct answers in questions
  const questions = game.questions.map((q) => ({
    id: q.id,
    questionText: q.text,
    imageUrl: q.imageUrl,
    options: q.options,
  }));
  const { id, title, description, startTime, endTime } = game;
  return NextResponse.json({
    id,
    title,
    description,
    startTime,
    endTime,
    questions,
  });
}
