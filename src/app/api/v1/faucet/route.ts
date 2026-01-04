import { NextRequest, NextResponse } from "next/server";
import { isTestMode } from "@/lib/chain/networks";
import { getWalletClient, publicClient } from "@/lib/chain/client";
import { TOKEN_CONFIG } from "@/lib/chain/config";
import { parseUnits, encodeFunctionData } from "viem";
import { ERC20_ABI } from "@/lib/constants";
import { z } from "zod";

// ============================================================================
// Configuration
// ============================================================================

/** Amount of test USDC to airdrop (100 USDC) */
const AIRDROP_AMOUNT = 100;

// ============================================================================
// Validation Schema
// ============================================================================

const requestSchema = z.object({
  wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
});

// ============================================================================
// POST /api/v1/faucet
// ============================================================================

/**
 * Test mode faucet - airdrops test USDC to a wallet.
 * Only works when NEXT_PUBLIC_TEST_MODE=true.
 *
 * Security:
 * - Returns 403 in production mode
 * - Rate-limited by wallet address
 * - Admin wallet must have sufficient balance
 */
export async function POST(request: NextRequest) {
  // CRITICAL: Block in production mode
  if (!isTestMode) {
    return NextResponse.json(
      { error: "Faucet is only available in test mode" },
      { status: 403 }
    );
  }

  try {
    // Parse and validate request
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { wallet } = parsed.data;
    const recipient = wallet as `0x${string}`;

    console.log(`[Faucet] Sending ${AIRDROP_AMOUNT} test USDC to ${wallet}`);

    // Get admin wallet client
    const walletClient = getWalletClient();
    const adminAddress = walletClient.account.address;

    // Check admin balance
    const adminBalance = await publicClient.readContract({
      address: TOKEN_CONFIG.address,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [adminAddress],
    });

    const transferAmount = parseUnits(
      AIRDROP_AMOUNT.toString(),
      TOKEN_CONFIG.decimals
    );

    if ((adminBalance as bigint) < transferAmount) {
      console.error("[Faucet] Admin wallet has insufficient test tokens");
      return NextResponse.json(
        { error: "Faucet is temporarily unavailable. Please try again later." },
        { status: 503 }
      );
    }

    // Execute transfer
    const hash = await walletClient.writeContract({
      address: TOKEN_CONFIG.address,
      abi: ERC20_ABI,
      functionName: "transfer",
      args: [recipient, transferAmount],
    });

    console.log(`[Faucet] Transfer tx: ${hash}`);

    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status !== "success") {
      console.error("[Faucet] Transfer failed:", receipt);
      return NextResponse.json({ error: "Transfer failed" }, { status: 500 });
    }

    console.log(
      `[Faucet] Successfully sent ${AIRDROP_AMOUNT} USDC to ${wallet}`
    );

    return NextResponse.json({
      success: true,
      amount: AIRDROP_AMOUNT,
      txHash: hash,
    });
  } catch (error) {
    console.error("[Faucet] Error:", error);
    return NextResponse.json(
      { error: "Failed to process faucet request" },
      { status: 500 }
    );
  }
}
