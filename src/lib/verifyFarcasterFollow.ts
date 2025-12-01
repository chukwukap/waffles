import { neynar } from "./neynarClient";

/**
 * Verifies if a user follows a target user on Farcaster using Neynar API
 *
 * Uses the `fetchBulkUsers` endpoint with `viewer_fid` to check the relationship
 * directly, which is more reliable than paginating through all follows.
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
    // Fetch the target user's data with the viewer context
    // This returns relationship data including whether viewer follows the target
    const response = await neynar.fetchBulkUsers({
      fids: [targetFid],
      viewerFid: userFid,
    });

    if (!response.users || response.users.length === 0) {
      console.warn(
        `[VERIFY_FOLLOW] Target FID ${targetFid} not found in Neynar`
      );
      return false;
    }

    const targetUser = response.users[0];

    // Check if the viewer (userFid) follows the target
    const isFollowing = targetUser.viewer_context?.following || false;

    console.log(
      `[VERIFY_FOLLOW] FID ${userFid} ${
        isFollowing ? "IS" : "IS NOT"
      } following FID ${targetFid}`
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
