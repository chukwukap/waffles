/**
 * Chain Configuration
 * Provides typed configuration for chain, token, and contract settings
 */

import { base, baseSepolia } from "viem/chains";

// ============================================================================
// Contract Addresses
// ============================================================================

const TEST_USDC_ADDRESS = "0x8aAa7ECea87244Ca4062eBce6DA61820f3830233";
const TEST_WAFFLE_GAME_ADDRESS = "0xbD20Be151F655aC17048d331bA5a6C0093c99d34";

const MAINNET_USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const MAINNET_WAFFLE_GAME_ADDRESS =
  "0x0000000000000000000000000000000000000000"; // TODO: Deploy mainnet

// ============================================================================
// Chain Configuration
// ============================================================================

const isTestnet = process.env.NEXT_PUBLIC_CHAIN_NETWORK === "testnet";
const chain = isTestnet ? baseSepolia : base;

export const CHAIN_CONFIG = {
  chain,
  chainId: chain.id,
  isTestnet,
  name: chain.name,
  explorerUrl: chain.blockExplorers.default.url,
} as const;

// ============================================================================
// Token Configuration
// ============================================================================

export const TOKEN_DECIMALS = 6;

export const TOKEN_CONFIG = {
  address: (isTestnet
    ? TEST_USDC_ADDRESS
    : MAINNET_USDC_ADDRESS) as `0x${string}`,
  decimals: TOKEN_DECIMALS,
  symbol: "USDC",
} as const;

// ============================================================================
// Contract Configuration
// ============================================================================

export const DEFAULT_USDC_ADDRESS = TOKEN_CONFIG.address;
export const DEFAULT_WAFFLE_GAME_ADDRESS = (
  isTestnet ? TEST_WAFFLE_GAME_ADDRESS : MAINNET_WAFFLE_GAME_ADDRESS
) as `0x${string}`;

export const WAFFLE_GAME_CONFIG = {
  address: DEFAULT_WAFFLE_GAME_ADDRESS,
  chainId: chain.id,
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
