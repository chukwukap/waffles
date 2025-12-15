import { useMiniKit } from "@coinbase/onchainkit/minikit";
import sdk from "@farcaster/miniapp-sdk";
import { useState, useCallback, useEffect, useRef } from "react";

// Custom event for onboarding completion
export const ONBOARDING_COMPLETE_EVENT = "waffles:onboarding-complete";

export interface UserData {
  fid: number;
  username: string | null;
  pfpUrl: string | null;
  wallet: string | null;
  waitlistPoints: number;
  rank: number;
  invitesCount: number;
  status: string;
}

export function useUser() {
  const { context } = useMiniKit();
  const fid = context?.user?.fid;
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasLoaded = useRef(false);

  const fetchUser = useCallback(async () => {
    if (!fid) {
      // Don't set loading to false yet - wait for fid to be available
      return;
    }
    try {
      // Only set loading if we haven't loaded data yet
      if (!hasLoaded.current) setIsLoading(true);

      // Use authenticated fetch to get current user's data
      const response = await sdk.quickAuth.fetch(`/api/v1/me`, {
        cache: "no-store",
      });

      // 404/401 = user not in DB yet (new user, needs to join waitlist)
      // This is NOT an error - it's the expected state before onboarding
      if (response.status === 404 || response.status === 401) {
        setUser(null);
        setError(null);
        hasLoaded.current = true;
        return;
      }

      if (!response.ok) throw new Error("Failed to fetch user");

      const json: UserData = await response.json();
      setUser(json);
      setError(null);
      hasLoaded.current = true;
    } catch (err) {
      console.error(err);
      setError("Failed to load user data");
    } finally {
      setIsLoading(false);
    }
  }, [fid]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Listen for onboarding completion to refetch user data
  useEffect(() => {
    const handleOnboardingComplete = () => {
      hasLoaded.current = false; // Reset so we show loader briefly
      fetchUser();
    };

    window.addEventListener(ONBOARDING_COMPLETE_EVENT, handleOnboardingComplete);
    return () => {
      window.removeEventListener(ONBOARDING_COMPLETE_EVENT, handleOnboardingComplete);
    };
  }, [fetchUser]);

  return { user, isLoading, error, refetch: fetchUser };
}
