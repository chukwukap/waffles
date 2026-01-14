import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Params = { fid: string };

interface ApiError {
  error: string;
  code?: string;
}

/**
 * GET /api/v1/users/[fid]
 * Get user profile by fid (public endpoint)
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  try {
    const { fid } = await context.params;
    const fidNum = parseInt(fid, 10);

    if (isNaN(fidNum)) {
      return NextResponse.json<ApiError>(
        { error: "Invalid FID", code: "INVALID_PARAM" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { fid: fidNum },
      select: {
        id: true,
        fid: true,
        username: true,
        pfpUrl: true,
        wallet: true,
        waitlistPoints: true,
        inviteQuota: true,
        inviteCode: true,
        hasGameAccess: true,
        isBanned: true,
        joinedWaitlistAt: true,
        createdAt: true,
        _count: {
          select: { referrals: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json<ApiError>(
        { error: "User not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Calculate waitlist rank
    const rank = await prisma.user.count({
      where: {
        waitlistPoints: {
          gt: user.waitlistPoints,
        },
      },
    });

    return NextResponse.json({
      id: user.id,
      fid: user.fid,
      username: user.username,
      pfpUrl: user.pfpUrl,
      wallet: user.wallet,
      waitlistPoints: user.waitlistPoints,
      inviteQuota: user.inviteQuota,
      inviteCode: user.inviteCode,
      hasGameAccess: user.hasGameAccess,
      isBanned: user.isBanned,
      joinedWaitlistAt: user.joinedWaitlistAt,
      createdAt: user.createdAt,
      waitlistRank: rank + 1,
      invitesCount: user._count.referrals,
    });
  } catch (error) {
    console.error("GET /api/v1/users/[fid] Error:", error);
    return NextResponse.json<ApiError>(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
