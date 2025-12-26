import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createClient, Errors } from "@farcaster/quick-auth";
import { env } from "@/lib/env";

const client = createClient();

function getDomain(): string {
  try {
    const url = new URL(env.rootUrl);
    return url.hostname;
  } catch {
    return "localhost:3000";
  }
}

const domain = getDomain();

interface ApiError {
  error: string;
  code?: string;
}

interface MeResponse {
  id: number;
  fid: number;
  username: string | null;
  pfpUrl: string | null;
  wallet: string | null;
  hasGameAccess: boolean;
  isBanned: boolean;
  joinedWaitlistAt: Date | null;
  inviteCode: string | null;
  waitlistPoints: number;
  rank: number;
  invitesCount: number;
  createdAt: Date;
}

/**
 * GET /api/v1/me
 * Check if user exists in database
 *
 * FIX: Returns 404 (not 401) when user doesn't exist in DB
 * This allows auth-gate to distinguish "new user" from "invalid token"
 */
export async function GET(request: NextRequest) {
  try {
    // Extract token from Authorization header
    const authorization = request.headers.get("Authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json<ApiError>(
        { error: "Authentication required", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const token = authorization.split(" ")[1];

    // Verify JWT
    let fid: number;
    try {
      const payload = await client.verifyJwt({ token, domain });
      fid = payload.sub;
    } catch (e) {
      if (e instanceof Errors.InvalidTokenError) {
        return NextResponse.json<ApiError>(
          { error: "Invalid token", code: "UNAUTHORIZED" },
          { status: 401 }
        );
      }
      throw e;
    }

    // Look up user by FID
    const user = await prisma.user.findUnique({
      where: { fid },
      include: {
        _count: {
          select: { referrals: true },
        },
      },
    });

    // User not found → 404 (this is what fixes the onboarding loop!)
    if (!user) {
      return NextResponse.json<ApiError>(
        { error: "User not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Calculate rank
    const rank = await prisma.user.count({
      where: {
        waitlistPoints: { gt: user.waitlistPoints },
      },
    });

    const response: MeResponse = {
      id: user.id,
      fid: user.fid,
      username: user.username,
      pfpUrl: user.pfpUrl,
      wallet: user.wallet,
      hasGameAccess: user.hasGameAccess,
      isBanned: user.isBanned,
      joinedWaitlistAt: user.joinedWaitlistAt,
      inviteCode: user.inviteCode,
      waitlistPoints: user.waitlistPoints,
      rank: rank + 1,
      invitesCount: user._count.referrals,
      createdAt: user.createdAt,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("GET /api/v1/me Error:", error);
    return NextResponse.json<ApiError>(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
