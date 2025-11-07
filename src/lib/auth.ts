import { createClient, Errors } from "@farcaster/quick-auth";
import { env } from "@/lib/env";

const client = createClient();

/**
 * Extract domain from rootUrl (e.g., "https://example.com" -> "example.com")
 */
function getDomain(): string {
  try {
    const url = new URL(env.rootUrl);
    return url.hostname;
  } catch {
    // Fallback for localhost
    return "localhost:3000";
  }
}

const domain = getDomain();

/**
 * Verify a JWT token and return the authenticated FID
 * Returns null if token is invalid or missing
 */
export async function verifyAuthToken(
  token: string | null | undefined
): Promise<number | null> {
  if (!token) {
    return null;
  }

  try {
    const payload = await client.verifyJwt({ token, domain });
    return payload.sub; // FID is in the 'sub' field
  } catch (e) {
    if (e instanceof Errors.InvalidTokenError) {
      return null;
    }
    throw e;
  }
}

/**
 * Verify that the authenticated FID matches the expected FID
 * Used in server actions to ensure users can only act on their own behalf
 */
export async function verifyAuthenticatedUser(
  token: string | null | undefined,
  expectedFid: number
): Promise<{ authenticated: boolean; error?: string }> {
  const authenticatedFid = await verifyAuthToken(token);

  if (!authenticatedFid) {
    return { authenticated: false, error: "Authentication required" };
  }

  if (authenticatedFid !== expectedFid) {
    return {
      authenticated: false,
      error: "Unauthorized: Cannot perform action for another user",
    };
  }

  return { authenticated: true };
}
