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
import { base, baseSepolia } from "viem/chains";
import {
  WAFFLE_GAME_CONFIG,
  TOKEN_CONFIG,
  CHAIN_CONFIG,
} from "@/lib/contracts/config";
import waffleGameAbi from "@/lib/contracts/WaffleGameAbi.json";
import { buildMerkleTree, type Winner } from "@/lib/merkle";
import { prisma } from "@/lib/db";

// ============================================================================
// Configuration
// ============================================================================

const chain = CHAIN_CONFIG.isMainnet ? base : baseSepolia;

// Check for admin private key (should be set as env var in production)
const getAdminWallet = () => {
  const privateKey = process.env.SETTLEMENT_PRIVATE_KEY;
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
 * Create a game on-chain
 * @param gameId - The database game ID (must match on-chain ID)
 * @param entryFeeUSDC - Entry fee in USDC (human readable)
 * @returns Transaction hash
 */
export async function createGameOnChain(
  gameId: number,
  entryFeeUSDC: number
): Promise<`0x${string}`> {
  const walletClient = getWalletClient();
  const entryFee = parseUnits(entryFeeUSDC.toString(), TOKEN_CONFIG.decimals);

  const hash = await walletClient.writeContract({
    address: WAFFLE_GAME_CONFIG.address,
    abi: waffleGameAbi,
    functionName: "createGame",
    args: [BigInt(gameId), entryFee],
  });

  console.log(`[Settlement] Created game ${gameId} on-chain. TX: ${hash}`);
  return hash;
}

/**
 * End a game on-chain (stops ticket sales)
 * @param gameId - The game ID to end
 * @returns Transaction hash
 */
export async function endGameOnChain(gameId: number): Promise<`0x${string}`> {
  const walletClient = getWalletClient();

  const hash = await walletClient.writeContract({
    address: WAFFLE_GAME_CONFIG.address,
    abi: waffleGameAbi,
    functionName: "endGame",
    args: [BigInt(gameId)],
  });

  console.log(`[Settlement] Ended game ${gameId} on-chain. TX: ${hash}`);
  return hash;
}

/**
 * Submit Merkle root to finalize a game
 * @param gameId - The game ID to settle
 * @param merkleRoot - The Merkle root of winners
 * @returns Transaction hash
 */
export async function submitResultsOnChain(
  gameId: number,
  merkleRoot: `0x${string}`
): Promise<`0x${string}`> {
  const walletClient = getWalletClient();

  const hash = await walletClient.writeContract({
    address: WAFFLE_GAME_CONFIG.address,
    abi: waffleGameAbi,
    functionName: "submitResults",
    args: [BigInt(gameId), merkleRoot],
  });

  console.log(`[Settlement] Submitted results for game ${gameId}. TX: ${hash}`);
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
  // 1. Get game and verify it has ended
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: {
      id: true,
      status: true,
      prizePool: true,
    },
  });

  if (!game) {
    throw new Error(`Game ${gameId} not found`);
  }

  if (game.status !== "ENDED") {
    throw new Error(
      `Game ${gameId} has not ended yet (status: ${game.status})`
    );
  }

  // 2. Get ranked players (top 3 get prizes)
  const rankedPlayers = await prisma.gamePlayer.findMany({
    where: {
      gameId,
      rank: { not: null, lte: 3 },
    },
    include: {
      user: {
        select: { wallet: true },
      },
    },
    orderBy: { rank: "asc" },
  });

  if (rankedPlayers.length === 0) {
    throw new Error(`No ranked players for game ${gameId}`);
  }

  // 3. Calculate prize distribution
  const prizeDistribution = [0.6, 0.3, 0.1]; // 60%, 30%, 10%
  const winners: Winner[] = rankedPlayers
    .filter((p) => p.user.wallet)
    .map((player, index) => {
      const prizeShare = prizeDistribution[index] || 0;
      const amountUSDC = game.prizePool * prizeShare;
      const amount = parseUnits(amountUSDC.toFixed(6), TOKEN_CONFIG.decimals);

      return {
        gameId,
        address: player.user.wallet as `0x${string}`,
        amount,
      };
    });

  if (winners.length === 0) {
    throw new Error(`No winners with wallets for game ${gameId}`);
  }

  // 4. Build Merkle tree
  const { root: merkleRoot } = buildMerkleTree(winners);

  // 5. Submit to chain
  const txHash = await submitResultsOnChain(gameId, merkleRoot);

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
 */
export async function getOnChainGame(gameId: number) {
  const game = await publicClient.readContract({
    address: WAFFLE_GAME_CONFIG.address,
    abi: waffleGameAbi,
    functionName: "getGame",
    args: [BigInt(gameId)],
  });

  return game;
}

/**
 * Check if a player has a ticket on-chain
 */
export async function hasTicketOnChain(
  gameId: number,
  playerAddress: `0x${string}`
): Promise<boolean> {
  const hasTicket = await publicClient.readContract({
    address: WAFFLE_GAME_CONFIG.address,
    abi: waffleGameAbi,
    functionName: "hasTicket",
    args: [BigInt(gameId), playerAddress],
  });

  return hasTicket as boolean;
}

/**
 * Check if a player has claimed their prize on-chain
 */
export async function hasClaimedOnChain(
  gameId: number,
  playerAddress: `0x${string}`
): Promise<boolean> {
  const hasClaimed = await publicClient.readContract({
    address: WAFFLE_GAME_CONFIG.address,
    abi: waffleGameAbi,
    functionName: "hasClaimed",
    args: [BigInt(gameId), playerAddress],
  });

  return hasClaimed as boolean;
}
