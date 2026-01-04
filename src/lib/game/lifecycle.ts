/**
 * Game Lifecycle Service
 *
 * Single source of truth for game lifecycle operations.
 * Clean state machine: LIVE → COMPLETED → RANKED → ON_CHAIN
 */

import { parseUnits } from "viem";
import { prisma } from "@/lib/db";
import { TOP_WINNERS_COUNT } from "@/lib/constants";
import { WAFFLE_GAME_CONFIG, TOKEN_CONFIG } from "@/lib/chain/config";
import {
  publicClient,
  getWalletClient,
  getPlatformFeeBps,
} from "@/lib/chain/client";
import {
  buildMerkleTree,
  generateAllProofs,
  type Winner,
} from "@/lib/chain/merkle";
import waffleGameAbi from "@/lib/chain/abi.json";
import { sendToUser, sendBatch } from "@/lib/notifications";
import { env } from "@/lib/env";

// ============================================================================
// Types
// ============================================================================

export type GameLifecycleState =
  | "SCHEDULED" // Game hasn't started yet
  | "LIVE" // Game is in progress
  | "COMPLETED" // Game ended, waiting for ranking
  | "RANKED" // Ranks/prizes calculated, waiting for on-chain publish
  | "ON_CHAIN"; // Results published, prizes claimable

export interface GameLifecycleStatus {
  state: GameLifecycleState;
  gameId: string;
  gameNumber: number;
  title: string;

  // Timestamps
  startsAt: Date;
  endsAt: Date;
  rankedAt: Date | null;
  onChainAt: Date | null;

  // Stats
  playerCount: number;
  prizePool: number;

  // On-chain data
  onchainId: string | null;
  merkleRoot: string | null;
  onChainTxHash: string | null;

  // Computed
  canRank: boolean;
  canPublish: boolean;
}

export interface RankResult {
  success: boolean;
  entriesRanked: number;
  prizesDistributed: number;
  prizePool: number;
  winners: Array<{
    rank: number;
    prize: number;
    userId: string;
    username: string;
  }>;
}

export interface PublishResult {
  success: boolean;
  merkleRoot: string;
  txHash: string;
  winnersCount: number;
}

// ============================================================================
// State Derivation
// ============================================================================

/**
 * Derive the current lifecycle state from game data
 */
export function deriveGameState(game: {
  startsAt: Date;
  endsAt: Date;
  rankedAt: Date | null;
  onChainAt: Date | null;
}): GameLifecycleState {
  const now = new Date();

  // Not started yet
  if (now < game.startsAt) {
    return "SCHEDULED";
  }

  // In progress
  if (now >= game.startsAt && now < game.endsAt) {
    return "LIVE";
  }

  // Ended but not ranked
  if (now >= game.endsAt && !game.rankedAt) {
    return "COMPLETED";
  }

  // Ranked but not on-chain
  if (game.rankedAt && !game.onChainAt) {
    return "RANKED";
  }

  // Published on-chain
  if (game.onChainAt) {
    return "ON_CHAIN";
  }

  return "COMPLETED"; // fallback
}

// ============================================================================
// Get Lifecycle Status
// ============================================================================

/**
 * Get complete lifecycle status for a game
 */
export async function getGameLifecycleStatus(
  gameId: string
): Promise<GameLifecycleStatus | null> {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: {
      id: true,
      gameNumber: true,
      title: true,
      startsAt: true,
      endsAt: true,
      rankedAt: true,
      onChainAt: true,
      playerCount: true,
      prizePool: true,
      onchainId: true,
      merkleRoot: true,
      onChainTxHash: true,
    },
  });

  if (!game) return null;

  const state = deriveGameState(game);

  return {
    state,
    gameId: game.id,
    gameNumber: game.gameNumber,
    title: game.title,
    startsAt: game.startsAt,
    endsAt: game.endsAt,
    rankedAt: game.rankedAt,
    onChainAt: game.onChainAt,
    playerCount: game.playerCount,
    prizePool: game.prizePool,
    onchainId: game.onchainId,
    merkleRoot: game.merkleRoot,
    onChainTxHash: game.onChainTxHash,
    canRank: state === "COMPLETED",
    canPublish: state === "RANKED" && !!game.onchainId,
  };
}

// ============================================================================
// Step 1: Rank Game
// ============================================================================

/**
 * Calculate rankings and distribute prizes
 * Idempotent - safe to call multiple times
 */
