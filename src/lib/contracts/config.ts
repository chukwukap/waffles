import { baseSepolia } from "viem/chains";

// WaffleGame Contract Configuration
export const WAFFLE_GAME_CONFIG = {
  address: "0xb4De98e6290142626F00A3371D5Ea2cD5B01A0A3" as const,
  chainId: baseSepolia.id,
} as const;

// Token Configuration (USDC on Base Sepolia)
export const TOKEN_CONFIG = {
  address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as const,
  chainId: baseSepolia.id,
  decimals: 6,
  symbol: "USDC",
} as const;
