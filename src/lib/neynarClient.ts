import { env } from "@/lib/env";
import { NeynarAPIClient } from "@neynar/nodejs-sdk";

if (!env.neynarApiKey) {
  console.error(
    "FATAL ERROR: NEYNAR_API_KEY is not configured in environment variables. Neynar client cannot be initialized."
  );
}

export const neynar = new NeynarAPIClient({
  apiKey: env.neynarApiKey!,
});

// --- Helper Types ---
// Define strict interfaces for the data we expect from the SDK
interface NeynarUser {
  fid: number;
}

interface NeynarPage {
  users: NeynarUser[];
  next: {
    cursor: string | null;
  };
}

/**
 * Helper to fetch a list of FIDs from a paginated Neynar endpoint.
 * Caps the fetch at `limit` to prevent server timeouts.
 */
async function fetchFidsFromEndpoint(
  // Explicitly type the fetcher to return a Promise of our expected shape
  fetcher: (cursor: string | undefined) => Promise<NeynarPage>,
  limit: number = 500
): Promise<Set<number>> {
  const fids = new Set<number>();
  let cursor: string | null = null;

  try {
    do {
      const response = await fetcher(cursor || undefined);
      const users = response.users || [];

      for (const user of users) {
        if (user.fid) fids.add(user.fid);
      }

      // Stop if we hit the limit or run out of pages
      if (fids.size >= limit) break;

      cursor = response.next?.cursor || null;
    } while (cursor);
  } catch (err) {
    console.warn("Neynar fetch partial failure:", err);
    // Return what we have so far instead of crashing
  }

  return fids;
}

/**
 * Efficiently finds mutuals (users who follow each other).
 * Strategy:
 * 1. Fetch "Who I follow" (Following) - usually a smaller, more curated list.
 * 2. Fetch "Who follows me" (Followers) - can be huge, so we limit it.
 * 3. Intersect the two sets.
 */
export async function getMutualFids(fid: number): Promise<number[]> {
  // Run both fetches in parallel for speed
  const [followingSet, followersSet] = await Promise.all([
    // Get people I follow (limit 1000)
    fetchFidsFromEndpoint(async (cursor) => {
      const res = await neynar.fetchUserFollowing({
        fid,
        limit: 100,
        cursor,
      });
      // Safe assertion: Cast to unknown first, then to our specific Interface
      return res as unknown as NeynarPage;
    }, 1000),
    // Get people who follow me (limit 1000 - we prioritize recent followers)
    fetchFidsFromEndpoint(async (cursor) => {
      const res = await neynar.fetchUserFollowers({
        fid,
        limit: 100,
        cursor,
      });
      // Safe assertion
      return res as unknown as NeynarPage;
    }, 1000),
  ]);

  // Calculate Intersection: Keep FIDs that are in BOTH sets
  const mutuals: number[] = [];
  for (const followingFid of followingSet) {
    if (followersSet.has(followingFid)) {
      mutuals.push(followingFid);
    }
  }

  return mutuals;
}
