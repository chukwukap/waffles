import { neynar } from "./neynarClient";

/**
 * Verifies if a user follows a target user on Farcaster using Neynar API
 *
 * @param userFid - The FID of the user to check
 * @param targetFid - The FID of the user they should be following
 * @returns true if user follows target, false otherwise
 * @throws Error if Neynar API call fails (caller should handle gracefully)
 */
export async function verifyFarcasterFollow(
  userFid: number,
  targetFid: number
): Promise<boolean> {
  try {
    // Fetch the list of users that userFid is following
    const response = await neynar.fetchUserFollowing({
      fid: userFid,
      limit: 100, // Check first 100 follows (should be enough)
    });

    // Check if targetFid is in the following list
    const isFollowing = response.users.some(
      (user) => user.user.fid === targetFid
    );

    return isFollowing;
  } catch (error) {
    // Re-throw so caller can handle gracefully
    console.error(
      `[VERIFY_FOLLOW] Failed to verify follow for FID ${userFid}:`,
      error
    );
    throw error;
  }
}
