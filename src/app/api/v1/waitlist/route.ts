import { NextResponse } from "next/server";
import { withAuth, type AuthResult, type ApiError } from "@/lib/auth";
import { prisma } from "@/lib/db";

interface QuestResponse {
  id: string;
  slug: string;
  title: string;
  description: string;
  iconUrl: string | null;
  category: string;
  points: number;
  type: string;
  actionUrl: string | null;
  castHash: string | null;
  requiredCount: number;
  repeatFrequency: string;
  isCompleted: boolean;
  isPending: boolean; // For CUSTOM quests pending approval
  progress: number; // For REFERRAL quests
}

interface WaitlistResponse {
  fid: number;
  rank: number;
  points: number;
  inviteCode: string | null;
  invitesCount: number;
  hasGameAccess: boolean;
  joinedWaitlistAt: Date | null;
  completedQuests: string[]; // Slugs of completed quests
  quests: QuestResponse[];
}

/**
 * GET /api/v1/waitlist
 * Get authenticated user's waitlist status with quests (auth required)
 */
export const GET = withAuth(async (request, auth: AuthResult) => {
  try {
    // Get user with completed quests
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        fid: true,
        waitlistPoints: true,
        inviteCode: true,
        hasGameAccess: true,
        joinedWaitlistAt: true,
        completedQuests: {
          select: {
            quest: { select: { slug: true } },
            isApproved: true,
          },
        },
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

    // Get all active quests within schedule
    const now = new Date();
    const quests = await prisma.quest.findMany({
      where: {
        isActive: true,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [
          {
            OR: [{ endsAt: null }, { endsAt: { gte: now } }],
          },
        ],
      },
      orderBy: { sortOrder: "asc" },
    });

    // Map completed quests for quick lookup
    const completedSlugs = new Set(
      user.completedQuests
        .filter((cq) => cq.isApproved)
        .map((cq) => cq.quest.slug)
    );
    const pendingSlugs = new Set(
      user.completedQuests
        .filter((cq) => !cq.isApproved)
        .map((cq) => cq.quest.slug)
    );

    // Calculate rank
    const rank = await prisma.user.count({
      where: {
        waitlistPoints: {
          gt: user.waitlistPoints,
        },
      },
    });

    // Build quest responses
    const questResponses: QuestResponse[] = quests.map((quest) => ({
      id: quest.id,
      slug: quest.slug,
      title: quest.title,
      description: quest.description,
      iconUrl: quest.iconUrl,
      category: quest.category,
      points: quest.points,
      type: quest.type,
      actionUrl: quest.actionUrl,
      castHash: quest.castHash,
      requiredCount: quest.requiredCount,
      repeatFrequency: quest.repeatFrequency,
      isCompleted: completedSlugs.has(quest.slug),
      isPending: pendingSlugs.has(quest.slug),
      progress: quest.type === "REFERRAL" ? user._count.referrals : 0,
    }));

    const response: WaitlistResponse = {
      fid: user.fid,
      rank: rank + 1,
      points: user.waitlistPoints,
      inviteCode: user.inviteCode,
      invitesCount: user._count.referrals,
      hasGameAccess: user.hasGameAccess,
      joinedWaitlistAt: user.joinedWaitlistAt,
      completedQuests: Array.from(completedSlugs),
      quests: questResponses,
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
