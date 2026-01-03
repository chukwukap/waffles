import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { PRIZE_DISTRIBUTION } from "@/lib/constants";

type Params = { gameId: string };

interface FinalizeResult {
  success: boolean;
  gameId: string;
  alreadyFinalized?: boolean;
  entriesRanked: number;
  prizesDistributed: number;
  prizePool: number;
  winners: Array<{ rank: number; prize: number; userId: string }>;
}

/**
 * POST /api/v1/internal/games/:gameId/finalize
 * Called by PartyKit when game ends.
 *
 * This route is IDEMPOTENT - calling it multiple times is safe.
 *
 * Steps:
 * 1. Check if already finalized (settledAt exists)
 * 2. Calculate rankings from scores
 * 3. Distribute prizes to top 3
 * 4. Update all entries with ranks/prizes in a transaction
 * 5. Set settledAt timestamp
 * 6. Send winner notifications
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
      console.error("[finalize] Invalid Authorization header");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`[finalize] Game ${gameId}: Starting finalization...`);

    // ==========================================
    // STEP 1: Idempotency Check
    // ==========================================
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      select: {
        id: true,
        endsAt: true,
        settledAt: true,
        prizePool: true,
      },
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Already finalized - return early (idempotent)
    if (game.settledAt) {
      console.log(
        `[finalize] Game ${gameId}: Already finalized at ${game.settledAt}`
      );

      // Return existing state
      const existingEntries = await prisma.gameEntry.findMany({
        where: { gameId, paidAt: { not: null } },
        select: { rank: true, prize: true, userId: true },
        orderBy: { rank: "asc" },
        take: 10,
      });

      const result: FinalizeResult = {
        success: true,
        gameId,
        alreadyFinalized: true,
        entriesRanked: existingEntries.length,
        prizesDistributed: existingEntries.filter((e) => (e.prize ?? 0) > 0)
          .length,
        prizePool: game.prizePool,
        winners: existingEntries
          .filter((e) => e.rank && e.rank <= 3)
          .map((e) => ({
            rank: e.rank!,
            prize: e.prize ?? 0,
            userId: e.userId,
          })),
      };

      return NextResponse.json(result);
    }

    // ==========================================
    // STEP 2: Get All Paid Entries (Ordered by Score)
    // ==========================================
    const entries = await prisma.gameEntry.findMany({
      where: {
        gameId,
        paidAt: { not: null },
      },
      orderBy: [
        { score: "desc" },
        { updatedAt: "asc" }, // Tie-breaker: who finished first
      ],
      select: { id: true, score: true, userId: true },
    });

    if (entries.length === 0) {
      console.log(`[finalize] Game ${gameId}: No entries to finalize`);

      // Mark as settled anyway
      await prisma.game.update({
        where: { id: gameId },
        data: { settledAt: new Date() },
      });

      return NextResponse.json<FinalizeResult>({
        success: true,
        gameId,
        entriesRanked: 0,
        prizesDistributed: 0,
        prizePool: game.prizePool,
        winners: [],
      });
    }

    // ==========================================
    // STEP 3: Calculate Ranks and Prizes
    // ==========================================
    const prizePool = game.prizePool;
    const winners: Array<{
      rank: number;
      prize: number;
      userId: string;
      entryId: string;
    }> = [];

    // Build update data for all entries
    const updateData = entries.map((entry, index) => {
      const rank = index + 1;

      // Calculate prize for top 3 (PRIZE_DISTRIBUTION is [0.6, 0.3, 0.1])
      const prizePercent =
        index < PRIZE_DISTRIBUTION.length ? PRIZE_DISTRIBUTION[index] : 0;
      const prize = prizePool * prizePercent;

      if (prize > 0) {
        winners.push({ rank, prize, userId: entry.userId, entryId: entry.id });
      }

      return { id: entry.id, rank, prize };
    });

    console.log(
      `[finalize] Game ${gameId}: Distributing prizes from pool $${prizePool}:`,
      winners.map((w) => `Rank ${w.rank}: $${w.prize.toFixed(2)}`).join(", ")
    );

    // ==========================================
    // STEP 4: Batch Update All Entries + Set settledAt
    // ==========================================
    await prisma.$transaction(async (tx) => {
      // Update each entry with rank and prize
      // Using individual updates in transaction for type safety
      // (Prisma doesn't support batch update with different values per row easily)
      for (const data of updateData) {
        await tx.gameEntry.update({
          where: { id: data.id },
          data: { rank: data.rank, prize: data.prize > 0 ? data.prize : null },
        });
      }

      // Mark game as settled
      await tx.game.update({
        where: { id: gameId },
        data: { settledAt: new Date() },
      });
    });

    console.log(
      `[finalize] Game ${gameId}: Ranked ${entries.length} entries, distributed ${winners.length} prizes`
    );

    // NOTE: Notifications are sent when admin submits results on-chain (settlement.ts)
    // This keeps finalize focused on DB operations only

    // ==========================================
    // STEP 6: Return Success
    // ==========================================
    const result: FinalizeResult = {
      success: true,
      gameId,
      entriesRanked: entries.length,
      prizesDistributed: winners.length,
      prizePool,
      winners: winners.map((w) => ({
        rank: w.rank,
        prize: w.prize,
        userId: w.userId,
      })),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("[finalize] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
