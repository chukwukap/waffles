import ProfilePageClient from "./client";
import { prisma } from "@/lib/db";
import { GameHistoryEntry, ProfileStatsData } from "@/lib/types";
import { cache } from "react";
import { calculateStreak } from "@/lib/streaks";
import { redirect } from "next/navigation";

// Define the payload type for the client
interface ProfilePagePayload {
  profileData: {
    fid: number;
    username: string | null;
    wallet: string | null;
    pfpUrl: string | null;
  } | null;
  stats: ProfileStatsData | null;
  gameHistory: GameHistoryEntry[] | null;
  streak: number;
  username: string | null;
  inviteCode: string | null;
  referralStatusData: number | null;
}

/**
 * Fetches all data required for the profile page in a single, optimized query.
 */
const getProfilePageData = cache(
  async (fidRaw: number | null): Promise<ProfilePagePayload> => {
    // 1. Require a valid FID
    if (!fidRaw || isNaN(fidRaw)) {
      return {
        profileData: null,
        stats: null,
        gameHistory: [],
        streak: 0,
        username: null,
        inviteCode: null,
        referralStatusData: null,
      };
    }

    // 2. Fetch User Basic Info (Fast)
    const userPromise = prisma.user.findUnique({
      where: { fid: fidRaw },
      select: {
        id: true,
        fid: true,
        username: true,
        pfpUrl: true,
        wallet: true,
        inviteCode: true,
        status: true,
        _count: {
          select: { rewards: true },
        },
      },
    });

    // 3. Execute queries in parallel
    // We need the user ID for the other queries, so we await user first
    // Optimization: In a real high-scale app, we might cache the FID->ID mapping
    const user = await userPromise;

    if (!user) {
      return {
        profileData: null,
        stats: null,
        gameHistory: [],
        streak: 0,
        username: null,
        inviteCode: null,
        referralStatusData: null,
      };
    }

    // Enforce access control
    if (user.status !== "ACTIVE") {
      redirect("/invite");
    }

    // 4. Parallel fetch for Stats and History
    const [statsAggregate, recentGames, streakData] = await Promise.all([
      // A. Aggregate Stats (Database does the math)
      prisma.gamePlayer.aggregate({
        where: { userId: user.id },
        _count: { _all: true }, // Total games
        _sum: { score: true }, // Total score
        _max: { score: true }, // Highest score
      }),

      // B. Recent Game History (Limit to 14)
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
              tickets: {
                where: { status: "PAID" },
                select: { amountUSDC: true },
                take: 1,
              },
            },
          },
        },
      }),

      // C. Fetch data for streak calculation (Only need dates)
      // Optimization: Only fetch joinedAt for streak calc
      prisma.gamePlayer.findMany({
        where: { userId: user.id },
        select: { joinedAt: true },
        orderBy: { joinedAt: "desc" },
        // Fetch enough to calculate a reasonable streak, e.g., last 100 games
        take: 100,
      }),
    ]);

    // 5. Calculate derived stats
    const totalGames = statsAggregate._count._all;
    const highestScore = statsAggregate._max.score ?? 0;
    const totalScore = statsAggregate._sum.score ?? 0;
    const avgScore = totalGames > 0 ? totalScore / totalGames : 0;

    // Calculate Wins and Total Won from recent history + aggregate if needed
    // Note: For exact "Total Won" across ALL time, we'd need a separate aggregate query
    // if we store winnings on GamePlayer. Since it's on Ticket, it's harder to aggregate.
    // For now, we'll approximate or fetch all for winnings if strict accuracy is needed.
    // Optimization: Let's fetch ALL games strictly for winnings/wins calculation if needed,
    // OR (Better) add a `winnings` column to GamePlayer in the future.
    // For this iteration, to keep it fast, we will calculate from the recent games
    // AND a separate lightweight query for wins if totalGames > 14.

    let wins = 0;
    let totalWon = 0;
    let bestRank: number | null = null;

    // If user has few games, recentGames has everything.
    // If many games, we might miss some wins/winnings in the summary.
    // To be accurate without fetching everything, we can do a specific query for wins.
    if (totalGames > 0) {
      const [winStats, bestRankStat] = await Promise.all([
        prisma.gamePlayer.findMany({
          where: { userId: user.id, rank: 1 }, // Assuming rank 1 is win
          select: {
            game: {
              select: {
                tickets: {
                  where: { status: "PAID" },
                  select: { amountUSDC: true },
                  take: 1,
                },
              },
            },
          },
        }),
        // Find best rank efficiently
        prisma.gamePlayer.findFirst({
          where: { userId: user.id, rank: { not: null } },
          orderBy: { rank: "asc" },
          select: { rank: true },
        }),
      ]);

      wins = winStats.length;
      totalWon = winStats.reduce(
        (sum, r) => sum + (r.game.tickets[0]?.amountUSDC ?? 0),
        0
      );
      bestRank = bestRankStat?.rank ?? null;
    }

    const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;

    // Calculate streak
    const gameDates = streakData.map((g) => g.joinedAt);
    const currentStreak = calculateStreak(gameDates);

    // Format History
    const gameHistory: GameHistoryEntry[] = recentGames.map((g) => {
      const winnings = g.game.tickets[0]?.amountUSDC ?? 0;
      return {
        id: g.game.id,
        name: g.game.title ?? "Game",
        score: g.score,
        claimedAt: g.claimedAt,
        winnings: winnings,
        winningsColor: winnings > 0 ? "green" : "gray",
      };
    });

    // 6. Compile Final Payload
    const profileData = {
      fid: user.fid,
      username: user.username,
      wallet: user.wallet,
      pfpUrl: user.pfpUrl,
    };

    const stats: ProfileStatsData = {
      totalGames,
      wins,
      winRate,
      totalWon,
      highestScore,
      avgScore: Math.round(avgScore),
      currentStreak,
      bestRank,
    };

    return {
      profileData,
      stats,
      gameHistory,
      streak: currentStreak,
      username: profileData.username,
      inviteCode: user.inviteCode,
      referralStatusData: user._count.rewards,
    };
  }
);

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ fid: string }>;
}) {
  const { fid } = await searchParams;
  // Pass single promise prop
  const profilePageDataPromise = getProfilePageData(Number(fid));
  return <ProfilePageClient profilePageDataPromise={profilePageDataPromise} />;
}
