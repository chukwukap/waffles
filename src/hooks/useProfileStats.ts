"use client";

import useSWR from "swr";
import sdk from "@farcaster/miniapp-sdk";
import { useMiniKit } from "@coinbase/onchainkit/minikit";

// ==========================================
// TYPES
// ==========================================

export interface ProfileStats {
  totalGames: number;
  wins: number;
  winRate: number;
  totalWon: number;
  highestScore: number;
  avgScore: number;
  currentStreak: number;
  bestRank: number | null;
}

// ==========================================
// FETCHER
// ==========================================

async function fetchStats(url: string): Promise<ProfileStats | null> {
  const res = await sdk.quickAuth.fetch(url, { cache: "no-store" });

  if (res.status === 404 || res.status === 401) {
    return null;
  }

  if (!res.ok) {
    throw new Error(`Failed to fetch stats: ${res.status}`);
  }

  return res.json();
}

// ==========================================
// HOOK
// ==========================================

/**
 * Fetch profile stats with SWR caching.
 * Uses /api/v1/me/stats endpoint.
 */
export function useProfileStats() {
  const { context } = useMiniKit();
  const fid = context?.user?.fid;

  const { data, error, isLoading, mutate } = useSWR<ProfileStats | null>(
    fid ? "/api/v1/me/stats" : null,
    fetchStats,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 10000,
    }
  );

  return {
    stats: data ?? null,
    isLoading,
    error: error ? "Failed to load stats" : null,
    refetch: mutate,
  };
}
