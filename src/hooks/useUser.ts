"use client";

import useSWR from "swr";
import { useMiniKit } from "@coinbase/onchainkit/minikit";

import type { User } from "@prisma";

// ==========================================
// TYPES - Derived from Prisma
// ==========================================

export type UserData = Pick<
  User,
  | "id"
  | "fid"
  | "username"
  | "pfpUrl"
  | "wallet"
  | "inviteQuota"
  | "inviteCode"
  | "hasGameAccess"
  | "isBanned"
  | "createdAt"
> & {
  invitesCount: number;
};

// ==========================================
// FETCHER
// ==========================================

async function fetchUser(url: string): Promise<UserData | null> {
  const res = await fetch(url, { cache: "no-store" });

  // 404 = user not in DB yet (expected for new users)
  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error(`Failed to fetch user: ${res.status}`);
  }

  return res.json();
}

// ==========================================
// HOOK: useUser
// ==========================================

/**
 * Fetch current user data with SWR.
 * - Global cache: all components share the same data
 * - Deduplication: multiple calls = single request
 *
 * Loading is true when:
 * - MiniKit context hasn't provided FID yet, OR
 * - SWR is fetching user data
 */
export function useUser() {
  const { context } = useMiniKit();
  const fid = context?.user?.fid;

  const { data, error, isLoading: swrLoading, mutate } = useSWR<UserData | null>(
    fid ? `/api/v1/users/${fid}` : null,
    fetchUser,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 5000,
    }
  );

  // Waiting for MiniKit context (no FID yet) = loading
  // SWR actively fetching = loading
  const isLoading = !fid || swrLoading;

  return {
    user: data ?? null,
    isLoading,
    error: error ? "Failed to load user" : null,
    refetch: mutate,
  };
}
