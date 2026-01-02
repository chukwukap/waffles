"use client";

import useSWRInfinite from "swr/infinite";
import sdk from "@farcaster/miniapp-sdk";
import { LeaderboardEntry } from "@/lib/types";

// ==========================================
// TYPES
// ==========================================

export type TabKey = "current" | "allTime" | "game";

interface LeaderboardResponse {
  users: LeaderboardEntry[];
  hasMore: boolean;
  totalPlayers?: number;
  totalPoints?: number;
}

// ==========================================
// FETCHER
// ==========================================

async function fetcher(url: string): Promise<LeaderboardResponse> {
  const res = await sdk.quickAuth.fetch(url, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`Failed to fetch leaderboard: ${res.status}`);
  }

  return res.json();
}

// ==========================================
// HOOK
// ==========================================

/**
 * Fetch leaderboard with SWR infinite loading
 *
 * @param tab - "current" | "allTime" | "game"
 * @param gameId - Optional game ID for specific game leaderboard
 */
export function useLeaderboard(tab: TabKey, gameId?: number) {
  // Build SWR key based on tab and gameId
  const getKey = (
    pageIndex: number,
    previousPageData: LeaderboardResponse | null
  ) => {
    // Reached the end
    if (previousPageData && !previousPageData.hasMore) return null;

    // Build query string
    const params = new URLSearchParams();
    params.set("page", pageIndex.toString());

    if (gameId) {
      params.set("gameId", gameId.toString());
    } else {
      params.set("tab", tab);
    }

    return `/api/v1/leaderboard?${params.toString()}`;
  };

  const { data, error, size, setSize, isLoading, isValidating, mutate } =
    useSWRInfinite<LeaderboardResponse>(getKey, fetcher, {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30000, // 30s
    });

  // Flatten all pages into single entries array
  const entries = data ? data.flatMap((page) => page.users) : [];
  const hasMore = data?.[data.length - 1]?.hasMore ?? false;
  const totalPlayers = data?.[0]?.totalPlayers;

  return {
    entries,
    hasMore,
    totalPlayers,
    loadMore: () => setSize(size + 1),
    isLoading,
    isLoadingMore: isValidating && data && data.length > 0,
    error: error ? "Failed to load leaderboard" : null,
    refresh: mutate,
  };
}
