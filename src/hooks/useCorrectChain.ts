import { useCallback } from "react";
import { useSwitchChain, useChainId } from "wagmi";
import { chain } from "@/lib/chain";
import { env } from "@/lib/env";

/**
 * Hook to ensure the wallet is on the correct chain before performing actions.
 *
 * In test mode, OnchainKit defaults to Base mainnet. This hook switches
 * to the correct chain (e.g., Base Sepolia) before wallet actions.
 *
 * Usage:
 * ```ts
 * const { ensureCorrectChain, isOnCorrectChain } = useCorrectChain();
 *
 * const handleAction = async () => {
 *   await ensureCorrectChain();
 *   // Now safe to perform action
 * };
 * ```
 */
export function useCorrectChain() {
  const currentChainId = useChainId();
  const { switchChainAsync } = useSwitchChain();

  const isOnCorrectChain = currentChainId === chain.id;
  const isTestMode = env.isTestMode;

  const ensureCorrectChain = useCallback(async () => {
    // Only switch if we're on wrong chain
    if (currentChainId !== chain.id) {
      console.log(
        `[Chain] Switching from ${currentChainId} to ${chain.id} (${chain.name})`,
      );
      await switchChainAsync({ chainId: chain.id });
    }
  }, [currentChainId, switchChainAsync]);

  return {
    ensureCorrectChain,
    isOnCorrectChain,
    currentChainId,
    targetChainId: chain.id,
    isTestMode,
  };
}
