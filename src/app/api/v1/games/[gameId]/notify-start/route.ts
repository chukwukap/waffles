import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendBatch } from "@/lib/notifications";
import { env } from "@/lib/env";

type Params = { gameId: string };

/**
 * POST /api/v1/games/:gameId/notify-start
 * Send game start notifications to all ticket holders.
 * Called by PartyKit alarm when game starts.
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

    // Verify secret (called from PartyKit)
    const authHeader = request.headers.get("Authorization");
    if (authHeader !== `Bearer ${env.partykitSecret}`) {
      console.error("[notify-start] Invalid Authorization header");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get game info
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true, title: true },
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Get all FIDs for this game's entries
    const entries = await prisma.gameEntry.findMany({
      where: { gameId },
      select: { user: { select: { fid: true } } },
    });

    const fids = entries.map((e) => e.user.fid);

    console.log(
      `[notify-start] Game ${gameId}: Sending batch to ${fids.length} players`
    );

    // Send batch notification (100 tokens per request)
    const results = await sendBatch(
      {
        title: "🎮 Game Starting!",
        body: `${game.title || "Your game"} is live now!`,
        targetUrl: `${env.rootUrl}/game/${gameId}/play`,
      },
      { fids }
    );

    console.log(
      `[notify-start] Game ${gameId}: ${results.success} sent, ${results.failed} failed`
    );

    return NextResponse.json({
      success: true,
      notified: results.success,
      failed: results.failed + results.invalidTokens + results.rateLimited,
      total: results.total,
    });
  } catch (error) {
    console.error("[notify-start] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
