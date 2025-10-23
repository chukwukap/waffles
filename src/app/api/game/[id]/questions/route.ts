import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

// GET /api/game/[id]/questions
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await context.params;
    const gameId = Number(resolvedParams.id);
    if (!Number.isInteger(gameId)) {
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
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST /api/game/[id]/questions
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await context.params;
    const gameId = Number(resolvedParams.id);
    if (!Number.isInteger(gameId)) {
      return NextResponse.json({ error: "Invalid game ID" }, { status: 400 });
    }

    const schema = z.object({
      text: z.string().min(1),
      imageUrl: z.string().min(1),
      options: z.array(z.string().min(1)).min(2),
      correctIndex: z.number().min(0),
    });

    let body: unknown;
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
        imageUrl,
        options,
        correctAnswer: options[correctIndex],
      },
    });

    return NextResponse.json(question);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
