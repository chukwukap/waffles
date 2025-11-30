import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useState, useCallback, useEffect, useRef } from "react";
import { User } from "../../prisma/generated/client";

export interface UserData extends User {
  rank: number;
  invitesCount: number;
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

      const response = await fetch(`/api/user?fid=${fid}`, {
        cache: "no-store",
      });

      if (!response.ok) throw new Error("Failed to fetch user");

      const json: UserData = await response.json();
      console.log(json);
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
