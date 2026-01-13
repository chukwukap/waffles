/**
 * Cron: Roundup Games
 * POST /api/cron/roundup-games
 *
 * Fallback for games that weren't rounded up by PartyKit alarm.
 * Auto-ranks and publishes ended games. Called every 5 min.
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

export async function POST(request: NextRequest) {
  if (request.headers.get("Authorization") !== `Bearer ${env.partykitSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const games = await prisma.game.findMany({
    where: { endsAt: { lt: new Date() }, rankedAt: null },
    select: { id: true, onchainId: true },
  });

  if (!games.length) {
    return NextResponse.json({ ranked: 0, published: 0 });
  }

  let ranked = 0,
    published = 0;

  for (const game of games) {
    try {
      const result = await rankGame(game.id);
      ranked++;

      if (game.onchainId && result.prizesDistributed > 0) {
        // On-chain: publishResults handles notifications
        await publishResults(game.id);
        published++;
      } else {
        // Off-chain: send notifications directly
        // await sendResultNotifications(game.id);
      }

      console.log(`[Cron] Game ${game.id} rounded up (fallback)`);
    } catch (e) {
      console.error(`[Cron] Game ${game.id}:`, e);
    }
  }

  console.log(`[Cron] Done: ${ranked} ranked, ${published} published`);
  return NextResponse.json({ ranked, published });
}
