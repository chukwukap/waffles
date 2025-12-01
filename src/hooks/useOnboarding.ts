"use client";

import { useCallback } from "react";
import { syncUserAction } from "@/actions/onboarding";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useAccount } from "wagmi";
import { useLocalStorage } from "@/hooks/useLocalStorage";

const ONBOARDING_STORAGE_KEY = "waffles:onboarded:v1";

export function useOnboarding() {
  const { address } = useAccount();
  const { context: miniKitContext } = useMiniKit();
  const fid = miniKitContext?.user?.fid;
  const pfpUrl = miniKitContext?.user?.pfpUrl;
  const username = miniKitContext?.user?.username;

  // Use localStorage for instant check
  const [isOnboarded, setIsOnboarded] = useLocalStorage<boolean>(
    ONBOARDING_STORAGE_KEY,
    false
  );

  // We are "ready" as soon as we've read from localStorage (which happens on mount)
  // Since useLocalStorage initializes synchronously if possible, we can consider it ready immediately
  // or just use a simple true here since we don't have async checks anymore.
  const isReady = true;

  const completeOnboarding = useCallback(async () => {
    if (!fid) {
      console.warn("Cannot sync user profile: Missing FID.");
      return;
    }

    console.log("Syncing user profile after onboarding:", {
      fid,
      username,
      pfpUrl,
      wallet: address,
    });

    // Optimistically mark as onboarded
    setIsOnboarded(true);

    try {
      const result = await syncUserAction({
        fid: fid,
        username: username,
        pfpUrl: pfpUrl,
        wallet: address,
      });

      if (!result.success) {
        console.error("User sync failed during onboarding:", result.error);
        // If sync fails, we might want to revert, but for now let's keep it optimistic
        // to avoid jarring UI flips. The user can try again if they reload.
        // Or we could revert: setIsOnboarded(false);
        throw new Error(result.error || "User sync failed");
      }

      console.log(
        "User sync successful:",
        result.user,
        "Referral:",
        result.user.inviteCode
      );
    } catch (err) {
      console.error("Unexpected error during user sync:", err);
      // Revert optimistic update on error so user can try again
      setIsOnboarded(false);
      throw err;
    }
  }, [fid, username, pfpUrl, address, setIsOnboarded]);

  return {
    isReady,
    isOnboarded,
    shouldShowOnboarding: isReady && !isOnboarded,
    completeOnboarding,
  };
}
