import { NextResponse } from "next/server";
import { withAuth, type AuthResult, type ApiError } from "@/lib/auth";
import { prisma } from "@/lib/db";

interface InviteResponse {
  code: string | null;
  invitesCount: number;
  inviteQuota: number;
}

/**
 * GET /api/v1/me/invite
 * Get current user's invite code and stats (auth required)
 */
export const GET = withAuth(async (_request, auth: AuthResult) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        inviteCode: true,
        inviteQuota: true,
        _count: {
          select: { invites: true },
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
      invitesCount: user._count.invites,
      inviteQuota: user.inviteQuota,
    });
  } catch (error) {
    console.error("GET /api/v1/me/invite Error:", error);
    return NextResponse.json<ApiError>(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
});
