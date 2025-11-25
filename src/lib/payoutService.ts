import { parseUnits, formatUnits } from "viem";
import { getPayoutWallet } from "./payoutWallet";
import { prisma } from "./db";
import { env } from "./env";

const USDC_ADDRESS = env.nextPublicUsdcAddress as `0x${string}`;

const USDC_ABI = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export type PayoutResult = {
  success: boolean;
  txHash?: string;
  error?: string;
};

/**
 * Send USDC prize payout to winner
 *
 * Features:
 * - Automatic retry with exponential backoff
 * - Balance verification before sending
 * - Transaction confirmation waiting
 * - Database update on success
 *
 * @param recipientAddress Winner's wallet address
 * @param amountUSDC Amount in USDC (e.g., 50 for $50)
 * @param gamePlayerId GamePlayer record ID to update
 * @param maxRetries Maximum retry attempts (default: 3)
 */
export async function sendPrizePayout(
  recipientAddress: string,
  amountUSDC: number,
  gamePlayerId: number,
  maxRetries = 3
): Promise<PayoutResult> {
  const wallet = getPayoutWallet();
  const amount = parseUnits(amountUSDC.toString(), 6); // USDC has 6 decimals

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `💰 Payout attempt ${attempt}/${maxRetries}: ` +
          `$${amountUSDC} USDC to ${recipientAddress}`
      );

      // 1. Check payout wallet balance
      const balance = await wallet.readContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: "balanceOf",
        args: [wallet.account.address],
      });

      const balanceUSDC = Number(formatUnits(balance, 6));

      if (balance < amount) {
        const error =
          `Insufficient payout wallet balance. ` +
          `Have: $${balanceUSDC.toFixed(2)}, Need: $${amountUSDC}`;
        console.error(`❌ ${error}`);
        return { success: false, error };
      }

      console.log(
        `✅ Wallet balance check passed: $${balanceUSDC.toFixed(2)} USDC`
      );

      // 2. Send USDC transfer
      const hash = await wallet.writeContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: "transfer",
        args: [recipientAddress as `0x${string}`, amount],
      });

      console.log(`📤 Transaction sent: ${hash}`);

      // 3. Wait for confirmation (timeout after 30 seconds)
      const receipt = await wallet.waitForTransactionReceipt({
        hash,
        timeout: 30_000,
      });

      if (receipt.status === "success") {
        // 4. Update database
        await prisma.gamePlayer.update({
          where: { id: gamePlayerId },
          data: {
            claimedAt: new Date(),
            // Note: Add a payoutTxHash field to GamePlayer schema if needed
          },
        });

        console.log(`✅ Payout successful! Hash: ${hash}`);
        return { success: true, txHash: hash };
      } else {
        throw new Error("Transaction reverted");
      }
    } catch (error: any) {
      console.error(
        `❌ Payout attempt ${attempt}/${maxRetries} failed:`,
        error.message || error
      );

      // Don't retry on specific errors
      const errorMessage = error.message?.toLowerCase() || "";

      if (errorMessage.includes("insufficient funds")) {
        return {
          success: false,
          error: "Payout wallet has insufficient USDC balance",
        };
      }

      if (
        errorMessage.includes("user rejected") ||
        errorMessage.includes("user denied")
      ) {
        return {
          success: false,
          error: "Transaction rejected",
        };
      }

      if (errorMessage.includes("invalid address")) {
        return {
          success: false,
          error: "Invalid recipient wallet address",
        };
      }

      // Retry on network/temporary errors
      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // All retries exhausted
      return {
        success: false,
        error: error.message || "Payout transaction failed after retries",
      };
    }
  }

  return {
    success: false,
    error: "Payout failed after all retry attempts",
  };
}