export async function rankGame(gameId: string): Promise<RankResult> {
  // Check current state
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: {
      id: true,
      endsAt: true,
      rankedAt: true,
      prizePool: true,
    },
  });

  if (!game) {
    throw new Error(`Game ${gameId} not found`);
  }

  // Already ranked - return existing data (idempotent)
  if (game.rankedAt) {
    const existingWinners = await prisma.gameEntry.findMany({
      where: { gameId, rank: { lte: 3 }, prize: { gt: 0 } },
      select: {
        rank: true,
        prize: true,
        userId: true,
        user: { select: { username: true } },
      },
      orderBy: { rank: "asc" },
    });

    return {
      success: true,
      entriesRanked: await prisma.gameEntry.count({
        where: { gameId, rank: { not: null } },
      }),
      prizesDistributed: existingWinners.length,
      prizePool: game.prizePool,
      winners: existingWinners.map((w) => ({
        rank: w.rank!,
        prize: w.prize ?? 0,
        userId: w.userId,
        username: w.user.username ?? "Unknown",
      })),
    };
  }

  // Verify game has ended
  if (new Date() < game.endsAt) {
    throw new Error(`Game ${gameId} has not ended yet`);
  }

  // Get all paid entries ordered by score
  const entries = await prisma.gameEntry.findMany({
    where: { gameId, paidAt: { not: null } },
    orderBy: [{ score: "desc" }, { updatedAt: "asc" }],
    select: {
      id: true,
      score: true,
      userId: true,
      paidAmount: true,
      user: { select: { username: true } },
    },
  });

  if (entries.length === 0) {
    // No entries - mark as ranked with empty results
    await prisma.game.update({
      where: { id: gameId },
      data: { rankedAt: new Date() },
    });

    return {
      success: true,
      entriesRanked: 0,
      prizesDistributed: 0,
      prizePool: game.prizePool,
      winners: [],
    };
  }

  // Calculate rankings and tier-based prizes
  // Top 5 share the prize pool proportionally to their paidAmount (tier)
  const prizePool = game.prizePool;

  // Read platform fee from smart contract and calculate net prize pool
  const platformFeeBps = await getPlatformFeeBps();
  const netPrizePool = prizePool * (1 - platformFeeBps / 10000);

  const winners: Array<{
    rank: number;
    prize: number;
    userId: string;
    username: string;
    entryId: string;
  }> = [];

  // Get top 5 entries
  const top5 = entries.slice(0, TOP_WINNERS_COUNT);

  // Calculate total weight (sum of paidAmounts for top 5)
  const totalWeight = top5.reduce((sum, e) => sum + (e.paidAmount ?? 0), 0);

  // Build update data for ALL entries
  const updateData = entries.map((entry, index) => {
    const rank = index + 1;

    // Only top 5 get prizes
    if (index < TOP_WINNERS_COUNT && totalWeight > 0) {
      const paidAmount = entry.paidAmount ?? 0;
      const prize = (paidAmount / totalWeight) * netPrizePool;

      if (prize > 0) {
        winners.push({
          rank,
          prize,
          userId: entry.userId,
          username: entry.user.username ?? "Unknown",
          entryId: entry.id,
        });
      }

      return { id: entry.id, rank, prize };
    }

    // Non-winners get rank but no prize
    return { id: entry.id, rank, prize: 0 };
  });

  // Batch update in transaction
  await prisma.$transaction(async (tx) => {
    for (const data of updateData) {
      await tx.gameEntry.update({
        where: { id: data.id },
        data: { rank: data.rank, prize: data.prize > 0 ? data.prize : null },
      });
    }

    await tx.game.update({
      where: { id: gameId },
      data: { rankedAt: new Date() },
    });
  });

  console.log(
    `[Lifecycle] Game ${gameId}: Ranked ${entries.length} entries, ${winners.length} winners`
  );

  return {
    success: true,
    entriesRanked: entries.length,
    prizesDistributed: winners.length,
    prizePool,
    winners: winners.map((w) => ({
      rank: w.rank,
      prize: w.prize,
      userId: w.userId,
      username: w.username,
    })),
  };
}

// ============================================================================
// Step 2: Publish Results On-Chain
// ============================================================================

/**
 * Submit merkle root to smart contract and notify players
 */
