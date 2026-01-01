import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

type Params = { gameId: string };

/**
 * POST /api/v1/internal/games/:gameId/finalize
 * Called by PartyKit when game ends.
 * Calculates rankings from DB entries (scores already updated via /answers API).
 *
 * Future: Will also trigger on-chain settlement.
 */
export async function POST(
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
      console.error("[finalize] Invalid Authorization header");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`[finalize] Game ${gameId}: Calculating ranks from DB entries`);

    // Verify game exists
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true, endsAt: true },
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Get all paid entries ordered by score descending
    const entries = await prisma.gameEntry.findMany({
      where: {
        gameId,
        paidAt: { not: null },
      },
      orderBy: { score: "desc" },
      select: { id: true, score: true },
    });

    // Update entries with ranks
    let updatedCount = 0;
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const rank = i + 1;

      await prisma.gameEntry.update({
        where: { id: entry.id },
        data: { rank },
      });

      updatedCount++;
    }

    console.log(`[finalize] Game ${gameId}: Ranked ${updatedCount} entries`);

    // Future: Auto-settlement
    // if (env.autoSettle) {
    //   await settleGame(gameId);
    // }

    return NextResponse.json({
      success: true,
      gameId,
      entriesRanked: updatedCount,
    });
  } catch (error) {
    console.error("[finalize] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
