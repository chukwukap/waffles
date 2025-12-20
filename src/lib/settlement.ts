/**
 * Settlement Utilities for WaffleGame Smart Contract
 *
 * These functions are used by admin dashboard and cron jobs to:
 * - Create games on-chain when created in the database
 * - End games on-chain when they finish
 * - Submit Merkle roots after scoring is complete
 */

import { createWalletClient, createPublicClient, http, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  WAFFLE_GAME_CONFIG,
  TOKEN_CONFIG,
  CHAIN_CONFIG,
} from "@/lib/contracts/config";
import waffleGameAbi from "@/lib/contracts/WaffleGameAbi.json";
import { buildMerkleTree, type Winner } from "@/lib/merkle";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

// ============================================================================
// Configuration
// ============================================================================

const chain = CHAIN_CONFIG.chain;

// Check for admin private key (should be set as env var in production)
const getAdminWallet = () => {
  const privateKey = env.settlementPrivateKey;
  if (!privateKey) {
    throw new Error("SETTLEMENT_PRIVATE_KEY environment variable not set");
  }
  return privateKeyToAccount(privateKey as `0x${string}`);
};

const publicClient = createPublicClient({
  chain,
  transport: http(),
});

const getWalletClient = () => {
  const account = getAdminWallet();
  return createWalletClient({
    account,
    chain,
    transport: http(),
  });
};

// ============================================================================
// On-Chain Game Management
// ============================================================================

/**
 * Generate a random bytes32 game ID for on-chain use
 * @returns A random 0x-prefixed bytes32 string
 */
export function generateOnchainGameId(): `0x${string}` {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  return `0x${Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")}` as `0x${string}`;
}

/**
 * Create a game on-chain
 * @param onchainId - The bytes32 on-chain game ID
 * @param entryFeeUSDC - Entry fee in USDC (human readable)
 * @returns Transaction hash
 */
export async function createGameOnChain(
  onchainId: `0x${string}`,
  entryFeeUSDC: number
): Promise<`0x${string}`> {
  const walletClient = getWalletClient();
  const entryFee = parseUnits(entryFeeUSDC.toString(), TOKEN_CONFIG.decimals);

  const hash = await walletClient.writeContract({
    address: WAFFLE_GAME_CONFIG.address,
    abi: waffleGameAbi,
    functionName: "createGame",
    args: [onchainId, entryFee],
  });

  console.log(`[Settlement] Created game ${onchainId} on-chain. TX: ${hash}`);
  return hash;
}

/**
 * End a game on-chain (stops ticket sales)
 * @param onchainId - The bytes32 on-chain game ID to end
 * @returns Transaction hash
 */
export async function endGameOnChain(
  onchainId: `0x${string}`
): Promise<`0x${string}`> {
  const walletClient = getWalletClient();

  const hash = await walletClient.writeContract({
    address: WAFFLE_GAME_CONFIG.address,
    abi: waffleGameAbi,
    functionName: "endGame",
    args: [onchainId],
  });

  console.log(`[Settlement] Ended game ${onchainId} on-chain. TX: ${hash}`);
  return hash;
}

/**
 * Submit Merkle root to finalize a game
 * @param onchainId - The bytes32 on-chain game ID to settle
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

  console.log(
    `[Settlement] Submitted results for game ${onchainId}. TX: ${hash}`
  );
  return hash;
}

// ============================================================================
// Full Settlement Flow
// ============================================================================

/**
 * Calculate winners and submit Merkle root for a game
 * This is the main function called by admin/cron after a game ends
 */
export async function settleGame(gameId: number): Promise<{
  merkleRoot: `0x${string}`;
  winners: Winner[];
  txHash: `0x${string}`;
}> {
  // Import game phase utility
  const { getGamePhase } = await import("@/lib/game-utils");

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

  if (!game) {
    throw new Error(`Game ${gameId} not found`);
  }

  const phase = getGamePhase(game);
  if (phase !== "ENDED") {
    throw new Error(`Game ${gameId} has not ended yet (phase: ${phase})`);
  }

  // 2. Get ranked entries (top 3 get prizes)
  const rankedEntries = await prisma.gameEntry.findMany({
    where: {
      gameId,
      rank: { not: null, lte: 3 },
      paidAt: { not: null },
    },
    include: {
      user: {
        select: { wallet: true },
      },
    },
    orderBy: { rank: "asc" },
  });

  if (rankedEntries.length === 0) {
    throw new Error(`No ranked entries for game ${gameId}`);
  }

  // 3. Calculate prize distribution
  const prizeDistribution = [0.6, 0.3, 0.1]; // 60%, 30%, 10%
  const winners: Winner[] = rankedEntries
    .filter((e) => e.user.wallet)
    .map((entry, index) => {
      const prizeShare = prizeDistribution[index] || 0;
      const amountUSDC = game.prizePool * prizeShare;
      const amount = parseUnits(amountUSDC.toFixed(6), TOKEN_CONFIG.decimals);

      return {
        gameId: onchainId, // Use onchainId for Merkle tree
        address: entry.user.wallet as `0x${string}`,
        amount,
      };
    });

  if (winners.length === 0) {
    throw new Error(`No winners with wallets for game ${gameId}`);
  }

  // 4. Build Merkle tree
  const { root: merkleRoot } = buildMerkleTree(winners);

  // 5. Submit to chain
  const txHash = await submitResultsOnChain(onchainId, merkleRoot);

  // 6. Wait for confirmation
  await publicClient.waitForTransactionReceipt({ hash: txHash });

  console.log(`[Settlement] Game ${gameId} settled successfully`);
  console.log(`  - Merkle Root: ${merkleRoot}`);
  console.log(`  - Winners: ${winners.length}`);
  console.log(`  - TX: ${txHash}`);

  return { merkleRoot, winners, txHash };
}

// ============================================================================
// View Functions
// ============================================================================

/**
 * Check if a game exists on-chain
 * Returns null if game doesn't exist or contract call fails
 */
export interface OnChainGame {
  entryFee: bigint;
  ticketCount: bigint;
  merkleRoot: `0x${string}`;
  settledAt: bigint;
  ended: boolean;
}

export async function getOnChainGame(
  onchainId: `0x${string}`
): Promise<OnChainGame | null> {
  try {
    const game = (await publicClient.readContract({
      address: WAFFLE_GAME_CONFIG.address,
      abi: waffleGameAbi,
      functionName: "getGame",
      args: [onchainId],
    })) as OnChainGame;

    return game;
  } catch (error) {
    // Game doesn't exist on-chain yet (only in database)
    console.log(
      `[Settlement] Game ${onchainId} not found on-chain (database-only)`
    );
    return null;
  }
}

/**
 * Check if a player has a ticket on-chain
 */
export async function hasTicketOnChain(
  onchainId: `0x${string}`,
  playerAddress: `0x${string}`
): Promise<boolean> {
  const hasTicket = await publicClient.readContract({
    address: WAFFLE_GAME_CONFIG.address,
    abi: waffleGameAbi,
    functionName: "hasTicket",
    args: [onchainId, playerAddress],
  });

  return hasTicket as boolean;
}

/**
 * Check if a player has claimed their prize on-chain
 */
export async function hasClaimedOnChain(
  onchainId: `0x${string}`,
  playerAddress: `0x${string}`
): Promise<boolean> {
  const hasClaimed = await publicClient.readContract({
    address: WAFFLE_GAME_CONFIG.address,
    abi: waffleGameAbi,
    functionName: "hasClaimed",
    args: [onchainId, playerAddress],
  });

  return hasClaimed as boolean;
}
