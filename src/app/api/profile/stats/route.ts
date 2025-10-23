// ───────────────────────── /app/api/profile/stats/route.ts ─────────────────────────
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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
  let totalWon = 0;
  let highestScore = 0;
  let bestRank = Infinity;

  // Sort by endTime (latest first)
  const sortedScores = [...scores].sort((a, b) => {
    const aTime = a.game.endTime?.getTime() ?? 0;
    const bTime = b.game.endTime?.getTime() ?? 0;
    return bTime - aTime;
  });

  // Preload all game results to calculate ranks efficiently
  const gameIds = [...new Set(sortedScores.map((s) => s.gameId))];
  const allGameScores = await prisma.score.findMany({
    where: { gameId: { in: gameIds } },
    select: { gameId: true, points: true },
  });

  // Compute stats
  let currentStreak = 0;
  for (const s of sortedScores) {
    totalWon += s.points;
    highestScore = Math.max(highestScore, s.points);

    // Rank calculation
    const rank =
      allGameScores.filter((g) => g.gameId === s.gameId && g.points > s.points)
        .length + 1;
    bestRank = Math.min(bestRank, rank);

    if (rank === 1) {
      wins++;
      currentStreak++;
    } else {
      break;
    }
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
    bestRank: bestRank === Infinity ? 0 : bestRank,
  });
}
