import { useMiniKit } from "@coinbase/onchainkit/minikit";
import sdk from "@farcaster/miniapp-sdk";
import { useState, useCallback, useEffect } from "react";

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

/**
 * Simple user data hook.
 * 404/401 = user doesn't exist yet (returns null, not an error).
 */
export function useUser() {
  const { context } = useMiniKit();
  const fid = context?.user?.fid;

  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    if (!fid) return;

    setIsLoading(true);
    try {
      const res = await sdk.quickAuth.fetch("/api/v1/me", { cache: "no-store" });

      // 404/401 = not in DB yet (expected for new users)
      if (res.status === 404 || res.status === 401) {
        setUser(null);
        setError(null);
      } else if (res.ok) {
        setUser(await res.json());
        setError(null);
      } else {
        throw new Error("Fetch failed");
      }
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
