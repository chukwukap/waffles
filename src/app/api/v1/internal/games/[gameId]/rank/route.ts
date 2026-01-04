/**
 * Internal Game Rank Route
 *
 * POST /api/v1/internal/games/:gameId/rank
 * Called by PartyKit when game ends to calculate rankings.
 *
 * This is idempotent - safe to call multiple times.
 */

import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { rankGame } from "@/lib/game/lifecycle";

type Params = { gameId: string };

export async function POST(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  try {
    const { gameId } = await context.params;

    if (!gameId) {
      return NextResponse.json({ error: "Invalid game ID" }, { status: 400 });
    }

    // Verify Authorization header (called from PartyKit)
    const authHeader = request.headers.get("Authorization");
    if (authHeader !== `Bearer ${env.partykitSecret}`) {
      console.error("[rank] Invalid Authorization header");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`[rank] Game ${gameId}: Starting ranking...`);

    const result = await rankGame(gameId);

    console.log(
      `[rank] Game ${gameId}: Ranked ${result.entriesRanked} entries, ${result.prizesDistributed} winners`
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("[rank] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ranking failed" },
      { status: 500 }
    );
  }
}
