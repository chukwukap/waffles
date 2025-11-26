import { useState, useEffect } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";

export function useMutuals(options?: { context?: string; gameId?: number }) {
  const { context: miniKitContext } = useMiniKit();
  const fid = miniKitContext?.user?.fid;
  const [data, setData] = useState<{
    mutuals: Array<{ fid: number; pfpUrl: string | null }>;
    mutualCount: number;
    totalCount: number;
  } | null>(null);

  const context = options?.context || "waitlist";
  const gameId = options?.gameId;

  useEffect(() => {
    if (!fid) return;

    const url = gameId
      ? `/api/mutuals?fid=${fid}&gameId=${gameId}&context=${context}`
      : `/api/mutuals?fid=${fid}&context=${context}`;

    fetch(url)
      .then((res) => (res.ok ? res.json() : null))
      .then(setData)
      .catch(console.error);
  }, [fid, context, gameId]);

  return data;
}
