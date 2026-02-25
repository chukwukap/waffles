import { useState, useEffect } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import sdk from "@farcaster/miniapp-sdk";

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

  const context = options?.context || "game";
  const gameId = options?.gameId;
  const limit = options?.limit;

  useEffect(() => {
    if (!fid) return;

    // Build URL for v1 endpoint
    let url = `/api/v1/users/${fid}/mutuals?context=${context}`;
    if (gameId) url += `&gameId=${gameId}`;
    if (limit) url += `&limit=${limit}`;

    // Use authenticated fetch
    sdk.quickAuth
      .fetch(url)
      .then((res) => (res.ok ? res.json() : null))
      .then((response) => {
        if (response) {
          setData({
            mutuals: response.mutuals || [],
            mutualCount: response.count || 0,
            totalCount: response.count || 0,
          });
        }
      })
      .catch(console.error);
  }, [fid, context, gameId, limit]);

  return data;
}
