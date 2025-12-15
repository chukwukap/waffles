import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { createPublicClient, http, formatUnits } from "viem";
import { base } from "viem/chains";
import { WAFFLE_GAME_CONFIG, TOKEN_CONFIG } from "@/lib/contracts/config";
import waffleGameAbi from "@/lib/contracts/WaffleGameAbi.json";

/**
 * Admin Contract Management API
 *
 * Provides read-only access to contract state.
 * Write operations (like setToken, withdrawFees) require the cold wallet
 * and should be done directly via the contract or a multisig.
 */

const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});

// Auth check using existing session system
async function isAuthorized(): Promise<boolean> {
  const session = await getAdminSession();
  return session !== null;
}

interface ContractState {
  address: string;
  chain: string;
  chainId: number;
  token: {
    address: string;
    symbol: string;
    decimals: number;
  };
  platformFeeBps: number;
  platformFeePercent: string;
  accumulatedFees: string;
  accumulatedFeesFormatted: string;
  activeGameCount: number;
  isPaused: boolean;
  settlementWalletConfigured: boolean;
}

/**
 * GET /api/v1/admin/contract
 *
 * Fetch current contract state
 */
export async function GET(request: NextRequest) {
  // Auth check
  if (!(await isAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch contract state in parallel
    const [
      tokenAddress,
      platformFeeBps,
      accumulatedFees,
      activeGameCount,
      isPaused,
    ] = await Promise.all([
      publicClient.readContract({
        address: WAFFLE_GAME_CONFIG.address,
        abi: waffleGameAbi,
        functionName: "token",
      }) as Promise<`0x${string}`>,
      publicClient.readContract({
        address: WAFFLE_GAME_CONFIG.address,
        abi: waffleGameAbi,
        functionName: "platformFeeBps",
      }) as Promise<number>,
      publicClient.readContract({
        address: WAFFLE_GAME_CONFIG.address,
        abi: waffleGameAbi,
        functionName: "accumulatedFees",
      }) as Promise<bigint>,
      publicClient.readContract({
        address: WAFFLE_GAME_CONFIG.address,
        abi: waffleGameAbi,
        functionName: "activeGameCount",
      }) as Promise<bigint>,
      publicClient.readContract({
        address: WAFFLE_GAME_CONFIG.address,
        abi: waffleGameAbi,
        functionName: "paused",
      }) as Promise<boolean>,
    ]);

    // Check if settlement wallet is configured
    const settlementWalletConfigured = !!process.env.SETTLEMENT_PRIVATE_KEY;

    const state: ContractState = {
      address: WAFFLE_GAME_CONFIG.address,
      chain: "Base",
      chainId: WAFFLE_GAME_CONFIG.chainId,
      token: {
        address: tokenAddress,
        symbol: TOKEN_CONFIG.symbol,
        decimals: TOKEN_CONFIG.decimals,
      },
      platformFeeBps: Number(platformFeeBps),
      platformFeePercent: (Number(platformFeeBps) / 100).toFixed(2),
      accumulatedFees: accumulatedFees.toString(),
      accumulatedFeesFormatted: formatUnits(
        accumulatedFees,
        TOKEN_CONFIG.decimals
      ),
      activeGameCount: Number(activeGameCount),
      isPaused,
      settlementWalletConfigured,
    };

    return NextResponse.json(state);
  } catch (error) {
    console.error("[Contract API] Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch contract state",
      },
      { status: 500 }
    );
  }
}
