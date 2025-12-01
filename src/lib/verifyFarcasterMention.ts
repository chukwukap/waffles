import { neynar } from "./neynarClient";

/**
 * Verifies if a user has recently mentioned a target user in their casts
 *
 * @param userFid - The FID of the user to check
 * @param targetFid - The FID that should be mentioned
 * @returns true if user mentioned target in recent casts, false otherwise
 */
export async function verifyFarcasterMention(
  userFid: number,
  targetFid: number
): Promise<boolean> {
  try {
    // Get user's recent casts (last 25)
    const response = await neynar.fetchCastsForUser({
      fid: userFid,
      limit: 25,
    });

    // Check if any cast mentions the target FID
    const hasMention = response.casts.some((cast: any) =>
      cast.mentioned_profiles?.some((profile: any) => profile.fid === targetFid)
    );

    console.log(
      `[VERIFY_MENTION] FID ${userFid} ${
        hasMention ? "HAS" : "HAS NOT"
      } mentioned FID ${targetFid}`
    );

    return hasMention;
  } catch (error) {
    console.error(
      `[VERIFY_MENTION] Failed to verify mention for FID ${userFid}:`,
      error
    );
    throw error;
  }
}
