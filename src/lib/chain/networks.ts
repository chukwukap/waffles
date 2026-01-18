/**
 * Network Configuration
 *
 * Provides typed network configurations for testnet and mainnet.
 * The active network is determined by the NEXT_PUBLIC_TEST_MODE env var.
 */
import { base, baseSepolia } from "viem/chains";
import type { Chain } from "viem";

// ============================================================================
// Types
// ============================================================================

export interface NetworkConfig {
  chain: Chain;
  contracts: {
    waffleGame: `0x${string}`;
    usdc: `0x${string}`;
  };
}

// ============================================================================
// Network Configurations
// ============================================================================

const NETWORKS: Record<"testnet" | "mainnet", NetworkConfig> = {
  testnet: {
    chain: baseSepolia,
    contracts: {
      waffleGame: "0xeB89A087cC3898713d9f887b21Dc3BF4FC963B8F",
      usdc: "0x8aAa7ECea87244Ca4062eBce6DA61820f3830233",
    },
  },
  mainnet: {
    chain: base,
    contracts: {
      // TODO: Deploy mainnet contract
      waffleGame: "0x0000000000000000000000000000000000000000",
      usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    },
  },
};

// ============================================================================
// Active Network (based on NEXT_PUBLIC_TEST_MODE)
// ============================================================================

/**
 * Test mode is enabled when NEXT_PUBLIC_TEST_MODE=true.
 * Works both server-side and client-side.
 *
 * - NEXT_PUBLIC_TEST_MODE=true → Testnet (Base Sepolia)
 * - NEXT_PUBLIC_TEST_MODE not set → Mainnet (Base)
 */
export const isTestMode = process.env.NEXT_PUBLIC_TEST_MODE === "true";

/** The active network configuration */
export const networkConfig = isTestMode ? NETWORKS.testnet : NETWORKS.mainnet;