export async function publishResults(gameId: string): Promise<PublishResult> {
  // Get game with ranked entries
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: {
      id: true,
      onchainId: true,
      rankedAt: true,
      onChainAt: true,
      prizePool: true,
    },
  });

  if (!game) {
    throw new Error(`Game ${gameId} not found`);
  }

  // Verify prerequisites
  if (!game.rankedAt) {
    throw new Error(`Game ${gameId} must be ranked before publishing`);
  }

  if (!game.onchainId) {
    throw new Error(`Game ${gameId} has no on-chain ID`);
  }

  // Already published - return existing data (idempotent)
  if (game.onChainAt) {
    const existingGame = await prisma.game.findUnique({
      where: { id: gameId },
      select: { merkleRoot: true, onChainTxHash: true },
    });

    return {
      success: true,
      merkleRoot: existingGame!.merkleRoot!,
      txHash: existingGame!.onChainTxHash!,
      winnersCount: await prisma.gameEntry.count({
        where: { gameId, prize: { gt: 0 } },
      }),
    };
  }

  const onchainId = game.onchainId as `0x${string}`;

  // Get winners with wallets
  const rankedEntries = await prisma.gameEntry.findMany({
    where: {
      gameId,
      rank: { lte: TOP_WINNERS_COUNT },
      prize: { gt: 0 },
      paidAt: { not: null },
    },
    include: { user: { select: { wallet: true } } },
    orderBy: { rank: "asc" },
  });

  if (rankedEntries.length === 0) {
    throw new Error(`No winners to publish for game ${gameId}`);
  }

  // Build winners array for merkle tree
  const winners: Winner[] = rankedEntries
    .filter((e) => e.payerWallet || e.user.wallet)
    .map((entry) => ({
      gameId: onchainId,
      address: (entry.payerWallet || entry.user.wallet) as `0x${string}`,
      amount: parseUnits((entry.prize ?? 0).toFixed(6), TOKEN_CONFIG.decimals),
    }));

  if (winners.length === 0) {
    throw new Error(`No winners with wallets for game ${gameId}`);
  }

  // Build merkle tree
  const { root: merkleRoot } = buildMerkleTree(winners);
  const allProofs = generateAllProofs(winners);

  // Submit to chain
  const walletClient = getWalletClient();
  const txHash = await walletClient.writeContract({
    address: WAFFLE_GAME_CONFIG.address,
    abi: waffleGameAbi,
    functionName: "submitResults",
    args: [onchainId, merkleRoot],
  });

  // Wait for confirmation
  await publicClient.waitForTransactionReceipt({ hash: txHash });

  // Update database
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    // Update game
    await tx.game.update({
      where: { id: gameId },
      data: {
        merkleRoot,
        onChainTxHash: txHash,
        onChainAt: now,
      },
    });

    // Update entries with merkle proofs
    for (const entry of rankedEntries) {
      const winnerAddress = (
        entry.payerWallet || entry.user.wallet
      )?.toLowerCase();
      if (!winnerAddress) continue;

      const proofData = allProofs.get(winnerAddress);
      if (!proofData) continue;

      await tx.gameEntry.update({
        where: { id: entry.id },
        data: {
          merkleProof: proofData.proof,
          merkleAmount: proofData.amount.toString(),
        },
      });
    }
  });

  console.log(`[Lifecycle] Game ${gameId}: Published on-chain. TX: ${txHash}`);

  // Send notifications (async, don't block)
  sendResultNotifications(gameId).catch((err) =>
    console.error("[Lifecycle] Notification error:", err)
  );

  return {
    success: true,
    merkleRoot,
    txHash,
    winnersCount: winners.length,
  };
}

// ============================================================================
// Notifications
// ============================================================================

async function sendResultNotifications(gameId: string) {
  const allEntries = await prisma.gameEntry.findMany({
    where: {
      gameId,
      user: {
        hasGameAccess: true,
        isBanned: false,
      },
    },
    select: {
      rank: true,
      prize: true,
      user: { select: { fid: true, notifs: { take: 1 } } },
    },
  });

  const usersToNotify = allEntries.filter((e) => e.user.notifs.length > 0);
  const winners = usersToNotify.filter(
    (e) => e.rank && e.rank <= TOP_WINNERS_COUNT && e.prize
  );
  const nonWinners = usersToNotify.filter(
    (e) => !(e.rank && e.rank <= TOP_WINNERS_COUNT && e.prize)
  );

  console.log(
    `[Lifecycle] Notifying ${winners.length} winners and ${nonWinners.length} others`
  );

  // Winners: personalized messages
  await Promise.allSettled(
    winners.map((entry) =>
      sendToUser(entry.user.fid, {
        title: "🏆 You Won!",
        body: `You won $${entry.prize?.toFixed(2)}! Claim your prize now.`,
        targetUrl: `${env.rootUrl}/game/${gameId}/result`,
      })
    )
  );

  // Non-winners: batch message
  if (nonWinners.length > 0) {
    await sendBatch(
      {
        title: "📊 Results Ready!",
        body: "See how you ranked and check out the winners!",
        targetUrl: `${env.rootUrl}/game/${gameId}/result`,
      },
      { fids: nonWinners.map((e) => e.user.fid) }
    );
  }
}

// ============================================================================
// Preview (for admin UI)
// ============================================================================

/**
 * Get preview of what ranking would look like (without committing)
 */
export async function previewRanking(gameId: string) {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { prizePool: true },
  });

  if (!game) return null;

  const entries = await prisma.gameEntry.findMany({
    where: { gameId, paidAt: { not: null } },
    orderBy: [{ score: "desc" }, { updatedAt: "asc" }],
    select: {
      score: true,
      paidAmount: true,
      user: { select: { username: true } },
    },
    take: 10,
  });

  // Calculate total weight for top winners
  const topEntries = entries.slice(0, TOP_WINNERS_COUNT);
  const totalWeight = topEntries.reduce(
    (sum, e) => sum + (e.paidAmount ?? 0),
    0
  );

  // Read platform fee from smart contract and calculate net prize pool
  const platformFeeBps = await getPlatformFeeBps();
  const netPrizePool = game.prizePool * (1 - platformFeeBps / 10000);

  return entries.map((entry, index) => {
    const rank = index + 1;

    // Only top 5 get prizes based on tier
    let prize = 0;
    if (index < TOP_WINNERS_COUNT && totalWeight > 0) {
      prize = ((entry.paidAmount ?? 0) / totalWeight) * netPrizePool;
    }

    return {
      rank,
      username: entry.user.username ?? "Unknown",
      score: entry.score,
      prize,
    };
  });
}
