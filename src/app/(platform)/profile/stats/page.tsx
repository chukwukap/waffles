import { cache } from "react";
import StatsClient from "./_components/statsClient";
import { prisma } from "@/lib/db";
import type { AllTimeStats } from "@/lib/types";

// Single optimized query pass to get all relevant participation data for stats
const getAllTimeStats = cache(async (fid: number): Promise<AllTimeStats> => {
  // Get user's game participations, joinedAt, tickets/winnings, scores in one go
  const participations = await prisma.gameParticipant.findMany({
    where: { userId: fid },
    select: {
      gameId: true,
      joinedAt: true,
      game: {
        select: {
          scores: {
            select: {
              userId: true,
              points: true,
            },
          },
          tickets: {
            where: { userId: fid },
            select: {
              amountUSDC: true,
              userId: true,
            },
            take: 1, // only for this user
          },
        },
      },
    },
  });

  const totalGames = participations.length;

  // Prepare to calculate stats
  let wins = 0;
  let totalWon = 0;
  let highestScore = 0;
  let scoreSum = 0;
  let gamesWithScore = 0;

  // For computing streak and best rank
  const streakArr: Array<{ joinedAt: Date; win: boolean }> = [];
  let bestRank: number = Infinity;

  for (const part of participations) {
    // Find the user's ticket for this game (should only be 0 or 1)
    const ticket = part.game.tickets?.[0];
    const amountUSDC = ticket?.amountUSDC ?? 0;

    // Only consider games with score for average/highest, rank, etc
    const userScoreObj = part.game.scores.find((s) => s.userId === fid);
    const userPoints = userScoreObj?.points ?? null;

    if (userPoints !== null) {
      gamesWithScore++;
      scoreSum += userPoints;
      if (userPoints > highestScore) highestScore = userPoints;

      // Calculate rank for this game (sort descending)
      const sorted = [...part.game.scores].sort((a, b) => b.points - a.points);
      const myRank = sorted.findIndex((s) => s.userId === fid);
      if (myRank !== -1 && myRank + 1 < bestRank) {
        bestRank = myRank + 1;
      }
    }

    const won = !!amountUSDC && amountUSDC > 0;
    if (won) {
      wins++;
      totalWon += amountUSDC;
    }

    streakArr.push({ joinedAt: part.joinedAt, win: won });
  }

  // Average score (including only games with score)
  const averageScore = gamesWithScore > 0 ? scoreSum / gamesWithScore : 0;

  // Current streak, ordered by joinedAt DESC (most recent first, consecutive wins)
  streakArr.sort((a, b) => b.joinedAt.getTime() - a.joinedAt.getTime());
  let currentStreak = 0;
  for (let i = 0; i < streakArr.length; ++i) {
    if (streakArr[i].win) currentStreak++;
    else break;
  }

  // Best rank for UI
  const bestRankDisplay = bestRank === Infinity ? "-" : bestRank;

  // Structure matches AllTimeStats
  return {
    totalGames,
    wins,
    winRate:
      totalGames > 0 ? `${((wins / totalGames) * 100).toFixed(1)}%` : "0.0%",
    totalWon: totalWon.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    highestScore,
    averageScore: Math.round(averageScore * 100) / 100,
    currentStreak,
    bestRank: bestRankDisplay,
  };
});

export default async function AllTimeStatsPage({
  params,
}: {
  params: Promise<{ fid: string }>;
}) {
  const { fid } = await params;
  if (!fid) {
    return null;
  }
  const statsPromise = getAllTimeStats(Number(fid));
  return <StatsClient payloadPromise={statsPromise} />;
}
