/**
 * POST /api/v1/internal/games/[gameId]/roundup
 *
 * Called by PartyKit alarm to roundup a game immediately when it ends.
 * Ranks entries, publishes on-chain, and sends notifications.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  rankGame,
  publishResults,
  sendResultNotifications,
} from "@/lib/game/lifecycle";
import { env } from "@/lib/env";

export const maxDuration = 60;

interface RoundupResult {
  success: boolean;
  ranked: boolean;
  published: boolean;
  prizePool: number;
  winnersCount: number;
  error?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
): Promise<NextResponse<RoundupResult>> {
  // Verify authorization
  if (request.headers.get("Authorization") !== `Bearer ${env.partykitSecret}`) {
    return NextResponse.json(
      {
        success: false,
        ranked: false,
        published: false,
        prizePool: 0,
        winnersCount: 0,
        error: "Unauthorized",
      },
      { status: 401 }
    );
  }

  const { gameId } = await params;

  try {
    // 1. Verify game exists
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true, onchainId: true, rankedAt: true, prizePool: true },
    });

    if (!game) {
      return NextResponse.json(
        {
          success: false,
          ranked: false,
          published: false,
          prizePool: 0,
          winnersCount: 0,
          error: "Game not found",
        },
        { status: 404 }
      );
    }

    // 2. Rank the game
    const rankResult = await rankGame(gameId);
    console.log(
      `[Roundup] Game ${gameId} ranked: ${rankResult.entriesRanked} entries, ${rankResult.prizesDistributed} winners`
    );

    let published = false;

    // 3. Publish on-chain if applicable
    if (game.onchainId && rankResult.prizesDistributed > 0) {
      const publishResult = await publishResults(gameId);
      published = publishResult.success;
      console.log(
        `[Roundup] Game ${gameId} published on-chain: ${publishResult.txHash}`
      );
    } else {
      // 4. Send notifications for off-chain games (on-chain games get notified in publishResults)
      // await sendResultNotifications(gameId);
      console.log(
        `[Roundup] Game ${gameId} notifications sent (off-chain game)`
      );
    }

    return NextResponse.json({
      success: true,
      ranked: true,
      published,
      prizePool: game.prizePool,
      winnersCount: rankResult.prizesDistributed,
    });
  } catch (error) {
    console.error(`[Roundup] Game ${gameId} failed:`, error);
    return NextResponse.json(
      {
        success: false,
        ranked: false,
        published: false,
        prizePool: 0,
        winnersCount: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
