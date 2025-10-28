import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";

interface ProfileStatsResponse {
  totalGames: number;
  wins: number;
  winRate: number;
  totalWon: number;
  highestScore: number;
  avgScore: number;
  currentStreak: number;
  bestRank: number | null;
}

const defaultStats: ProfileStatsResponse = {
  totalGames: 0,
  wins: 0,
  winRate: 0,
  totalWon: 0,
  highestScore: 0,
  avgScore: 0,
  currentStreak: 0,
  bestRank: null,
};
export async function GET(request: NextRequest) {
  try {
    const farcasterId = request.headers.get("x-farcaster-id");
    if (!farcasterId || !/^\d+$/.test(farcasterId)) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or missing Farcaster ID header" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { fid: Number(farcasterId) },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json(defaultStats);
    }

    const scores = await prisma.score.findMany({
      where: { userId: user.id },
      include: {
        game: { select: { endTime: true, id: true } },
      },
    });

    // 4. Handle No Games Played
    const totalGames = scores.length;
    if (totalGames === 0) {
      return NextResponse.json(defaultStats);
    }

    let wins = 0;
    let totalWon = 0;
    let highestScore = 0;
    let bestRank: number | null = null;

    const gameIds = [...new Set(scores.map((s) => s.gameId))];
    const allGameScores = await prisma.score.findMany({
      where: { gameId: { in: gameIds } },
      select: { gameId: true, userId: true, points: true },
      orderBy: { points: "desc" },
    });

    const scoresByGame = allGameScores.reduce((acc, score) => {
      if (!acc[score.gameId]) {
        acc[score.gameId] = [];
      }
      acc[score.gameId].push(score);
      return acc;
    }, {} as Record<number, { userId: number; points: number }[]>);

    for (const s of scores) {
      totalWon += s.points;
      highestScore = Math.max(highestScore, s.points);

      const gameScores = scoresByGame[s.gameId] || [];
      const rank = gameScores.findIndex((gs) => gs.userId === user.id) + 1;

      if (rank > 0) {
        if (rank === 1) {
          wins++;
        }
        bestRank = Math.min(bestRank ?? Infinity, rank);
      } else {
        console.warn(
          `User ${user.id} score not found within game ${s.gameId} scores during rank calculation.`
        );
      }
    }

    const sortedScores = [...scores].sort((a, b) => {
      const aTime = a.game.endTime?.getTime() ?? 0;
      const bTime = b.game.endTime?.getTime() ?? 0;
      return bTime - aTime;
    });

    let currentStreak = 0;
    if (sortedScores.length > 0) {
      const latestScore = sortedScores[0];
      const latestGameScores = scoresByGame[latestScore.gameId] || [];
      const latestRank =
        latestGameScores.findIndex((gs) => gs.userId === user.id) + 1;
      if (latestRank === 1) {
        currentStreak = 1;
        for (let i = 1; i < sortedScores.length; i++) {
          const current = sortedScores[i];
          const prevGameScores = scoresByGame[current.gameId] || [];
          const prevRank =
            prevGameScores.findIndex((gs) => gs.userId === user.id) + 1;
          if (prevRank === 1) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
    }

    const avgScore = totalGames > 0 ? totalWon / totalGames : 0;
    const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;

    const responseData: ProfileStatsResponse = {
      totalGames,
      wins,
      winRate: Math.round(winRate * 10) / 10,
      totalWon,
      highestScore,
      avgScore: Math.round(avgScore * 100) / 100,
      currentStreak,
      bestRank: bestRank === Infinity ? null : bestRank,
    };
    return NextResponse.json(responseData);
  } catch (error) {
    console.error("GET /api/profile/stats Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Ensure dynamic execution for potentially updated stats
export const dynamic = "force-dynamic";
