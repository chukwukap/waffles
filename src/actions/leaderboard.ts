"use server";

import { getLeaderboardData, TabKey } from "@/app/leaderboard/page";

/**
 * Server Action to fetch subsequent pages of the leaderboard.
 * This is called by the client component's infinite loader.
 */
export async function fetchMoreLeaderboardData(tab: TabKey, page: number) {
  // We can re-use the exact same cached data-fetching function
  // from the main page.
  return getLeaderboardData(tab, page);
}
