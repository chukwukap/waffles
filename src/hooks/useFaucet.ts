"use client";

import { useState, useCallback } from "react";
import { chain } from "@/lib/chain";

interface FaucetState {
  isLoading: boolean;
  isSuccess: boolean;
  error: string | null;
  txHash: string | null;
}

/**
 * Hook for requesting test tokens from the faucet.
 * Only works in test mode - returns noop in production.
 */
export function useFaucet() {
  const [state, setState] = useState<FaucetState>({
    isLoading: false,
    isSuccess: false,
    error: null,
    txHash: null,
  });

  const requestTokens = useCallback(async (wallet: string) => {
    // Block in production (only allow on testnet)
    if (!chain.testnet) {
      console.log("[Faucet] Blocked - not in test mode");
      return { success: false, error: "Not in test mode" };
    }

    setState({ isLoading: true, isSuccess: false, error: null, txHash: null });

    try {
      const response = await fetch("/api/v1/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet }),
      });

      const data = await response.json();

      if (!response.ok) {
        setState({
          isLoading: false,
          isSuccess: false,
          error: data.error || "Failed to get tokens",
          txHash: null,
        });
        return { success: false, error: data.error };
      }

      setState({
        isLoading: false,
        isSuccess: true,
        error: null,
        txHash: data.txHash,
      });

      return { success: true, txHash: data.txHash };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setState({
        isLoading: false,
        isSuccess: false,
        error: errorMessage,
        txHash: null,
      });
      return { success: false, error: errorMessage };
    }
  }, []);

  const reset = useCallback(() => {
    setState({ isLoading: false, isSuccess: false, error: null, txHash: null });
  }, []);

  return {
    ...state,
    requestTokens,
    reset,
    isTestMode: chain.testnet,
  };
}
