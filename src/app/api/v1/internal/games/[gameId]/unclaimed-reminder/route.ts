import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendBatch } from "@/lib/notifications";
import { postGame, buildPayload } from "@/lib/notifications/templates";
import { env } from "@/lib/env";

const SERVICE = "unclaimed-reminder";

type Params = { gameId: string };

/**
 * POST /api/v1/internal/games/:gameId/unclaimed-reminder
 * Send reminders to winners who haven't claimed their prizes.
 * Called by PartyKit alarm 24h after game ends.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<Params> },
) {
  const { gameId } = await context.params;

  console.log("[" + SERVICE + "]", "reminder_request", { gameId });

  try {
    // Verify Authorization header
    const authHeader = request.headers.get("Authorization");
    if (authHeader !== `Bearer ${env.partykitSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get game info
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true, gameNumber: true },
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Find winners (rank 1-3) who haven't claimed
    const unclaimedWinners = await prisma.gameEntry.findMany({
      where: {
        gameId,
        rank: { in: [1, 2, 3] },
        prize: { gt: 0 },
        claimedAt: null,
      },
      include: {
        user: { select: { fid: true } },
      },
    });

    if (unclaimedWinners.length === 0) {
      console.log("[" + SERVICE + "]", "no_unclaimed_winners", { gameId });
      return NextResponse.json({ success: true, notified: 0 });
    }

    const fids = unclaimedWinners.map((e) => e.user.fid);

    // Build notification
    const template = postGame.unclaimed(
      game.gameNumber,
      `$${unclaimedWinners[0].prize?.toFixed(2) || "0"}`,
    );
    const payload = buildPayload(template, gameId);

    console.log("[" + SERVICE + "]", "sending_reminders", {
      gameId,
      winnerCount: fids.length,
    });

    // Send notifications
    const results = await sendBatch(payload, { fids });

    console.log("[" + SERVICE + "]", "reminders_sent", {
      gameId,
      success: results.success,
      failed: results.failed,
    });

    return NextResponse.json({
      success: true,
      notified: results.success,
      total: fids.length,
    });
  } catch (error) {
    console.error("[" + SERVICE + "]", "reminder_error", {
      gameId,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
