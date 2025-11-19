import { cache } from "react";

import { prisma } from "@/lib/db";
import type { AllTimeStats } from "@/lib/types";
import { calculateStreak } from "@/lib/streaks";
import StatsClient from "./client";

// Single optimized query pass to get all relevant participation data for stats
const getAllTimeStats = cache(async (fid: number): Promise<AllTimeStats> => {
  // 1. Find user by FID to get their internal ID
  const user = await prisma.user.findUnique({
    where: { fid },
    select: { id: true },
  });

  if (!user) {
    // Return empty stats if user not found
    return {
      totalGames: 0,
      wins: 0,
      winRate: "0%",
      totalWon: "$0.00",
      highestScore: 0,
      averageScore: 0,
      currentStreak: 0,
      bestRank: "-",
    };
  }

  // 2. Get all user's game participations, including game and ticket info
  const participations = await prisma.gamePlayer.findMany({
    where: { userId: user.id },
    select: {
      gameId: true,
      joinedAt: true,
      score: true,
      rank: true, // Get the final rank
      game: {
        select: {
          // Get this user's ticket for this game to find winnings
          tickets: {
            where: {
              userId: user.id,
              status: "PAID", // Or "REDEEMED", based on your logic
            },
            select: { amountUSDC: true },
            take: 1,
          },
        },
      },
    },
    orderBy: {
      joinedAt: "desc", // For streak calculation
    },
  });

  const totalGames = participations.length;
  if (totalGames === 0) {
    return {
      totalGames: 0,
      wins: 0,
      winRate: "0%",
      totalWon: "$0.00",
      highestScore: 0,
      averageScore: 0,
      currentStreak: 0,
      bestRank: "-",
    };
  }

  // 3. Prepare to calculate stats
  let wins = 0;
  let totalWon = 0;
  let highestScore = 0;
  let scoreSum = 0;
  let bestRank: number = Infinity;
  const gameDates: Date[] = [];

  for (const part of participations) {
    const winnings = part.game.tickets[0]?.amountUSDC ?? 0;
    if (winnings > 0) {
      // Assuming winnings > 0 means a "win"
      // You might change this to `part.rank === 1`
      wins++;
      totalWon += winnings;
    }

    if (part.rank === 1) {
      // Or, if "wins" strictly means 1st place
      // wins++; // Uncomment this if rank 1 = win
    }

    if (part.score > highestScore) {
      highestScore = part.score;
    }
    scoreSum += part.score;

    if (part.rank !== null && part.rank < bestRank) {
      bestRank = part.rank;
    }

    gameDates.push(part.joinedAt);
  }

  // 4. Final calculations
  const averageScore = totalGames > 0 ? scoreSum / totalGames : 0;
  const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;
  const currentStreak = calculateStreak(gameDates);
  const bestRankDisplay = bestRank === Infinity ? "-" : bestRank;

  // 5. Structure matches AllTimeStats
  return {
    totalGames,
    wins,
    winRate: `${winRate.toFixed(1)}%`,
    totalWon: totalWon.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    }),
    highestScore,
    averageScore: Math.round(averageScore),
    currentStreak,
    bestRank: bestRankDisplay,
  };
});

export default async function AllTimeStatsPage({
  searchParams,
}: {
  // Use searchParams to get fid
  searchParams: Promise<{ fid: string }>;
}) {
  const { fid } = await searchParams;
  if (!fid) {
    return null;
  }
  const statsPromise = getAllTimeStats(Number(fid));
  return <StatsClient payloadPromise={statsPromise} />;
}
