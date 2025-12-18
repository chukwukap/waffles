"use client";

import { useState, useCallback, useEffect } from "react";
import { useAccount } from "wagmi";
import { parseUnits } from "viem";
import sdk from "@farcaster/miniapp-sdk";

import {
  useBuyTicket,
  useApproveToken,
  useTokenBalance,
  useTokenAllowance,
  useHasTicket,
} from "./useWaffleGame";
import { TOKEN_CONFIG } from "@/lib/contracts/config";
import { notify } from "@/components/ui/Toaster";

// ==========================================
// TYPES
// ==========================================

export type PurchaseStatus =
  | "idle"
  | "checking"
  | "approving"
  | "confirming"
  | "verifying"
  | "syncing"
  | "success"
  | "error";

export interface PurchaseState {
  status: PurchaseStatus;
  error?: string;
  txHash?: string;
}

interface UseTicketPurchaseResult {
  state: PurchaseState;
  purchase: () => Promise<void>;
  reset: () => void;
  canPurchase: boolean;
  balanceError?: string;
}

// ==========================================
// HOOK
// ==========================================

export function useTicketPurchase(
  gameId: number,
  price: number
): UseTicketPurchaseResult {
  const { address, isConnected } = useAccount();

  // State
  const [state, setState] = useState<PurchaseState>({ status: "idle" });

  // Contract reads
  const { data: balance } = useTokenBalance(address);
  const { data: allowance, refetch: refetchAllowance } =
    useTokenAllowance(address);
  const { data: hasTicket, refetch: refetchHasTicket } = useHasTicket(
    gameId ? BigInt(gameId) : undefined,
    address
  );

  // Contract writes
  const {
    approve,
    hash: approveHash,
    isPending: isApprovePending,
    isConfirming: isApproveConfirming,
    isSuccess: isApproveSuccess,
    error: approveError,
  } = useApproveToken();

  const {
    buyTicket,
    hash: buyHash,
    isPending: isBuyPending,
    isConfirming: isBuyConfirming,
    isSuccess: isBuySuccess,
    error: buyError,
  } = useBuyTicket();

  // ==========================================
  // DERIVED STATE
  // ==========================================

  const priceInUnits = parseUnits(price.toString(), TOKEN_CONFIG.decimals);
  const hasEnoughBalance = balance !== undefined && balance >= priceInUnits;
  const hasEnoughAllowance =
    allowance !== undefined && allowance >= priceInUnits;

  const balanceError = !isConnected
    ? "Connect wallet"
    : !hasEnoughBalance
    ? "Insufficient USDC"
    : undefined;

  const canPurchase =
    isConnected && hasEnoughBalance && !hasTicket && state.status === "idle";

  // ==========================================
  // PURCHASE FLOW
  // ==========================================

  const purchase = useCallback(async () => {
    if (!address) {
      setState({ status: "error", error: "Wallet not connected" });
      return;
    }

    // Step 1: Check balance
    setState({ status: "checking" });

    if (!hasEnoughBalance) {
      setState({ status: "error", error: "Insufficient USDC balance" });
      return;
    }

    // Refetch allowance to ensure it's current
    const { data: currentAllowance } = await refetchAllowance();
    const needsApproval =
      currentAllowance === undefined || currentAllowance < priceInUnits;

    try {
      if (needsApproval) {
        // Step 2a: Approve tokens first
        setState({ status: "approving" });
        // Approve a large amount to avoid future approvals
        const approveAmount = (BigInt(price) * BigInt(100)).toString(); // Approve 100x for convenience
        approve(approveAmount);
      } else {
        // Step 2b: Already approved, go straight to buy
        setState({ status: "confirming" });
        buyTicket(BigInt(gameId), price.toString());
      }
    } catch (error) {
      console.error("[useTicketPurchase] Transaction failed:", error);
      const errorMessage = (error as Error).message || "Unknown error";

      if (
        errorMessage.includes("rejected") ||
        errorMessage.includes("denied")
      ) {
        setState({ status: "error", error: "Transaction rejected by user" });
      } else {
        setState({ status: "error", error: "Transaction failed" });
      }
    }
  }, [
    address,
    hasEnoughBalance,
    refetchAllowance,
    priceInUnits,
    price,
    gameId,
    approve,
    buyTicket,
  ]);

  // ==========================================
  // TRANSACTION STATE EFFECTS
  // ==========================================

  // Handle approval success - proceed to buy
  useEffect(() => {
    if (isApproveSuccess && state.status === "approving") {
      setState({ status: "confirming" });
      buyTicket(BigInt(gameId), price.toString());
    }
  }, [isApproveSuccess, state.status, buyTicket, gameId, price]);

  // Handle approval error
  useEffect(() => {
    if (approveError && state.status === "approving") {
      console.error("[useTicketPurchase] Approval failed:", approveError);
      setState({
        status: "error",
        error: "Approval failed. Please try again.",
      });
    }
  }, [approveError, state.status]);

  // Handle buy success
  useEffect(() => {
    if (isBuySuccess && buyHash && state.status === "confirming") {
      setState({ status: "verifying", txHash: buyHash });
    }
  }, [isBuySuccess, buyHash, state.status]);

  // Handle buy error
  useEffect(() => {
    if (buyError && state.status === "confirming") {
      console.error("[useTicketPurchase] Buy failed:", buyError);
      setState({
        status: "error",
        error: "Transaction failed. Please try again.",
      });
    }
  }, [buyError, state.status]);

  // Verify on-chain state and sync with backend
  useEffect(() => {
    if (state.status !== "verifying" || !state.txHash) return;

    async function verifyAndSync() {
      try {
        // Poll for hasTicket to become true
        let attempts = 0;
        const maxAttempts = 10;

        while (attempts < maxAttempts) {
          const { data: hasTicketNow } = await refetchHasTicket();

          if (hasTicketNow) {
            // Step 5: Sync with backend
            setState((prev) => ({ ...prev, status: "syncing" }));

            const res = await sdk.quickAuth.fetch(
              `/api/v1/games/${gameId}/entry`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ txHash: state.txHash }),
              }
            );

            if (!res.ok) {
              const errorData = await res.json();
              console.error(
                "[useTicketPurchase] Backend sync failed:",
                errorData
              );
              notify.info(
                "Ticket purchased, but sync failed. Refresh to see it."
              );
            }

            setState({ status: "success", txHash: state.txHash });
            notify.success("Ticket purchased successfully!");
            return;
          }

          await new Promise((resolve) => setTimeout(resolve, 2000));
          attempts++;
        }

        setState({ status: "success", txHash: state.txHash });
        notify.success("Ticket purchased! It may take a moment to appear.");
      } catch (error) {
        console.error("[useTicketPurchase] Verification failed:", error);
        setState({ status: "success", txHash: state.txHash });
        notify.success("Ticket purchased!");
      }
    }

    verifyAndSync();
  }, [state.status, state.txHash, refetchHasTicket, gameId]);

  // ==========================================
  // RESET
  // ==========================================

  const reset = useCallback(() => {
    setState({ status: "idle" });
  }, []);

  return {
    state,
    purchase,
    reset,
    canPurchase,
    balanceError,
  };
}
