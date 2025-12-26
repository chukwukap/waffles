import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendNotificationToUser } from "@/lib/notifications";
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
    const secret = request.headers.get("X-PartyKit-Secret");
    if (secret !== env.partykitSecret) {
      console.error("[notify-start] Invalid secret");
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

    // Get all entries with users who have notification tokens
    const entries = await prisma.gameEntry.findMany({
      where: { gameId },
      include: {
        user: {
          select: {
            fid: true,
            notifs: {
              take: 1, // Just check if they have any token
            },
          },
        },
      },
    });

    // Filter users with notification tokens
    const usersToNotify = entries.filter((e) => e.user.notifs.length > 0);
    console.log(
      `[notify-start] Game ${gameId}: Notifying ${usersToNotify.length} of ${entries.length} players`
    );

    // Send notifications (in parallel with limited concurrency)
    const results = await Promise.allSettled(
      usersToNotify.map((entry) =>
        sendNotificationToUser({
          fid: entry.user.fid,
          title: "🎮 Game Starting!",
          body: `${game.title || "Your game"} is live now!`,
          targetUrl: `${env.rootUrl}/game/${gameId}/play`,
        })
      )
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log(
      `[notify-start] Game ${gameId}: ${successful} sent, ${failed} failed`
    );

    return NextResponse.json({
      success: true,
      notified: successful,
      failed,
      total: usersToNotify.length,
    });
  } catch (error) {
    console.error("[notify-start] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
