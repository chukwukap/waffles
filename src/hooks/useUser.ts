import { useMiniKit, useQuickAuth } from "@coinbase/onchainkit/minikit";
import sdk from "@farcaster/miniapp-sdk";
import { useState, useCallback, useEffect, useRef } from "react";

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

      if (!response.ok) throw new Error("Failed to fetch user");

      const json: UserData = await response.json();
      setUser(json);
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

  return { user, isLoading, error, refetch: fetchUser };
}
