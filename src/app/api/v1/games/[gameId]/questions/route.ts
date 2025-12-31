import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

type Params = { gameId: string };

/**
 * GET /api/v1/games/:gameId/questions
 * Fetch questions for a game. Called by PartyKit when game starts.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  try {
    const { gameId: gameIdStr } = await context.params;
    const gameId = parseInt(gameIdStr, 10);

    if (isNaN(gameId)) {
      return NextResponse.json({ error: "Invalid game ID" }, { status: 400 });
    }

    // Verify Authorization header (called from PartyKit)
    const authHeader = request.headers.get("Authorization");
    if (authHeader !== `Bearer ${env.partykitSecret}`) {
      console.error("[questions] Invalid Authorization header");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get game with questions
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        questions: {
          orderBy: [{ roundIndex: "asc" }, { orderInRound: "asc" }],
        },
      },
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Transform to the format PartyKit expects
    const questions = game.questions.map((q) => ({
      id: q.id,
      text: q.content,
      options: q.options,
      correct: q.correctIndex,
      timeLimit: q.durationSec || game.roundBreakSec || 15,
    }));

    return NextResponse.json({
      success: true,
      questions,
      count: questions.length,
    });
  } catch (error) {
    console.error("[questions] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
