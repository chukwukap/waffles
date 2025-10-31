"use client";

import { useCallback, useEffect, useState } from "react";
import { useMiniUser } from "@/hooks/useMiniUser";
import { syncUserAction } from "@/actions/onboarding";

const ONBOARDING_STORAGE_KEY = "waffles:onboarded:v8.1";

export function useOnboarding() {
  const [isOnboarded, setIsOnboarded] = useState<boolean>(true);
  const [isReady, setIsReady] = useState<boolean>(false);
  const { fid, username, pfpUrl, wallet } = useMiniUser();

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
        wallet,
      });
      try {
        const result = await syncUserAction({
          fid: fid,
          username: username,
          pfpUrl: pfpUrl,
          wallet: wallet,
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
  }, [fid, username, pfpUrl, wallet]);

  return {
    isReady,
    isOnboarded,
    shouldShowOnboarding: isReady && !isOnboarded,
    completeOnboarding,
  };
}
