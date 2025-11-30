"use client";

import { useCallback, useEffect, useState } from "react";
import { syncUserAction } from "@/actions/onboarding";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useAccount } from "wagmi";

export function useOnboarding() {
  const { address } = useAccount();
  const { context: miniKitContext } = useMiniKit();
  const fid = miniKitContext?.user?.fid;
  const pfpUrl = miniKitContext?.user?.pfpUrl;
  const username = miniKitContext?.user?.username;

  const [isReady, setIsReady] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  // Check onboarding status from database
  useEffect(() => {
    async function checkOnboardingStatus() {
      if (!fid) {
        // Wait for fid to be available
        return;
      }

      try {
        const response = await fetch(`/api/user?fid=${fid}`, {
          cache: "no-store",
        });

        if (response.ok) {
          // User exists in database - they are onboarded
          setIsOnboarded(true);
        } else if (response.status === 404) {
          // User doesn't exist - needs onboarding
          setIsOnboarded(false);
        } else {
          console.error("Failed to check onboarding status:", response.status);
          setIsOnboarded(false);
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error);
        setIsOnboarded(false);
      } finally {
        setIsCheckingStatus(false);
        setIsReady(true);
      }
    }

    checkOnboardingStatus();
  }, [fid]);

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

    try {
      const result = await syncUserAction({
        fid: fid,
        username: username,
        pfpUrl: pfpUrl,
        wallet: address,
      });

      if (!result.success) {
        console.error("User sync failed during onboarding:", result.error);
        throw new Error(result.error || "User sync failed");
      }

      console.log(
        "User sync successful:",
        result.user,
        "Referral:",
        result.user.inviteCode
      );

      // Mark as onboarded after successful database sync
      setIsOnboarded(true);
    } catch (err) {
      console.error("Unexpected error during user sync:", err);
      throw err;
    }
  }, [fid, username, pfpUrl, address]);

  return {
    isReady: isReady && !isCheckingStatus,
    isOnboarded,
    shouldShowOnboarding: isReady && !isCheckingStatus && !isOnboarded,
    completeOnboarding,
  };
}
