/**
 * Settlement Operations
 * Functions for settling games and managing Merkle roots
 */

import { parseUnits } from "viem";
import { WAFFLE_GAME_CONFIG, TOKEN_CONFIG } from "./config";
import { publicClient, getWalletClient } from "./client";
import { buildMerkleTree, generateAllProofs, type Winner } from "./merkle";
import waffleGameAbi from "./abi.json";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { sendToUser, sendBatch } from "@/lib/notifications";
import { getGamePhase } from "@/lib/types";

// ============================================================================
// On-Chain Settlement Operations
// ============================================================================

/**
 * Submit Merkle root to finalize a game
 * @param onchainId - The bytes32 on-chain game ID
 * @param merkleRoot - The Merkle root of winners
 * @returns Transaction hash
 */
export async function submitResultsOnChain(
  onchainId: `0x${string}`,
  merkleRoot: `0x${string}`
): Promise<`0x${string}`> {
  const walletClient = getWalletClient();

  const hash = await walletClient.writeContract({
    address: WAFFLE_GAME_CONFIG.address,
    abi: waffleGameAbi,
    functionName: "submitResults",
    args: [onchainId, merkleRoot],
  });

  console.log(`[Settlement] Submitted results for ${onchainId}. TX: ${hash}`);
  return hash;
}

/**
 * Update an existing Merkle root (only if no claims have been made)
 * @param onchainId - The bytes32 on-chain game ID
 * @param newMerkleRoot - The new/corrected Merkle root
 * @returns Transaction hash
 */
export async function updateMerkleRootOnChain(
  onchainId: `0x${string}`,
  newMerkleRoot: `0x${string}`
): Promise<`0x${string}`> {
  const walletClient = getWalletClient();

  const hash = await walletClient.writeContract({
    address: WAFFLE_GAME_CONFIG.address,
    abi: waffleGameAbi,
    functionName: "updateMerkleRoot",
    args: [onchainId, newMerkleRoot],
  });

  console.log(`[Settlement] Updated Merkle root for ${onchainId}. TX: ${hash}`);
  return hash;
}

// ============================================================================
// Notification Helpers
// ============================================================================

/**
 * Send notifications to all players when results are ready.
 * Winners get a personalized "You won!" message, others get "Results are in!"
 */
async function sendSettlementNotifications(gameId: string) {
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
      user: {
        select: {
          fid: true,
          notifs: { take: 1 },
        },
      },
    },
  });

  const usersToNotify = allEntries.filter((e) => e.user.notifs.length > 0);

  // Separate winners from non-winners
  const winners = usersToNotify.filter(
    (e) => e.rank !== null && e.rank <= 3 && e.prize
  );
  const nonWinners = usersToNotify.filter(
    (e) => !(e.rank !== null && e.rank <= 3 && e.prize)
  );

  console.log(
    `[Settlement] Notifying ${winners.length} winners and ${nonWinners.length} non-winners`
  );

  // Winners get individual sends (each has different prize amount in message)
  // sendBatch only supports one message for all recipients
  await Promise.allSettled(
    winners.map((entry) =>
      sendToUser(entry.user.fid, {
        title: "🏆 You Won!",
        body: `You won $${entry.prize?.toFixed(2)}! Claim your prize now.`,
        targetUrl: `${env.rootUrl}/game/${gameId}/result`,
      })
    )
  );

  // Batch send to non-winners (same message)
  if (nonWinners.length > 0) {
    const nonWinnerFids = nonWinners.map((e) => e.user.fid);
    await sendBatch(
      {
        title: "📊 Results Ready!",
        body: "See how you ranked and check out the winners!",
        targetUrl: `${env.rootUrl}/game/${gameId}/result`,
      },
      { fids: nonWinnerFids }
    );
  }
}

// ============================================================================
// Full Settlement Flow
// ============================================================================

/**
 * Calculate winners and submit Merkle root for a game
 * This is the main function called by admin/cron after a game ends
 */
export async function settleGame(gameId: string): Promise<{
  merkleRoot: `0x${string}`;
  winners: Winner[];
  txHash: `0x${string}`;
}> {
  // 1. Get game and verify it has ended
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: {
      id: true,
      onchainId: true,
      startsAt: true,
      endsAt: true,
      prizePool: true,
    },
  });

  if (!game) {
    throw new Error(`Game ${gameId} not found`);
  }

  if (!game.onchainId) {
    throw new Error(`Game ${gameId} has no onchainId - not deployed on-chain`);
  }

  const onchainId = game.onchainId as `0x${string}`;

  const phase = getGamePhase(game);
  if (phase !== "ENDED") {
    throw new Error(`Game ${gameId} has not ended yet (phase: ${phase})`);
  }

  // 2. Get ranked entries with prizes (already calculated by finalize route)
  const rankedEntries = await prisma.gameEntry.findMany({
    where: {
      gameId,
      rank: { not: null, lte: 3 },
      prize: { not: null, gt: 0 }, // Must have prize set by finalize
      paidAt: { not: null },
    },
    include: {
      user: { select: { wallet: true } },
    },
    orderBy: { rank: "asc" },
  });

  if (rankedEntries.length === 0) {
    throw new Error(
      `No ranked entries with prizes for game ${gameId}. ` +
        `Make sure finalize has been called first.`
    );
  }

  // 3. Build winners from existing DB data (no recalculation)
  const winners: Winner[] = rankedEntries
    .filter((e) => e.payerWallet || e.user.wallet)
    .map((entry) => {
      // Use prize already calculated by finalize route
      const amount = parseUnits(
        (entry.prize ?? 0).toFixed(6),
        TOKEN_CONFIG.decimals
      );
      const winnerAddress = (entry.payerWallet ||
        entry.user.wallet) as `0x${string}`;

      return {
        gameId: onchainId,
        address: winnerAddress,
        amount,
      };
    });

  if (winners.length === 0) {
    throw new Error(`No winners with wallets for game ${gameId}`);
  }

  // 4. Build Merkle tree and generate all proofs
  const { root: merkleRoot } = buildMerkleTree(winners);
  const allProofs = generateAllProofs(winners);

  // 5. Submit to chain
  const txHash = await submitResultsOnChain(onchainId, merkleRoot);

  // 6. Wait for confirmation
  await publicClient.waitForTransactionReceipt({ hash: txHash });

  // 7. Store merkle data in database
  const now = new Date();

  // Update Game with merkle root
  await prisma.game.update({
    where: { id: gameId },
    data: {
      merkleRoot,
      onChainTxHash: txHash,
      onChainAt: now,
    },
  });

  // Update winning entries with their proofs
  await Promise.all(
    rankedEntries.map(async (entry) => {
      const winnerAddress = (
        entry.payerWallet || entry.user.wallet
      )?.toLowerCase();
      if (!winnerAddress) return;

      const proofData = allProofs.get(winnerAddress);
      if (!proofData) return;

      await prisma.gameEntry.update({
        where: { id: entry.id },
        data: {
          merkleProof: proofData.proof,
          merkleAmount: proofData.amount.toString(),
        },
      });
    })
  );

  console.log(`[Settlement] Game ${gameId} settled successfully`);
  console.log(`  - Merkle Root: ${merkleRoot}`);
  console.log(`  - Winners: ${winners.length}`);
  console.log(`  - TX: ${txHash}`);

  // Send notifications (async, don't block)
  sendSettlementNotifications(gameId).catch((err: Error) =>
    console.error("[Settlement] Notification error:", err)
  );

  return { merkleRoot, winners, txHash };
}
