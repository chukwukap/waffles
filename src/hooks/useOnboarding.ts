"use client";

import { useCallback, useEffect, useState } from "react";
import { syncUserAction } from "@/actions/onboarding";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useAccount } from "wagmi";
import { useLocalStorage } from "./useLocalStorage";

const ONBOARDING_STORAGE_KEY = "waffles:onboarded:v16.1";

export function useOnboarding() {
  const { address } = useAccount();
  const { context: miniKitContext } = useMiniKit();
  const fid = miniKitContext?.user?.fid;
  const pfpUrl = miniKitContext?.user?.pfpUrl;
  const username = miniKitContext?.user?.username;

  // --- use useLocalStorage instead of hand-rolled state/effect ---
  const [isOnboarded, setIsOnboarded] = useLocalStorage<boolean>(
    ONBOARDING_STORAGE_KEY,
    false
  );

  // The useLocalStorage hook isReady if it can access window (on client)
  // We assume useLocalStorage always returns a value after hydration, no explicit isReady is exposed,
  // but for SplashScreen UX, we can consider it "ready" after hydration, which matches useLocalStorage load timing.
  // If you want to add further suspense for SSR hydration, adapt here if needed. For this rewrite, just always set true.
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  const completeOnboarding = useCallback(async () => {
    try {
      setIsOnboarded(true);
    } catch (err) {
      console.warn(
        "Failed to save onboarding status to localStorage via hook:",
        err
      );
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
            result.user.inviteCode
          );
        }
      } catch (err) {
        console.error("Unexpected error during user sync:", err);
        throw err;
      }
    } else {
      console.warn("Cannot sync user profile: Missing FID.");
    }

    // No need to setIsOnboarded(true) here again, as above already does it.
  }, [fid, username, pfpUrl, address, setIsOnboarded]);

  return {
    isReady,
    isOnboarded,
    shouldShowOnboarding: isReady && !isOnboarded,
    completeOnboarding,
  };
}
