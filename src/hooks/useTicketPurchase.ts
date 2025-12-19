"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import {
  useAccount,
  useSendCalls,
  useCallsStatus,
  useChainId,
  useSwitchChain,
} from "wagmi";
import { parseUnits, encodeFunctionData } from "viem";
import sdk from "@farcaster/miniapp-sdk";

import {
  useHasTicket,
  useTokenAllowance,
  useTokenBalance,
  useContractToken,
} from "./waffleContractHooks";
import {
  TOKEN_CONFIG,
  WAFFLE_GAME_CONFIG,
  CHAIN_CONFIG,
} from "@/lib/contracts/config";
import { notify } from "@/components/ui/Toaster";
import { playSound } from "@/lib/sounds";
import waffleGameAbi from "@/lib/contracts/WaffleGameAbi.json";

// ==========================================
// TYPES
// ==========================================

export type PurchaseStep =
  | "idle"
  | "switching-chain"
  | "pending" // User signing the batch
  | "confirming" // Waiting for on-chain confirmation
  | "syncing" // Syncing with backend
  | "success"
  | "error";

export interface TicketPurchaseState {
  step: PurchaseStep;
  error?: string;
  txHash?: string;
}

// ERC20 approve ABI
const erc20ApproveAbi = [
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
] as const;

// ==========================================
// HOOK: useTicketPurchase
// Uses EIP-5792 useSendCalls for batched approve + buyTicket
// Optimized for Farcaster MiniApp context
// ==========================================

