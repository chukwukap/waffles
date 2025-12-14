import { base, baseSepolia } from "viem/chains";

// Environment-based chain configuration
const isProduction = process.env.NODE_ENV === "production";
const useMainnet = process.env.NEXT_PUBLIC_USE_MAINNET === "true";

// Current chain configuration
export const CHAIN_CONFIG = {
  chain: useMainnet ? base : baseSepolia,
  chainId: useMainnet ? base.id : baseSepolia.id,
  isMainnet: useMainnet,
} as const;

// WaffleGame Contract Configuration
export const WAFFLE_GAME_CONFIG = {
  // Base Sepolia deployment
  address: "0xb4De98e6290142626F00A3371D5Ea2cD5B01A0A3" as const,
  chainId: CHAIN_CONFIG.chainId,
} as const;

// Token Configuration
// Mainnet: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 (USDC)
// Sepolia: 0x036CbD53842c5426634e7929541eC2318f3dCF7e (USDC testnet)
export const TOKEN_CONFIG = {
  address: useMainnet
    ? ("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const)
    : ("0x036CbD53842c5426634e7929541eC2318f3dCF7e" as const),
  chainId: CHAIN_CONFIG.chainId,
  decimals: 6,
  symbol: "USDC",
} as const;

// Legacy export for backwards compatibility
export const USDC_ADDRESS = TOKEN_CONFIG.address;
