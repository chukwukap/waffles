import { createClient, Errors } from "@farcaster/quick-auth";
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";

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

// ============================================================================
// Types
// ============================================================================

export interface AuthResult {
  fid: number;
  userId: number;
}

export interface ApiError {
  error: string;
  code?: string;
}

// ============================================================================
// Token Verification
// ============================================================================

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
 * Verify Quick Auth from incoming request headers
 * Use this in API routes to authenticate requests
 *
 * @param request - The incoming request with Authorization header
 * @returns AuthResult with fid and userId, or null if unauthenticated
 */
export async function verifyQuickAuthRequest(
  request: Request
): Promise<AuthResult | null> {
  const authorization = request.headers.get("Authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.split(" ")[1];
  const fid = await verifyAuthToken(token);

  if (!fid) {
    return null;
  }

  // Look up user by FID
  const user = await prisma.user.findUnique({
    where: { fid },
    select: { id: true, fid: true },
  });

  if (!user) {
    return null;
  }

  return { fid: user.fid, userId: user.id };
}

// ============================================================================
// API Route Helpers
// ============================================================================

/**
 * Higher-order function to wrap API route handlers with authentication
 *
 * @example
 * export const GET = withAuth(async (request, auth) => {
 *   // auth.fid and auth.userId are guaranteed to be valid
 *   return NextResponse.json({ fid: auth.fid });
 * });
 */
export function withAuth<T extends object = Record<string, string>>(
  handler: (
    request: NextRequest,
    auth: AuthResult,
    params: T
  ) => Promise<NextResponse>
) {
  return async (
    request: NextRequest,
    context: { params: Promise<T> }
  ): Promise<NextResponse> => {
    const auth = await verifyQuickAuthRequest(request);

    if (!auth) {
      return NextResponse.json<ApiError>(
        { error: "Authentication required", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const params = await context.params;
    return handler(request, auth, params);
  };
}

/**
 * Optional auth wrapper - auth may be null for public routes that have
 * optional personalization
 */
export function withOptionalAuth<T extends object = Record<string, string>>(
  handler: (
    request: NextRequest,
    auth: AuthResult | null,
    params: T
  ) => Promise<NextResponse>
) {
  return async (
    request: NextRequest,
    context: { params: Promise<T> }
  ): Promise<NextResponse> => {
    const auth = await verifyQuickAuthRequest(request);
    const params = await context.params;
    return handler(request, auth, params);
  };
}

// ============================================================================
// Legacy Functions (for gradual migration)
// ============================================================================

/**
 * @deprecated Use verifyQuickAuthRequest instead
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
