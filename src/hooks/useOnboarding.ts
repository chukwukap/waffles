"use client";

import { useCallback, useEffect, useState } from "react";
import { syncUserAction } from "@/actions/onboarding";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useAccount } from "wagmi";

const ONBOARDING_STORAGE_KEY = "waffles:onboarded:v12.7";

export function useOnboarding() {
  const { address } = useAccount();
  const [isOnboarded, setIsOnboarded] = useState<boolean>(true);
  const [isReady, setIsReady] = useState<boolean>(false);
  const { context: miniKitContext } = useMiniKit();
  const fid = miniKitContext?.user?.fid;
  const pfpUrl = miniKitContext?.user?.pfpUrl;
  const username = miniKitContext?.user?.username;
  useEffect(() => {
    let status = true;
    try {
      if (typeof window !== "undefined") {
        const stored = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
        status = stored === "true";
      }
    } catch (err) {
      console.warn("Could not access localStorage for onboarding status:", err);
      status = false;
    } finally {
      setIsOnboarded(status);
      setIsReady(true);
    }
  }, []);

  const completeOnboarding = useCallback(async () => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
      }
    } catch (err) {
      console.warn("Failed to save onboarding status to localStorage:", err);
    }

    if (fid) {
      console.log("Syncing user profile after onboarding:", {
        fid,
        username,
        pfpUrl,
        wallet: address,
      });
      try {
        const result = await syncUserAction({
          fid: fid,
          username: username,
          pfpUrl: pfpUrl,
          wallet: address,
        });

        if (!result.success) {
          console.error("User sync failed during onboarding:", result.error);
        } else {
          console.log(
            "User sync successful:",
            result.user,
            "Referral:",
            result.referral.code
          );
        }
      } catch (err) {
        console.error("Unexpected error during user sync:", err);
        throw err;
      }
    } else {
      console.warn("Cannot sync user profile: Missing FID.");
    }

    setIsOnboarded(true);
  }, [fid, username, pfpUrl, address]);

  return {
    isReady,
    isOnboarded,
    shouldShowOnboarding: isReady && !isOnboarded,
    completeOnboarding,
  };
}
