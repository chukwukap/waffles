import { base, baseSepolia } from "viem/chains";
import { env } from "@/lib/env";

// ============================================================================
// NETWORK CONFIGURATION
// ============================================================================
// Set NEXT_PUBLIC_CHAIN_NETWORK in your .env file:
//   - "testnet" for Base Sepolia (development)
//   - "mainnet" for Base (production)
// ============================================================================

type NetworkConfig = {
  chain: typeof base | typeof baseSepolia;
  chainId: number;
  name: string;
  explorerUrl: string;
  contracts: {
    waffleGame: `0x${string}`;
    usdc: `0x${string}`;
  };
};

const TESTNET_CONFIG: NetworkConfig = {
  chain: baseSepolia,
  chainId: baseSepolia.id,
  name: "Base Sepolia",
  explorerUrl: "https://sepolia.basescan.org",
  contracts: {
    // WaffleGame v4.0.0 proxy on Base Sepolia (with TestUSDC)
    waffleGame: "0xbD20Be151F655aC17048d331bA5a6C0093c99d34",
    // TestUSDC with faucet function
    usdc: "0x8aAa7ECea87244Ca4062eBce6DA61820f3830233",
  },
};

const MAINNET_CONFIG: NetworkConfig = {
  chain: base,
  chainId: base.id,
  name: "Base",
  explorerUrl: "https://basescan.org",
  contracts: {
    // TODO: Update with your Base mainnet contract address
    waffleGame: "0x0000000000000000000000000000000000000000",
    // Official USDC on Base mainnet
    usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  },
};

// Read network from environment variable (default to testnet for safety)
const network = env.chainNetwork || "testnet";
const isMainnet = network === "mainnet";

// Select the appropriate config based on environment
const NETWORK_CONFIG: NetworkConfig = isMainnet
  ? MAINNET_CONFIG
  : TESTNET_CONFIG;

// ============================================================================
// EXPORTS
// ============================================================================

export const CHAIN_CONFIG = {
  chain: NETWORK_CONFIG.chain,
  chainId: NETWORK_CONFIG.chainId,
  name: NETWORK_CONFIG.name,
  explorerUrl: NETWORK_CONFIG.explorerUrl,
  isMainnet,
  isTestnet: !isMainnet,
} as const;

export const WAFFLE_GAME_CONFIG = {
  address: NETWORK_CONFIG.contracts.waffleGame,
  chainId: NETWORK_CONFIG.chainId,
} as const;

export const TOKEN_CONFIG = {
  address: NETWORK_CONFIG.contracts.usdc,
  chainId: NETWORK_CONFIG.chainId,
  decimals: 6,
  symbol: "USDC",
} as const;

// Legacy export for backwards compatibility
export const USDC_ADDRESS = TOKEN_CONFIG.address;

// Helper to get explorer URLs
export const getExplorerUrl = {
  address: (addr: string) => `${CHAIN_CONFIG.explorerUrl}/address/${addr}`,
  tx: (hash: string) => `${CHAIN_CONFIG.explorerUrl}/tx/${hash}`,
};
