/**
 * Chain Configuration
 * Provides typed configuration for chain, token, and contract settings.
 *
 * All values are derived from the network configuration in networks.ts,
 * which is controlled by the NEXT_PUBLIC_TEST_MODE env var.
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

export const TOKEN_DECIMALS = 6;

export const TOKEN_CONFIG = {
  address: networkConfig.contracts.usdc,
  decimals: TOKEN_DECIMALS,
  symbol: "USDC",
} as const;

// ============================================================================
// Contract Configuration
// ============================================================================

export const DEFAULT_USDC_ADDRESS = TOKEN_CONFIG.address;
export const DEFAULT_WAFFLE_GAME_ADDRESS = networkConfig.contracts.waffleGame;

export const WAFFLE_GAME_CONFIG = {
  address: DEFAULT_WAFFLE_GAME_ADDRESS,
  chainId: networkConfig.chain.id,
} as const;

// ============================================================================
// Utilities
// ============================================================================

/**
 * Get explorer URL for a transaction or address
 */
export function getExplorerUrl(
  hashOrAddress: string,
  type: "tx" | "address" = "tx"
): string {
  return `${CHAIN_CONFIG.explorerUrl}/${type}/${hashOrAddress}`;
}
