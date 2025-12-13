import { NextResponse } from "next/server";
import { withAuth, type AuthResult, type ApiError } from "@/lib/auth";
import { prisma } from "@/lib/db";

interface WaitlistResponse {
  fid: number;
  rank: number;
  points: number;
  inviteCode: string | null;
  invitesCount: number;
  status: string;
  completedTasks: string[];
}

/**
 * GET /api/v1/waitlist
 * Get authenticated user's waitlist status (auth required)
 */
export const GET = withAuth(async (request, auth: AuthResult) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        fid: true,
        waitlistPoints: true,
        inviteCode: true,
        status: true,
        completedTasks: true,
        _count: {
          select: {
            invites: true,
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

    // Calculate rank
    const rank = await prisma.user.count({
      where: {
        waitlistPoints: {
          gt: user.waitlistPoints,
        },
      },
    });

    const response: WaitlistResponse = {
      fid: user.fid,
      rank: rank + 1,
      points: user.waitlistPoints,
      inviteCode: user.inviteCode,
      invitesCount: user._count.invites,
      status: user.status,
      completedTasks: user.completedTasks,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("GET /api/v1/waitlist Error:", error);
    return NextResponse.json<ApiError>(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
});
