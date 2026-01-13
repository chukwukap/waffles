import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendBatch } from "@/lib/notifications";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

const SERVICE = "notify-api";

type Params = { gameId: string };

/**
 * POST /api/v1/internal/games/:gameId/notify
 * Send notifications to all users with game access.
 * Called by PartyKit for game events (starting soon, started, ended).
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  const { gameId } = await context.params;

  logger.info(SERVICE, "notify_request_received", {
    gameId,
    source: "partykit",
  });

  try {
    if (!gameId) {
      logger.warn(SERVICE, "notify_invalid_game_id", { gameId });
      return NextResponse.json({ error: "Invalid game ID" }, { status: 400 });
    }

    // Verify Authorization header (called from PartyKit)
    const authHeader = request.headers.get("Authorization");
    if (authHeader !== `Bearer ${env.partykitSecret}`) {
      logger.warn(SERVICE, "notify_unauthorized", {
        gameId,
        message: "Invalid authorization header",
      });
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
      logger.error(SERVICE, "notify_game_not_found", { gameId });
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Get all FIDs for users with game access (not just entries)
    // Notify everyone who CAN play, not just those who already joined
    const users = await prisma.user.findMany({
      where: {
        hasGameAccess: true,
        isBanned: false,
      },
      select: { fid: true },
    });

    const fids = users.map((u) => u.fid);

    logger.info(SERVICE, "notify_sending_batch", {
      gameId,
      gameTitle: game.title,
      message,
      recipientCount: fids.length,
    });

    // Send batch notification (100 tokens per request)
    const results = await sendBatch(
      {
        title: game.title || "Waffle Game",
        body: message,
        targetUrl: `${env.rootUrl}/game`,
      },
      { fids }
    );

    logger.info(SERVICE, "notify_batch_complete", {
      gameId,
      message,
      success: results.success,
      failed: results.failed,
      invalidTokens: results.invalidTokens,
      rateLimited: results.rateLimited,
      total: results.total,
    });

    return NextResponse.json({
      success: true,
      notified: results.success,
      failed: results.failed + results.invalidTokens + results.rateLimited,
      total: results.total,
    });
  } catch (error) {
    logger.error(SERVICE, "notify_error", {
      gameId,
      error: logger.errorMessage(error),
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
