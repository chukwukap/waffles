import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/profile/stats
export async function GET(request: Request) {
  const farcasterId = request.headers.get("x-farcaster-id");
  if (!farcasterId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { farcasterId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const scores = await prisma.score.findMany({
    where: { userId: user.id },
    include: { game: true },
  });
  const totalGames = scores.length;
  if (totalGames === 0) {
    return NextResponse.json({
      totalGames: 0,
      wins: 0,
      winRate: 0,
      totalWon: 0,
      highestScore: 0,
      avgScore: 0,
      currentStreak: 0,
      bestRank: 0,
    });
  }
  let wins = 0;
  let bestRank = totalGames > 0 ? totalGames : 0;
  let totalWon = 0;
  let highestScore = 0;
  // Sort scores by game endTime descending for streak
  scores.sort((a, b) => {
    const aTime = a.game.endTime?.getTime() || 0;
    const bTime = b.game.endTime?.getTime() || 0;
    return bTime - aTime;
  });
  let currentStreak = 0;
  let streakCounting = false;
  for (const s of scores) {
    totalWon += s.points;
    highestScore = Math.max(highestScore, s.points);
    // Calculate rank for this game
    const countBetter = await prisma.score.count({
      where: { gameId: s.gameId, points: { gt: s.points } },
    });
    const rank = countBetter + 1;
    bestRank = Math.min(bestRank, rank);
    if (!streakCounting) {
      if (rank === 1) {
        currentStreak = 1;
        streakCounting = true;
      }
    } else {
      if (rank === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
    if (rank === 1) wins++;
  }
  const avgScore = totalWon / totalGames;
  const winRate = (wins / totalGames) * 100;
  return NextResponse.json({
    totalGames,
    wins,
    winRate: Math.round(winRate * 10) / 10,
    totalWon,
    highestScore,
    avgScore: Math.round(avgScore * 100) / 100,
    currentStreak,
    bestRank,
  });
}
