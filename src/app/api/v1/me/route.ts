import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface ApiError {
  error: string;
  code?: string;
}

interface MeResponse {
  id: string;
  fid: number;
  username: string | null;
  pfpUrl: string | null;
  wallet: string | null;
  hasGameAccess: boolean;
  isBanned: boolean;
  joinedWaitlistAt: Date | null;
  inviteCode: string | null;
  waitlistPoints: number;
  waitlistRank: number;
  invitesCount: number;
  createdAt: Date;
}

/**
 * GET /api/v1/me?fid=<fid>
 * Check if user exists in database by FID (no auth required)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fidParam = searchParams.get("fid");

    if (!fidParam) {
      return NextResponse.json<ApiError>(
        { error: "Missing fid parameter", code: "BAD_REQUEST" },
        { status: 400 }
      );
    }

    const fid = Number(fidParam);
    if (isNaN(fid)) {
      return NextResponse.json<ApiError>(
        { error: "Invalid fid parameter", code: "BAD_REQUEST" },
        { status: 400 }
      );
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

    // User not found → 404
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
      waitlistRank: rank + 1, // +1 because rank is 0-indexed
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
