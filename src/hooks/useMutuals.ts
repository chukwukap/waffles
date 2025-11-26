import { useState, useEffect } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";

export function useMutuals() {
  const { context } = useMiniKit();
  const fid = context?.user?.fid;
  const [data, setData] = useState<{
    mutuals: Array<{ fid: number; pfpUrl: string | null }>;
    mutualCount: number;
    totalCount: number;
  } | null>(null);

  useEffect(() => {
    if (!fid) return;
    fetch(`/api/mutuals?fid=${fid}&context=waitlist`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setData)
      .catch(console.error);
  }, [fid]);

  return data;
}
