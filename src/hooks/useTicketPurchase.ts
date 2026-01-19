"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useSendCalls, useCallsStatus, useConnect } from "wagmi";
import { parseUnits, encodeFunctionData } from "viem";
import { farcasterFrame } from "@farcaster/miniapp-wagmi-connector";
import sdk from "@farcaster/miniapp-sdk";
import { useMiniKit } from "@coinbase/onchainkit/minikit";

import { useRealtime } from "@/components/providers/RealtimeProvider";
import { useTokenAllowance } from "./waffleContractHooks";
import { notify } from "@/components/ui/Toaster";
import { playSound } from "@/lib/sounds";
import waffleGameAbi from "@/lib/chain/abi.json";
import { ERC20_ABI } from "@/lib/constants";
import { purchaseGameTicket } from "@/actions/game";
import {
  PAYMENT_TOKEN_ADDRESS,
  PAYMENT_TOKEN_DECIMALS,
  WAFFLE_CONTRACT_ADDRESS,
} from "@/lib/chain";

// ==========================================
// TYPES
// ==========================================

export type PurchaseStep =
  | "idle"
  | "connecting"
  | "pending"
  | "confirming"
  | "syncing"
  | "success"
  | "error";

export interface TicketPurchaseState {
  step: PurchaseStep;
  error?: string;
  txHash?: string;
}

// ==========================================
// HOOK: useTicketPurchase
// ==========================================

