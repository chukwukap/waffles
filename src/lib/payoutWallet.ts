import { createWalletClient, http, publicActions } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { env } from "./env";

/**
 * Get the payout wallet client for sending prize payouts
 *
 * CRITICAL SECURITY:
 * - Private key must be stored in encrypted environment variables
 * - Use different wallets for dev/staging/production
 * - Monitor wallet balance regularly
 * - Keep limited funds in hot wallet
 */
export function getPayoutWallet() {
  const privateKey = env.payoutWalletPrivateKey;

  if (!privateKey) {
    throw new Error(
      "PAYOUT_WALLET_PRIVATE_KEY not configured. " +
        "This is required for prize payouts."
    );
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`);

  return createWalletClient({
    account,
    chain: base,
    transport: http(),
  }).extend(publicActions);
}
