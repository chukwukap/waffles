import { useState, useCallback, useEffect, useRef } from "react";

export interface WaitlistData {
  onList: boolean;
  rank: number | null;
  invites: number;
  status: string;
}

export function useWaitlistData(fid?: number) {
  const [data, setData] = useState<WaitlistData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasLoaded = useRef(false);

  const fetchData = useCallback(async () => {
    if (!fid) {
      setIsLoading(false);
      return;
    }
    try {
      // Only set loading if we haven't loaded data yet
      if (!hasLoaded.current) setIsLoading(true);

      const response = await fetch(`/api/waitlist?fid=${fid}`, {
        cache: "no-store", // Ensure fresh data
      });
      if (!response.ok) throw new Error("Failed to fetch");
      const json: WaitlistData = await response.json();
      console.log("waitlist data: ", json);
      setData(json);
      hasLoaded.current = true;
    } catch (err) {
      console.error(err);
      setError("Failed to load waitlist data");
    } finally {
      setIsLoading(false);
    }
  }, [fid]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData, setData };
}
