import { useState, useEffect } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";

export function useMutuals(options?: {
  context?: string;
  gameId?: number;
  limit?: number;
}) {
  const { context: miniKitContext } = useMiniKit();
  const fid = miniKitContext?.user?.fid;
  const [data, setData] = useState<{
    mutuals: Array<{ fid: number; pfpUrl: string | null }>;
    mutualCount: number;
    totalCount: number;
  } | null>(null);

  const context = options?.context || "waitlist";
  const gameId = options?.gameId;
  const limit = options?.limit;

  useEffect(() => {
    if (!fid) return;

    let url = `/api/mutuals?fid=${fid}&context=${context}`;
    if (gameId) url += `&gameId=${gameId}`;
    if (limit) url += `&limit=${limit}`;

    fetch(url)
      .then((res) => (res.ok ? res.json() : null))
      .then(setData)
      .catch(console.error);
  }, [fid, context, gameId, limit]);

  return data;
}
