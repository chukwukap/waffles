import { NextResponse } from "next/server";
import { withAuth, type AuthResult, type ApiError } from "@/lib/auth";
import { prisma } from "@/lib/db";

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
 * Get the authenticated user's profile
 */
export const GET = withAuth(async (request, auth: AuthResult) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      include: {
        _count: {
          select: {
            referrals: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json<ApiError>(
        { error: "User not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Calculate rank based on waitlist points
    const rank = await prisma.user.count({
      where: {
        waitlistPoints: {
          gt: user.waitlistPoints,
        },
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
});
