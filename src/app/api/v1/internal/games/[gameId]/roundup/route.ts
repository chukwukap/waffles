/**
 * POST /api/v1/internal/games/[gameId]/roundup
 *
 * Called by PartyKit alarm to roundup a game immediately when it ends.
 * Ranks entries, publishes on-chain, and sends notifications.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rankGame, publishResults } from "@/lib/game/lifecycle";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

const SERVICE = "roundup-api";

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
  const { gameId } = await params;

  logger.info(SERVICE, "roundup_request_received", {
    gameId,
    source: "partykit",
  });

  // Verify authorization
  if (request.headers.get("Authorization") !== `Bearer ${env.partykitSecret}`) {
    logger.warn(SERVICE, "roundup_unauthorized", {
      gameId,
      message: "Invalid or missing authorization header",
    });
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

  try {
    // 1. Verify game exists
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: { id: true, onchainId: true, rankedAt: true, prizePool: true },
    });

    if (!game) {
      logger.error(SERVICE, "roundup_game_not_found", { gameId });
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

    logger.info(SERVICE, "roundup_game_found", {
      gameId,
      onchainId: game.onchainId,
      prizePool: game.prizePool,
      alreadyRanked: !!game.rankedAt,
    });

    // 2. Rank the game
    const rankResult = await rankGame(gameId);
    logger.info(SERVICE, "roundup_ranked", {
      gameId,
      entriesRanked: rankResult.entriesRanked,
      prizesDistributed: rankResult.prizesDistributed,
    });

    let published = false;

    // 3. Publish on-chain if applicable
    if (game.onchainId && rankResult.prizesDistributed > 0) {
      logger.info(SERVICE, "roundup_publishing_onchain", {
        gameId,
        onchainId: game.onchainId,
      });

      const publishResult = await publishResults(gameId);
      published = publishResult.success;

      logger.info(SERVICE, "roundup_published", {
        gameId,
        success: publishResult.success,
        txHash: publishResult.txHash,
      });
    } else {
      logger.info(SERVICE, "roundup_skip_onchain", {
        gameId,
        reason: !game.onchainId ? "no_onchain_id" : "no_prizes_to_distribute",
      });
    }

    logger.info(SERVICE, "roundup_complete", {
      gameId,
      ranked: true,
      published,
      prizePool: game.prizePool,
      winnersCount: rankResult.prizesDistributed,
    });

    return NextResponse.json({
      success: true,
      ranked: true,
      published,
      prizePool: game.prizePool,
      winnersCount: rankResult.prizesDistributed,
    });
  } catch (error) {
    logger.error(SERVICE, "roundup_failed", {
      gameId,
      error: logger.errorMessage(error),
    });
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
