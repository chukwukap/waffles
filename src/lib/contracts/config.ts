import { base } from "viem/chains";

// Chain configuration - Base mainnet
export const CHAIN_CONFIG = {
  chain: base,
  chainId: base.id,
} as const;

// WaffleGame Contract Configuration
export const WAFFLE_GAME_CONFIG = {
  address: "0xb4De98e6290142626F00A3371D5Ea2cD5B01A0A3" as const,
  chainId: CHAIN_CONFIG.chainId,
} as const;

// Token Configuration (USDC on Base)
export const TOKEN_CONFIG = {
  address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const,
  chainId: CHAIN_CONFIG.chainId,
  decimals: 6,
  symbol: "USDC",
} as const;

// Legacy export for backwards compatibility
export const USDC_ADDRESS = TOKEN_CONFIG.address;