export function useTicketPurchase(
  gameId: number,
  onchainId: `0x${string}` | null | undefined,
  price: number,
  onSuccess?: () => void
) {
  const { address, isConnected } = useAccount();
  const currentChainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const [state, setState] = useState<TicketPurchaseState>({ step: "idle" });

  // Derived values
  const priceInUnits = useMemo(
    () => parseUnits(price.toString(), TOKEN_CONFIG.decimals),
    [price]
  );

  // Target chain check
  const isCorrectChain = currentChainId === CHAIN_CONFIG.chainId;

  // Contract reads
  const { data: hasTicket, refetch: refetchHasTicket } = useHasTicket(
    onchainId ?? undefined,
    address
  );

  const { data: allowance } = useTokenAllowance(address);
  const { data: balance } = useTokenBalance(address);

  // Get token address from contract (dynamic, prevents mismatch)
  const { data: contractTokenAddress } = useContractToken();
  const tokenAddress =
    (contractTokenAddress as `0x${string}`) || TOKEN_CONFIG.address;

  // Check if approval is needed
  const needsApproval = useMemo(() => {
    if (!allowance) return true;
    return allowance < priceInUnits;
  }, [allowance, priceInUnits]);

  // Check if user has sufficient balance
  const hasSufficientBalance = useMemo(() => {
    if (!balance) return false;
    return balance >= priceInUnits;
  }, [balance, priceInUnits]);

  // ==========================================
  // BUILD CALLS (approve if needed + buyTicket)
  // ==========================================
  const calls = useMemo(() => {
    if (!onchainId || !address) {
      return [];
    }

    const callList: Array<{ to: `0x${string}`; data: `0x${string}` }> = [];

    // Add approve call only if needed
    if (needsApproval) {
      // Approve 1000 USDC to avoid repeated approvals
      const approvalAmount = parseUnits("1000", TOKEN_CONFIG.decimals);
      console.log(
        "[useTicketPurchase] Adding approve call for 1000 USDC to",
        tokenAddress
      );
      callList.push({
        to: tokenAddress as `0x${string}`,
        data: encodeFunctionData({
          abi: erc20ApproveAbi,
          functionName: "approve",
          args: [WAFFLE_GAME_CONFIG.address, approvalAmount],
        }),
      });
    }

    // Add buyTicket call
    console.log("[useTicketPurchase] Adding buyTicket call");
    callList.push({
      to: WAFFLE_GAME_CONFIG.address as `0x${string}`,
      data: encodeFunctionData({
        abi: waffleGameAbi as any,
        functionName: "buyTicket",
        args: [onchainId, priceInUnits],
      }),
    });

    console.log("[useTicketPurchase] Calls built:", {
      callCount: callList.length,
      needsApproval,
      onchainId,
      price: priceInUnits.toString(),
    });

    return callList;
  }, [onchainId, address, priceInUnits, needsApproval]);

  // ==========================================
  // useSendCalls for batched transactions
  // ==========================================
  const {
    sendCalls,
    data: callsId,
    isPending: isSending,
    error: sendError,
    reset: resetSendCalls,
  } = useSendCalls();

  // Track batch status
  const { data: callsStatus } = useCallsStatus({
    id: callsId?.id ?? "",
    query: {
      enabled: !!callsId?.id,
      refetchInterval: (data) => {
        if (data.state.data?.status === "success") return false;
        return 1000; // Poll every second
      },
    },
  });

  // ==========================================
  // EFFECTS: Handle status changes
  // ==========================================

  // Update state based on send status
  useEffect(() => {
    if (isSending && state.step !== "pending") {
      console.log("[useTicketPurchase] Transaction pending...");
      setState({ step: "pending" });
    }
  }, [isSending, state.step]);

  // Handle send errors
  useEffect(() => {
    if (sendError) {
      console.error("[useTicketPurchase] Send error:", sendError);
      const errorMessage = sendError.message.includes("rejected")
        ? "Transaction rejected by user"
        : sendError.message.includes("insufficient")
        ? "Insufficient funds"
        : "Transaction failed";
      setState({ step: "error", error: errorMessage });
      notify.error(errorMessage);
    }
  }, [sendError]);

  // Handle calls confirmation
  useEffect(() => {
    if (!callsStatus) return;

    console.log(
      "[useTicketPurchase] Calls status:",
      callsStatus.status,
      callsStatus
    );

    if (callsStatus.status === "pending" && state.step === "pending") {
      setState({ step: "confirming" });
    }

    if (callsStatus.status === "failure") {
      console.error(
        "[useTicketPurchase] Transaction batch failed:",
        callsStatus
      );
      const errorMessage = "Transaction failed on-chain. Please try again.";
      setState({ step: "error", error: errorMessage });
      notify.error(errorMessage);
    }

    if (callsStatus.status === "success") {
      // Get transaction hash from receipts
      const txHash =
        callsStatus.receipts?.[callsStatus.receipts.length - 1]
          ?.transactionHash;
      console.log("[useTicketPurchase] Confirmed! TX:", txHash);

      setState({ step: "syncing", txHash });

      // Sync with backend
      syncWithBackend(txHash);
    }
  }, [callsStatus]);

  // ==========================================
  // BACKEND SYNC
  // ==========================================
  const syncWithBackend = useCallback(
    async (txHash?: string) => {
      if (!address) return;

      try {
        console.log("[useTicketPurchase] Syncing with backend...");

        const response = await fetch(`/api/v1/games/${gameId}/entry`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletAddress: address,
            txHash: txHash || "",
            paidAmount: price,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Backend sync failed");
        }

        console.log("[useTicketPurchase] Backend sync successful");

        // Success!
        setState({ step: "success", txHash });
        playSound("purchase");
        notify.success("Ticket purchased! 🎉");

        // Trigger haptic feedback on mobile
        sdk.haptics.impactOccurred("medium").catch(() => {});

        // Refetch ticket status
        refetchHasTicket();

        // Call success callback
        onSuccess?.();
      } catch (error: any) {
        console.error("[useTicketPurchase] Backend sync error:", error);
        // Don't fail the whole purchase - on-chain tx succeeded
        // Just notify and mark as success anyway
        notify.info("Ticket purchased but sync pending. Refresh to update.");
        setState({ step: "success", txHash });
        onSuccess?.();
      }
    },
    [address, gameId, price, refetchHasTicket, onSuccess]
  );

  // ==========================================
  // PURCHASE FUNCTION
  // ==========================================
  const purchase = useCallback(async () => {
    // Pre-flight checks
    if (!isConnected) {
      notify.error("Please connect your wallet");
      return;
    }

    if (!onchainId) {
      notify.error("Game not available on-chain");
      return;
    }

    if (hasTicket) {
      notify.error("You already have a ticket");
      return;
    }

    if (!hasSufficientBalance) {
      notify.error("Insufficient USDC balance");
      return;
    }

    if (calls.length === 0) {
      notify.error("Unable to build transaction");
      return;
    }

    console.log("[useTicketPurchase] Starting purchase...", {
      gameId,
      onchainId,
      price,
      needsApproval,
      callCount: calls.length,
    });

    // Check chain
    if (!isCorrectChain) {
      try {
        console.log("[useTicketPurchase] Switching to correct chain...");
        setState({ step: "switching-chain" });
        await switchChainAsync({ chainId: CHAIN_CONFIG.chainId });
      } catch (error) {
        console.error("[useTicketPurchase] Chain switch failed:", error);
        setState({ step: "error", error: "Failed to switch network" });
        notify.error("Failed to switch to Base Sepolia");
        return;
      }
    }

    // Reset previous state
    resetSendCalls();
    setState({ step: "pending" });

    // Send batched calls
    try {
      console.log("[useTicketPurchase] Sending batched calls...");
      sendCalls({
        calls,
        capabilities: {
          // Request atomic execution if available
          atomicBatch: { supported: true },
        },
      });
    } catch (error: any) {
      console.error("[useTicketPurchase] Send calls error:", error);
      setState({ step: "error", error: "Failed to send transaction" });
      notify.error("Transaction failed");
    }
  }, [
    isConnected,
    onchainId,
    hasTicket,
    hasSufficientBalance,
    calls,
    isCorrectChain,
    gameId,
    price,
    needsApproval,
    switchChainAsync,
    resetSendCalls,
    sendCalls,
  ]);

  // ==========================================
  // RESET FUNCTION
  // ==========================================
  const reset = useCallback(() => {
    resetSendCalls();
    setState({ step: "idle" });
  }, [resetSendCalls]);

  // ==========================================
  // RETURN
  // ==========================================
  return {
    // State
    state,
    step: state.step,
    error: state.error,
    txHash: state.txHash,

    // Derived state
    isIdle: state.step === "idle",
    isPending: state.step === "pending",
    isConfirming: state.step === "confirming",
    isSyncing: state.step === "syncing",
    isSuccess: state.step === "success",
    isError: state.step === "error",
    isLoading: ["switching-chain", "pending", "confirming", "syncing"].includes(
      state.step
    ),

    // Data
    hasTicket: !!hasTicket,
    needsApproval,
    hasSufficientBalance,
    balance,

    // Actions
    purchase,
    reset,
  };
}

// ==========================================
// HELPER: Get button text based on step
// ==========================================
export function getPurchaseButtonText(
  step: PurchaseStep,
  price: number
): string {
  switch (step) {
    case "idle":
      return `BUY WAFFLE - $${price}`;
    case "switching-chain":
      return "SWITCHING NETWORK...";
    case "pending":
      return "CONFIRM IN WALLET...";
    case "confirming":
      return "CONFIRMING...";
    case "syncing":
      return "FINALIZING...";
    case "success":
      return "PURCHASED! ✓";
    case "error":
      return "TRY AGAIN";
    default:
      return `BUY WAFFLE - $${price}`;
  }
}
