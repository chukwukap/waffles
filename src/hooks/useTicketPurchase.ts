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
import { WAFFLE_GAME_CONFIG, TOKEN_CONFIG } from "@/lib/chain";
import { ERC20_ABI } from "@/lib/constants";
import { purchaseGameTicket } from "@/actions/game";

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
  onSuccess?: () => void
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
    () => parseUnits(price.toString(), TOKEN_CONFIG.decimals),
    [price]
  );

  const tokenAddress = TOKEN_CONFIG.address;
  const { data: allowance } = useTokenAllowance(
    address as `0x${string}`,
    tokenAddress
  );

  const needsApproval = useMemo(() => {
    if (!allowance) return true;
    return (allowance as bigint) < priceInUnits;
  }, [allowance, priceInUnits]);

  // ==========================================
  // BUILD TRANSACTION CALLS
  // ==========================================
  const calls = useMemo(() => {
    if (!tokenAddress || !onchainId) return [];

    const callList: Array<{ to: `0x${string}`; data: `0x${string}` }> = [];

    if (needsApproval) {
      callList.push({
        to: tokenAddress,
        data: encodeFunctionData({
          abi: ERC20_ABI,
          functionName: "approve",
          args: [
            WAFFLE_GAME_CONFIG.address,
            parseUnits("5000", TOKEN_CONFIG.decimals),
          ],
        }),
      });
    }

    callList.push({
      to: WAFFLE_GAME_CONFIG.address,
      data: encodeFunctionData({
        abi: waffleGameAbi,
        functionName: "buyTicket",
        args: [onchainId, priceInUnits],
      }),
    });

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
        // On-chain succeeded, backend failed - still mark success
        notify.info("Purchased! Syncing in background...");
        setState({ step: "success", txHash });
        refetchEntry();
        router.refresh();
        onSuccess?.();
      }
    },
    [address, fid, gameId, price, refetchEntry, router, onSuccess]
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
    if (!callsStatus) return;

    if (callsStatus.status === "pending" && state.step === "pending") {
      setState({ step: "confirming" });
    }

    if (callsStatus.status === "failure") {
      setState({ step: "error", error: "Transaction failed on-chain" });
      notify.error("Transaction failed. Check your balance.");
    }

    if (callsStatus.status === "success") {
      const txHash =
        callsStatus.receipts?.[callsStatus.receipts.length - 1]
          ?.transactionHash;
      setState({ step: "syncing", txHash });
      if (txHash) syncWithBackend(txHash);
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
        await connectAsync({ connector: farcasterFrame() });
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
      notify.error("Not ready. Please wait...");
      return;
    }

    resetSendCalls();
    setState({ step: "pending" });

    try {
      sendCalls({ calls, capabilities: { atomicBatch: { supported: true } } });
    } catch {
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
      state.step
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
  price: number
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
