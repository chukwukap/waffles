"use client";

import { useState, useEffect, useCallback } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useAccount } from "wagmi";
import sdk from "@farcaster/miniapp-sdk";
import { syncUserAction } from "@/actions/onboarding";

type Status = "loading" | "needs_onboarding" | "ready";

/**
 * Simple onboarding hook.
 * Checks if user exists, provides function to complete onboarding.
 */
export function useOnboarding() {
  const { address } = useAccount();
  const { context } = useMiniKit();
  const fid = context?.user?.fid;
  const pfpUrl = context?.user?.pfpUrl;
  const username = context?.user?.username;

  const [status, setStatus] = useState<Status>("loading");

  // Check if user exists in DB
  useEffect(() => {
    if (!fid) return;

    async function check() {
      try {
        const res = await sdk.quickAuth.fetch("/api/v1/me", { cache: "no-store" });
        setStatus(res.ok ? "ready" : "needs_onboarding");
      } catch {
        setStatus("needs_onboarding");
      }
    }
    check();
  }, [fid]);

  // Create user in DB
  const completeOnboarding = useCallback(async () => {
    if (!fid) throw new Error("No FID");

    const result = await syncUserAction({ fid, username, pfpUrl, wallet: address });
    if (!result.success) throw new Error(result.error || "Sync failed");

    setStatus("ready");
  }, [fid, username, pfpUrl, address]);

  return {
    isLoading: status === "loading",
    needsOnboarding: status === "needs_onboarding",
    completeOnboarding,
  };
}
