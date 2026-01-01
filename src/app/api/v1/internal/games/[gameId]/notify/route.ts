import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendNotificationToUser } from "@/lib/notifications";
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
    const { gameId: gameIdStr } = await context.params;
    const gameId = parseInt(gameIdStr, 10);

    if (isNaN(gameId)) {
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

    // Get all entries with users who have notification tokens
    const entries = await prisma.gameEntry.findMany({
      where: { gameId },
      include: {
        user: {
          select: {
            fid: true,
            notifs: { take: 1 },
          },
        },
      },
    });

    // Filter users with notification tokens
    const usersToNotify = entries.filter((e) => e.user.notifs.length > 0);
    console.log(
      `[notify] Game ${gameId}: Notifying ${usersToNotify.length} of ${entries.length} players`
    );

    // Send notifications (in parallel with limited concurrency)
    const results = await Promise.allSettled(
      usersToNotify.map((entry) =>
        sendNotificationToUser({
          fid: entry.user.fid,
          title: game.title || "Waffle Game",
          body: message,
          targetUrl: `${env.rootUrl}/game/${gameId}`,
        })
      )
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log(
      `[notify] Game ${gameId}: ${successful} sent, ${failed} failed`
    );

    return NextResponse.json({
      success: true,
      notified: successful,
      failed,
      total: usersToNotify.length,
    });
  } catch (error) {
    console.error("[notify] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
