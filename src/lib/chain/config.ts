/**
 * Chain Configuration
 *
 * All values derive from networks.ts, controlled by NEXT_PUBLIC_TEST_MODE.
 */
import { networkConfig, isTestMode } from "./networks";

// ============================================================================
// Chain Configuration
// ============================================================================

export const CHAIN_CONFIG = {
  chain: networkConfig.chain,
  chainId: networkConfig.chain.id,
  isTestnet: isTestMode,
  name: networkConfig.chain.name,
  explorerUrl: networkConfig.chain.blockExplorers?.default.url ?? "",
} as const;

// ============================================================================
// Token Configuration
// ============================================================================

export const TOKEN_CONFIG = {
  address: networkConfig.contracts.usdc,
  decimals: 6,
  symbol: "USDC",
} as const;

// ============================================================================
// Contract Configuration
// ============================================================================

export const WAFFLE_GAME_CONFIG = {
  address: networkConfig.contracts.waffleGame,
  chainId: networkConfig.chain.id,
} as const;

// ============================================================================
// Utilities
// ============================================================================

export function getExplorerUrl(
  hashOrAddress: string,
  type: "tx" | "address" = "tx"
): string {
  return `${CHAIN_CONFIG.explorerUrl}/${type}/${hashOrAddress}`;
}
