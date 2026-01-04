/**
 * Viem Clients for Chain Interaction
 * Provides public and wallet clients for reading and writing to chain
 */

import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { CHAIN_CONFIG } from "./config";
import { env } from "@/lib/env";

// ============================================================================
// Public Client (Read-only)
// ============================================================================

export const publicClient = createPublicClient({
  chain: CHAIN_CONFIG.chain,
  transport: http(),
});

// ============================================================================
// Wallet Client (Admin Operations)
// ============================================================================

/**
 * Get the admin wallet account from environment
 * @throws Error if SETTLEMENT_PRIVATE_KEY is not set
 */
export function getAdminWallet() {
  const privateKey = env.settlementPrivateKey;
  if (!privateKey) {
    throw new Error("SETTLEMENT_PRIVATE_KEY environment variable not set");
  }
  return privateKeyToAccount(privateKey as `0x${string}`);
}

/**
 * Create a wallet client for admin operations (create game, settle, etc.)
 */
export function getWalletClient() {
  const account = getAdminWallet();
  return createWalletClient({
    account,
    chain: CHAIN_CONFIG.chain,
    transport: http(),
  });
}

// ============================================================================
// Contract Read Functions
// ============================================================================

import waffleGameAbi from "./abi.json";
import { WAFFLE_GAME_CONFIG } from "./config";

/**
 * Read the current platform fee from the smart contract
 * @returns Platform fee in basis points (e.g., 1000 = 10%)
 */
export async function getPlatformFeeBps(): Promise<number> {
  const fee = await publicClient.readContract({
    address: WAFFLE_GAME_CONFIG.address,
    abi: waffleGameAbi,
    functionName: "platformFeeBps",
  });
  return Number(fee);
}
