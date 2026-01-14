import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Params = { fid: string };

interface ApiError {
  error: string;
  code?: string;
}

interface InviteResponse {
  code: string | null;
  invitesCount: number;
  inviteQuota: number;
}

/**
 * GET /api/v1/users/[fid]/invite
 * Get user's invite code and stats (public endpoint)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { fid: fidParam } = await params;
    const fid = parseInt(fidParam, 10);

    if (isNaN(fid)) {
      return NextResponse.json<ApiError>(
        { error: "Invalid fid", code: "INVALID_INPUT" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { fid },
      select: {
        inviteCode: true,
        inviteQuota: true,
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

    return NextResponse.json<InviteResponse>({
      code: user.inviteCode,
      invitesCount: user._count.referrals,
      inviteQuota: user.inviteQuota,
    });
  } catch (error) {
    console.error("GET /api/v1/users/[fid]/invite Error:", error);
    return NextResponse.json<ApiError>(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
