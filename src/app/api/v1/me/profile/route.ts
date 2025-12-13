import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthResult } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calculateStreak } from "@/lib/streaks";

/**
 * GET /api/v1/me/profile
 * Returns complete profile data including stats, game history, and invite code
 */
export const GET = withAuth(async (request: NextRequest, auth: AuthResult) => {
  const { userId, fid } = auth;

  // 1. Fetch user data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fid: true,
      username: true,
      pfpUrl: true,
      wallet: true,
      inviteCode: true,
      status: true,
      waitlistPoints: true,
      _count: {
        select: { rewards: true },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // 2. Fetch game participation data
  const [statsAggregate, recentGames, streakData, waitlistRank] =
    await Promise.all([
      // A. Aggregate Stats
      prisma.gamePlayer.aggregate({
        where: { userId: user.id },
        _count: { _all: true },
        _sum: { score: true },
        _max: { score: true },
      }),

      // B. Recent Game History (last 14)
      prisma.gamePlayer.findMany({
        where: { userId: user.id },
        orderBy: { joinedAt: "desc" },
        take: 14,
        select: {
          score: true,
          rank: true,
          claimedAt: true,
          joinedAt: true,
          game: {
            select: {
              id: true,
              title: true,
              theme: true,
            },
          },
        },
      }),

      // C. Streak data (last 100 games for calculation)
      prisma.gamePlayer.findMany({
        where: { userId: user.id },
        select: { joinedAt: true },
        orderBy: { joinedAt: "desc" },
        take: 100,
      }),

      // D. Waitlist rank
      prisma.user.count({
        where: {
          waitlistPoints: { gt: user.waitlistPoints },
        },
      }),
    ]);

  // 3. Calculate stats
  const totalGames = statsAggregate._count._all;
  const highestScore = statsAggregate._max.score ?? 0;
  const totalScore = statsAggregate._sum.score ?? 0;
  const avgScore = totalGames > 0 ? Math.round(totalScore / totalGames) : 0;

  // Get wins and best rank
  let wins = 0;
  let totalWon = 0;
  let bestRank: number | null = null;

  if (totalGames > 0) {
    const [winStats, bestRankStat] = await Promise.all([
      prisma.gamePlayer.count({
        where: { userId: user.id, rank: 1 },
      }),
      prisma.gamePlayer.findFirst({
        where: { userId: user.id, rank: { not: null } },
        orderBy: { rank: "asc" },
        select: { rank: true },
      }),
    ]);

    wins = winStats;
    totalWon = wins * 50; // Placeholder: winners get $50
    bestRank = bestRankStat?.rank ?? null;
  }

  const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;

  // Calculate streak
  const gameDates = streakData.map((g) => g.joinedAt);
  const currentStreak = calculateStreak(gameDates);

  // 4. Format game history
  const gameHistory = recentGames.map((g) => {
    const winnings = g.rank === 1 ? 50 : 0;
    return {
      id: g.game.id,
      name: g.game.title ?? "Game",
      theme: g.game.theme,
      score: g.score,
      rank: g.rank,
      claimedAt: g.claimedAt,
      winnings,
    };
  });

  // 5. Return complete profile
  return NextResponse.json({
    // User info
    fid: user.fid,
    username: user.username,
    pfpUrl: user.pfpUrl,
    wallet: user.wallet,
    status: user.status,
    inviteCode: user.inviteCode,
    waitlistPoints: user.waitlistPoints,
    rank: waitlistRank + 1,
    invitesCount: user._count.rewards,

    // Stats
    stats: {
      totalGames,
      wins,
      winRate,
      totalWon,
      highestScore,
      avgScore,
      currentStreak,
      bestRank,
    },

    // Game history
    gameHistory,
  });
});

// ============================================================================
// PATCH /api/v1/me/profile - Update user profile
// ============================================================================

import { z } from "zod";
import { ApiError } from "@/lib/auth";

const updateProfileSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(1, "Name cannot be empty.")
      .optional()
      .nullable(),
    wallet: z.string().trim().optional().nullable(),
    pfpUrl: z.string().url("Invalid image URL.").optional().nullable(),
  })
  .refine(
    (data) =>
      data.username !== undefined ||
      data.wallet !== undefined ||
      data.pfpUrl !== undefined,
    { message: "At least one field must be provided for update" }
  );

interface UpdateProfileResponse {
  success: true;
  user: {
    id: number;
    fid: number;
    username: string | null;
    wallet: string | null;
    pfpUrl: string | null;
  };
}

/**
 * PATCH /api/v1/me/profile
 * Update current user's profile (auth required)
 */
export const PATCH = withAuth(async (request, auth: AuthResult) => {
  try {
    const body = await request.json();
    const validation = updateProfileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json<ApiError>(
        {
          error: validation.error.issues[0]?.message || "Invalid input",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    const updateData = validation.data;

    // Filter out undefined values
    const filteredUpdateData = Object.entries(updateData).reduce(
      (acc, [key, value]) => {
        if (value !== undefined) {
          acc[key as keyof typeof updateData] = value;
        }
        return acc;
      },
      {} as Partial<typeof updateData>
    );

    if (Object.keys(filteredUpdateData).length === 0) {
      return NextResponse.json<ApiError>(
        { error: "No update data provided", code: "NO_DATA" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: auth.userId },
      data: filteredUpdateData,
      select: {
        id: true,
        fid: true,
        username: true,
        wallet: true,
        pfpUrl: true,
      },
    });

    return NextResponse.json<UpdateProfileResponse>({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error("PATCH /api/v1/me/profile Error:", error);
    return NextResponse.json<ApiError>(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
});
