import { baseSepolia } from "viem/chains";
import { USDC_ADDRESS_BASE_MAINNET } from "../constants";

// WaffleGame Contract Configuration
export const WAFFLE_GAME_CONFIG = {
  address: "0xb4De98e6290142626F00A3371D5Ea2cD5B01A0A3" as const,
  chainId: baseSepolia.id,
} as const;

// Token Configuration (USDC on Base Sepolia)
export const TOKEN_CONFIG = {
  address: USDC_ADDRESS_BASE_MAINNET,
  chainId: baseSepolia.id,
  decimals: 6,
  symbol: "USDC",
} as const;
