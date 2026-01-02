"use client";

import useSWR from "swr";
import sdk from "@farcaster/miniapp-sdk";
import { useMiniKit } from "@coinbase/onchainkit/minikit";

// ==========================================
// TYPES
// ==========================================

export interface ProfileGame {
  id: number;
  gameId: number;
  score: number;
  rank: number;
  paidAt: string | null;
  claimedAt: string | null;
  answeredQuestions: number;
  game: {
    id: number;
    title: string;
    theme: string;
    startsAt: string;
    endsAt: string;
    status: "SCHEDULED" | "LIVE" | "ENDED";
    prizePool: number;
    totalQuestions: number;
    playersCount: number;
  };
}

// ==========================================
// FETCHER
// ==========================================

async function fetchGames(url: string): Promise<ProfileGame[]> {
  const res = await sdk.quickAuth.fetch(url, { cache: "no-store" });

  if (res.status === 404 || res.status === 401) {
    return [];
  }

  if (!res.ok) {
    throw new Error(`Failed to fetch games: ${res.status}`);
  }

  return res.json();
}

// ==========================================
// HOOK
// ==========================================

/**
 * Fetch user's game history with SWR caching.
 * Uses existing /api/v1/me/games endpoint.
 *
 * @param limit - Optional limit for number of games (client-side slicing)
 */
export function useProfileGames(limit?: number) {
  const { context } = useMiniKit();
  const fid = context?.user?.fid;

  const { data, error, isLoading, mutate } = useSWR<ProfileGame[]>(
    fid ? "/api/v1/me/games" : null,
    fetchGames,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 10000,
    }
  );

  // Apply limit client-side (API returns all games)
  const games = data ?? [];
  const limitedGames = limit ? games.slice(0, limit) : games;

  return {
    games: limitedGames,
    allGames: games,
    isLoading,
    error: error ? "Failed to load games" : null,
    refetch: mutate,
  };
}
