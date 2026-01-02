import { NextResponse } from "next/server";
import { withAuth, type AuthResult, type ApiError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calculateStreak } from "@/lib/streaks";

interface StatsResponse {
  totalGames: number;
  wins: number;
  winRate: number;
  totalWon: number;
  highestScore: number;
  avgScore: number;
  currentStreak: number;
  bestRank: number | null;
}

/**
 * GET /api/v1/me/stats
 * Returns user's game statistics
 */
export const GET = withAuth(async (request, auth: AuthResult) => {
  try {
    const { userId } = auth;

    // Parallel queries for efficiency
    const [statsAggregate, winStats, bestRankEntry, streakData] =
      await Promise.all([
        // Aggregate stats
        prisma.gameEntry.aggregate({
          where: { userId, paidAt: { not: null } },
          _count: { _all: true },
          _sum: { score: true, prize: true },
          _max: { score: true },
        }),

        // Win count (rank 1)
        prisma.gameEntry.count({
          where: { userId, rank: 1, paidAt: { not: null } },
        }),

        // Best rank
        prisma.gameEntry.findFirst({
          where: { userId, rank: { not: null }, paidAt: { not: null } },
          orderBy: { rank: "asc" },
          select: { rank: true },
        }),

        // Streak data (recent game dates)
        prisma.gameEntry.findMany({
          where: { userId, paidAt: { not: null } },
          select: { paidAt: true },
          orderBy: { paidAt: "desc" },
          take: 100,
        }),
      ]);

    const totalGames = statsAggregate._count._all;
    const highestScore = statsAggregate._max.score ?? 0;
    const totalScore = statsAggregate._sum.score ?? 0;
    const totalWon = statsAggregate._sum.prize ?? 0;
    const avgScore = totalGames > 0 ? Math.round(totalScore / totalGames) : 0;
    const winRate = totalGames > 0 ? (winStats / totalGames) * 100 : 0;
    const bestRank = bestRankEntry?.rank ?? null;

    // Calculate streak
    const gameDates = streakData
      .map((g) => g.paidAt)
      .filter((d): d is Date => d !== null);
    const currentStreak = calculateStreak(gameDates);

    const response: StatsResponse = {
      totalGames,
      wins: winStats,
      winRate,
      totalWon,
      highestScore,
      avgScore,
      currentStreak,
      bestRank,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("GET /api/v1/me/stats Error:", error);
    return NextResponse.json<ApiError>(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
});
