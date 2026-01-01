/**
 * Game On-Chain Operations
 * Functions for creating, ending, and querying games on-chain
 */

import { parseUnits } from "viem";
import { WAFFLE_GAME_CONFIG, TOKEN_CONFIG } from "./config";
import { publicClient, getWalletClient } from "./client";
import waffleGameAbi from "./abi.json";

// ============================================================================
// Types
// ============================================================================

export interface OnChainGame {
  entryFee: bigint;
  ticketCount: bigint;
  merkleRoot: `0x${string}`;
  settledAt: bigint;
  claimCount: bigint;
  ended: boolean;
}

// ============================================================================
// Game Lifecycle
// ============================================================================

/**
 * Generate a random bytes32 game ID for on-chain use
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
 * @param minEntryFeeUSDC - Minimum entry fee in USDC (human readable)
 * @returns Transaction hash
 */
export async function createGameOnChain(
  onchainId: `0x${string}`,
  minEntryFeeUSDC: number
): Promise<`0x${string}`> {
  const walletClient = getWalletClient();
  const entryFee = parseUnits(
    minEntryFeeUSDC.toString(),
    TOKEN_CONFIG.decimals
  );

  const hash = await walletClient.writeContract({
    address: WAFFLE_GAME_CONFIG.address,
    abi: waffleGameAbi,
    functionName: "createGame",
    args: [onchainId, entryFee],
  });

  console.log(`[Chain] Created game ${onchainId}. TX: ${hash}`);
  return hash;
}

/**
 * End a game on-chain (stops ticket sales)
 * @param onchainId - The bytes32 on-chain game ID
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

  console.log(`[Chain] Ended game ${onchainId}. TX: ${hash}`);
  return hash;
}

// ============================================================================
// View Functions
// ============================================================================

/**
 * Get game data from chain
 * @returns null if game doesn't exist on-chain
 */
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

    // Game doesn't exist if entryFee is 0
    if (game.entryFee === BigInt(0)) {
      return null;
    }

    return game;
  } catch (error) {
    console.log(`[Chain] Game ${onchainId} not found on-chain`);
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
