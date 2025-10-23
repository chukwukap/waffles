"use client";

import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useAccount } from "wagmi";

/**
 * Merges Farcaster + wallet identity into one consistent hook.
 */
export function useMiniUser() {
  const { context, isMiniAppReady } = useMiniKit();
  const { address, isConnected } = useAccount();

  const user = {
    fid: context?.user?.fid ?? null,
    username: context?.user?.username ?? "",
    pfpUrl: context?.user?.pfpUrl ?? "",
    wallet: address ?? "",
    isConnected,
    isMiniAppReady,
  };

  return user;
}
