"use client";

import { useCallback, useEffect, useState } from "react";
import { useMiniUser } from "./useMiniUser";
import { useLobby } from "@/state";

const ONBOARDING_STORAGE_KEY = "waffles:onboarded:v1.3";

/**
 * Manages first-time user onboarding state with safe, persistent storage.
 * We intentionally scope persistence to the device (localStorage) to avoid
 * leaking cross-account state and to keep UX snappy without server roundtrips.
 */
export function useOnboarding() {
  const [isOnboarded, setIsOnboarded] = useState<boolean>(true);
  const [isReady, setIsReady] = useState<boolean>(false);
  const { fid, username, pfpUrl, wallet } = useMiniUser();
  const { registerReferralCode, fetchReferralStatus } = useLobby();

  useEffect(() => {
    try {
      const stored =
        typeof window !== "undefined"
          ? window.localStorage.getItem(ONBOARDING_STORAGE_KEY)
          : null;
      setIsOnboarded(stored === "true");
    } catch (_err) {
      console.log(_err);
      // If storage is blocked, default to showing onboarding once
      setIsOnboarded(false);
    } finally {
      setIsReady(true);
    }
  }, []);

  const completeOnboarding = useCallback(async () => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
      }
      if (fid && username) {
        console.log("syncing user", { fid, username, pfpUrl, wallet });
        const res = await fetch("/api/user/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fid, username, pfpUrl, wallet }),
        });
        if (!res.ok) {
          throw new Error("Failed to sync user");
        }
        const data = await res.json();
        if (!data.success) {
          throw new Error("Failed to sync user");
        }
        if (data.referralCode) {
          registerReferralCode({
            code: data.referralCode,
            inviterFarcasterId: String(fid),
            inviteeId: data.referral?.inviteeId,
          });
        }
        await fetchReferralStatus(String(fid));
      }
    } catch (_err) {
      console.error("Failed to sync user", _err);
      // Non-fatal: proceed even if storage fails
    }
    setIsOnboarded(true);
  }, [
    fid,
    username,
    pfpUrl,
    wallet,
    registerReferralCode,
    fetchReferralStatus,
  ]);

  return {
    isReady,
    isOnboarded,
    shouldShowOnboarding: isReady && !isOnboarded,
    // for testing
    // shouldShowOnboarding: true,
    completeOnboarding,
  };
}
