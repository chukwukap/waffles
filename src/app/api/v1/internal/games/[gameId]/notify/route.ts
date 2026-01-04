import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendBatch } from "@/lib/notifications";
import { env } from "@/lib/env";

type Params = { gameId: string };

/**
 * POST /api/v1/internal/games/:gameId/notify
 * Send notifications to all ticket holders for a game.
 * Called by PartyKit for game events (starting soon, started, ended).
 */
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
      console.error("[notify] Invalid Authorization header");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const message = body.message || "Game update";

    // Get game info
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true, title: true },
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Get all FIDs for this game's entries (only users with game access)
    const entries = await prisma.gameEntry.findMany({
      where: {
        gameId,
        user: {
          hasGameAccess: true,
          isBanned: false,
        },
      },
      select: { user: { select: { fid: true } } },
    });

    const fids = entries.map((e) => e.user.fid);

    console.log(
      `[notify] Game ${gameId}: Sending batch to ${fids.length} players`
    );

    // Send batch notification (100 tokens per request)
    const results = await sendBatch(
      {
        title: game.title || "Waffle Game",
        body: message,
        targetUrl: `${env.rootUrl}/game`,
      },
      { fids }
    );

    console.log(
      `[notify] Game ${gameId}: ${results.success} sent, ${results.failed} failed`
    );

    return NextResponse.json({
      success: true,
      notified: results.success,
      failed: results.failed + results.invalidTokens + results.rateLimited,
      total: results.total,
    });
  } catch (error) {
    console.error("[notify] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
