import { prisma } from "@/lib/db";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

const paramsSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "Game ID must be a numeric string.")
    .transform(Number),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  try {
    const paramsValidation = paramsSchema.safeParse({ id: Number(id) });
    if (!paramsValidation.success) {
      const firstError = paramsValidation.error.message || "Invalid Game ID";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }
    const { id: gameId } = paramsValidation.data;

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        questions: {
          orderBy: { id: "asc" },
          select: {
            id: true,
            text: true,
            imageUrl: true,
            options: true,
          },
        },
        config: {
          select: {
            ticketPrice: true,
            roundTimeLimit: true,
            questionsPerGame: true,
            maxPlayers: true,
            soundEnabled: true,
          },
        },
      },
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const responseData = {
      id: game.id,
      name: game.name,
      description: game.description,
      startTime: game.startTime,
      endTime: game.endTime,
      questions: game.questions.map((q) => ({
        id: q.id,
        text: q.text,
        imageUrl: q.imageUrl,
        options: q.options,
      })),
      config: game.config
        ? {
            ticketPrice: game.config.ticketPrice,
            roundTimeLimit: game.config.roundTimeLimit,
            questionsPerGame: game.config.questionsPerGame,
            maxPlayers: game.config.maxPlayers,
            soundEnabled: game.config.soundEnabled,
          }
        : null,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error(`GET /api/game/${id} Error:`, error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Ensure dynamic execution for potentially updated game details
export const dynamic = "force-dynamic";