export function useTicketPurchase(
  gameId: string,
  onchainId: `0x${string}` | null,
  price: number,
  onSuccess?: () => void,
) {
  const router = useRouter();
  const { context } = useMiniKit();
  const { address, isConnected } = useAccount();
  const { connectAsync } = useConnect();
  const [state, setState] = useState<TicketPurchaseState>({ step: "idle" });

  // Get user's fid from MiniKit context
  const fid = context?.user?.fid;

  // ==========================================
  // BACKEND ENTRY (Source of Truth)
  // ==========================================
  const { state: realtimeState, refetchEntry } = useRealtime();
  const { entry, isLoadingEntry } = realtimeState;

  // Has ticket = entry exists and is paid
  const hasTicket = !!entry?.paidAt;

  // ==========================================
  // TOKEN & ALLOWANCE
  // ==========================================
  const priceInUnits = useMemo(
    () => parseUnits(price.toString(), PAYMENT_TOKEN_DECIMALS),
    [price],
  );

  const tokenAddress = PAYMENT_TOKEN_ADDRESS;
  const { data: allowance } = useTokenAllowance(
    address as `0x${string}`,
    tokenAddress,
  );

  // console.log("[DEBUG] Token allowance:", allowance);

  const needsApproval = useMemo(() => {
    if (!allowance) return true;
    return (allowance as bigint) < priceInUnits;
  }, [allowance, priceInUnits]);

  // ==========================================
  // BUILD TRANSACTION CALLS
  // ==========================================
  const calls = useMemo(() => {
    console.log("[DEBUG] Building calls:", {
      tokenAddress,
      onchainId,
      needsApproval,
      priceInUnits: priceInUnits?.toString(),
    });

    if (!tokenAddress || !onchainId) {
      console.log("[DEBUG] Cannot build calls - missing:", {
        tokenAddress,
        onchainId,
      });
      return [];
    }

    const callList: Array<{ to: `0x${string}`; data: `0x${string}` }> = [];

    if (needsApproval) {
      console.log("[DEBUG] Adding approval call");
      callList.push({
        to: tokenAddress,
        data: encodeFunctionData({
          abi: ERC20_ABI,
          functionName: "approve",
          args: [
            WAFFLE_CONTRACT_ADDRESS,
            parseUnits("5000", PAYMENT_TOKEN_DECIMALS),
          ],
        }),
      });
    }

    console.log("[DEBUG] Adding buyTicket call:", {
      contract: WAFFLE_CONTRACT_ADDRESS,
      onchainId,
      amount: priceInUnits?.toString(),
    });
    callList.push({
      to: WAFFLE_CONTRACT_ADDRESS,
      data: encodeFunctionData({
        abi: waffleGameAbi,
        functionName: "buyTicket",
        args: [onchainId, priceInUnits],
      }),
    });

    console.log("[DEBUG] Built calls:", callList.length, "calls");
    return callList;
  }, [onchainId, priceInUnits, needsApproval, tokenAddress]);

  // ==========================================
  // WAGMI SEND CALLS
  // ==========================================
  const {
    sendCalls,
    data: callsId,
    isPending: isSending,
    error: sendError,
    reset: resetSendCalls,
  } = useSendCalls();

  const { data: callsStatus } = useCallsStatus({
    id: callsId?.id ?? "",
    query: {
      enabled: !!callsId?.id,
      refetchInterval: (data) =>
        data.state.data?.status === "success" ? false : 1000,
    },
  });

  // ==========================================
  // SYNC WITH BACKEND (Server Action)
  // ==========================================
  const syncWithBackend = useCallback(
    async (txHash: string) => {
      if (!address || !fid) return;

      try {
        // Use Server Action instead of API route
        // This automatically revalidates cache via revalidatePath
        const result = await purchaseGameTicket({
          gameId,
          fid,
          txHash,
          paidAmount: price,
          payerWallet: address,
        });

        if (!result.success) {
          // Handle verification failure specifically
          if (result.code === "VERIFICATION_FAILED") {
            // On-chain verification failed - do NOT mark as success
            console.error(
              "[useTicketPurchase] Verification failed:",
              result.error,
            );
            notify.error(result.error || "Payment verification failed");
            setState({ step: "error", error: result.error });
            return;
          }
          throw new Error(result.error || "Sync failed");
        }

        setState({ step: "success", txHash });
        playSound("purchase");
        notify.success("Ticket purchased! 🎉");
        sdk.haptics.impactOccurred("medium").catch(() => {});
        refetchEntry();
        router.refresh(); // Extra client-side refresh for immediate update
        onSuccess?.();
      } catch (err) {
        console.error("[useTicketPurchase] Sync error:", err);
        const errorMsg = err instanceof Error ? err.message : "Sync failed";
        // Don't mark as success if we have an actual error
        notify.error(errorMsg);
        setState({ step: "error", error: errorMsg });
      }
    },
    [address, fid, gameId, price, refetchEntry, router, onSuccess],
  );

  // ==========================================
  // EFFECTS
  // ==========================================
  useEffect(() => {
    if (isSending && state.step !== "pending") {
      setState({ step: "pending" });
    }
  }, [isSending, state.step]);

  useEffect(() => {
    if (sendError) {
      const msg = sendError.message.includes("rejected")
        ? "Transaction rejected"
        : sendError.message.includes("insufficient")
          ? "Insufficient funds"
          : "Transaction failed";
      setState({ step: "error", error: msg });
      notify.error(msg);
    }
  }, [sendError]);

  useEffect(() => {
    console.log("[DEBUG] callsStatus changed:", {
      status: callsStatus?.status,
      receipts: callsStatus?.receipts?.length,
      callsId: callsId?.id,
    });

    if (!callsStatus) return;

    if (callsStatus.status === "pending" && state.step === "pending") {
      console.log("[DEBUG] Status: confirming");
      setState({ step: "confirming" });
    }

    if (callsStatus.status === "failure") {
      console.log("[DEBUG] Status: failure", callsStatus);
      setState({ step: "error", error: "Transaction failed on-chain" });
      notify.error("Transaction failed. Check your balance.");
    }

    if (callsStatus.status === "success") {
      console.log("[DEBUG] Status: success, receipts:", callsStatus.receipts);
      const txHash =
        callsStatus.receipts?.[callsStatus.receipts.length - 1]
          ?.transactionHash;
      console.log("[DEBUG] Extracted txHash:", txHash);
      setState({ step: "syncing", txHash });
      if (txHash) {
        syncWithBackend(txHash);
      } else {
        console.error("[DEBUG] No txHash found in receipts!");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callsStatus]);

  // ==========================================
  // PURCHASE ACTION
  // ==========================================
  const purchase = useCallback(async () => {
    if (!onchainId) {
      notify.error("Game not available");
      return;
    }

    if (hasTicket) {
      notify.error("You already have a ticket");
      return;
    }

    // Connect wallet if needed
    if (!isConnected || !address) {
      setState({ step: "connecting" });
      try {
        // await connectAsync({ connector: farcasterFrame() });
        setState({ step: "idle" });
        notify.info("Wallet connected! Tap again to buy.");
        return;
      } catch {
        setState({ step: "error", error: "Connection failed" });
        notify.error("Failed to connect wallet");
        return;
      }
    }

    if (calls.length === 0) {
      console.log("[DEBUG] No calls built, cannot proceed");
      notify.error("Not ready. Please wait...");
      return;
    }

    console.log("[DEBUG] Starting purchase:", {
      callsCount: calls.length,
      address,
      onchainId,
      price,
    });

    resetSendCalls();
    setState({ step: "pending" });

    try {
      console.log("[DEBUG] Calling sendCalls...");
      sendCalls({ calls, capabilities: { atomicBatch: { supported: true } } });
      console.log("[DEBUG] sendCalls returned");
    } catch (err) {
      console.error("[DEBUG] sendCalls threw error:", err);
      setState({ step: "error", error: "Transaction failed" });
      notify.error("Transaction failed");
    }
  }, [
    address,
    isConnected,
    onchainId,
    hasTicket,
    calls,
    sendCalls,
    connectAsync,
    resetSendCalls,
  ]);

  const reset = useCallback(() => {
    resetSendCalls();
    setState({ step: "idle" });
  }, [resetSendCalls]);

  // ==========================================
  // RETURN
  // ==========================================
  return {
    state,
    step: state.step,
    error: state.error,
    txHash: state.txHash,

    isIdle: state.step === "idle",
    isConnecting: state.step === "connecting",
    isPending: state.step === "pending",
    isConfirming: state.step === "confirming",
    isSyncing: state.step === "syncing",
    isSuccess: state.step === "success",
    isError: state.step === "error",
    isLoading: ["connecting", "pending", "confirming", "syncing"].includes(
      state.step,
    ),

    hasTicket,
    isLoadingEntry,
    needsApproval,
    entry,

    purchase,
    reset,
    refetchEntry,
  };
}

// ==========================================
// BUTTON TEXT HELPER
// ==========================================
export function getPurchaseButtonText(
  step: PurchaseStep,
  price: number,
): string {
  const texts: Record<PurchaseStep, string> = {
    idle: `BUY WAFFLE - $${price}`,
    connecting: "CONNECTING...",
    pending: "CONFIRM IN WALLET...",
    confirming: "CONFIRMING...",
    syncing: "FINALIZING...",
    success: "PURCHASED! ✓",
    error: "TRY AGAIN",
  };
  return texts[step] ?? `BUY WAFFLE - $${price}`;
}
