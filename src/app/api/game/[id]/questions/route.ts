import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";

// GET /api/games/[id]/questions
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const gameId = parseInt(params.id, 10);
  if (isNaN(gameId)) {
    return NextResponse.json({ error: "Invalid game ID" }, { status: 400 });
  }
  const questions = await prisma.question.findMany({
    where: { gameId },
    select: {
      id: true,
      text: true,
      imageUrl: true,
      options: true,
    },
  });
  return NextResponse.json(questions);
}

// POST /api/games/[id]/questions
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const gameId = parseInt(params.id, 10);
  if (isNaN(gameId)) {
    return NextResponse.json({ error: "Invalid game ID" }, { status: 400 });
  }
  // imageUrl is now required
  const schema = z.object({
    text: z.string().min(1),
    imageUrl: z.string().min(1), // made required
    options: z.array(z.string().min(1)).min(2),
    correctIndex: z.number().min(0),
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
  const { text, imageUrl, options, correctIndex } = parseResult.data;
  if (correctIndex >= options.length) {
    return NextResponse.json(
      { error: "correctIndex out of range" },
      { status: 400 }
    );
  }
  // Check game exists
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }
  const question = await prisma.question.create({
    data: {
      gameId,
      text,
      imageUrl: imageUrl,
      options: options,
      correctAnswer: options[correctIndex],
    },
  });
  return NextResponse.json(question);
}
