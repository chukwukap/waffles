/**
 * Cron: Roundup Games
 *
 * POST /api/cron/roundup-games
 *
 * Automatically ranks and publishes all ended games.
 * Called every 5 minutes by external cron service.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rankGame, publishResults } from "@/lib/game/lifecycle";
import { env } from "@/lib/env";

export const maxDuration = 60; // Allow up to 60s for processing multiple games

export async function POST(request: NextRequest) {
  // Verify authorization
  const authHeader = request.headers.get("Authorization");
  if (authHeader !== `Bearer ${env.partykitSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find all games that ended but haven't been ranked
    const unrankedGames = await prisma.game.findMany({
      where: {
        endsAt: { lt: new Date() },
        rankedAt: null,
      },
      select: { id: true, title: true, onchainId: true },
      orderBy: { endsAt: "asc" }, // Process oldest first
    });

    if (unrankedGames.length === 0) {
      return NextResponse.json({
        message: "No games to process",
        ranked: 0,
        published: 0,
      });
    }

    console.log(`[Cron] Found ${unrankedGames.length} games to roundup`);

    const results = {
      ranked: 0,
      published: 0,
      errors: [] as string[],
    };

    // Process each game
    for (const game of unrankedGames) {
      try {
        // Step 1: Rank
        console.log(`[Cron] Ranking game ${game.id} (${game.title})`);
        const rankResult = await rankGame(game.id);
        results.ranked++;

        console.log(
          `[Cron] Ranked ${rankResult.entriesRanked} entries, ${rankResult.prizesDistributed} winners`
        );

        // Step 2: Publish on-chain (only if has onchainId and winners)
        if (game.onchainId && rankResult.prizesDistributed > 0) {
          console.log(`[Cron] Publishing game ${game.id} on-chain`);
          const publishResult = await publishResults(game.id);
          results.published++;

          console.log(
            `[Cron] Published ${publishResult.winnersCount} winners, TX: ${publishResult.txHash}`
          );
        } else if (!game.onchainId) {
          console.log(`[Cron] Skipping publish for ${game.id} - no onchainId`);
        } else {
          console.log(`[Cron] Skipping publish for ${game.id} - no winners`);
        }
      } catch (error) {
        const errorMsg = `Game ${game.id}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;
        console.error(`[Cron] Error:`, errorMsg);
        results.errors.push(errorMsg);
      }
    }

    console.log(
      `[Cron] Complete: ranked=${results.ranked}, published=${results.published}, errors=${results.errors.length}`
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error("[Cron] Fatal error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Roundup failed" },
      { status: 500 }
    );
  }
}
