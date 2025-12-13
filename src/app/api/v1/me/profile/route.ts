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
