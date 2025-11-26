import { cache } from "react";
import { prisma } from "@/lib/db";
import ScorePageClient from "./client";

import { redirect } from "next/navigation";

export type ScorePagePayload = {
  userInfo: {
    username: string;
    pfpUrl: string;
  };
  category: string;
  winnings: number;
  score: number;
  rank: number;
  percentile: number;
  leaderboard: Array<{
    username: string;
    pfpUrl: string;
    score: number;
  }>;
};

const getScorePagePayload = cache(
  async (gameId: number, fid: number): Promise<ScorePagePayload | null> => {
    if (!fid || isNaN(Number(fid))) return null;

    // Do all required DB reads in parallel
    const [gamePlayer, allPlayersInGame] = await Promise.all([
      // 1. Get this user's GamePlayer record, including their user info and the game theme
      prisma.gamePlayer.findFirst({
        where: {
          gameId: Number(gameId),
          user: { fid: Number(fid) },
        },
        include: {
          game: {
            select: {
              theme: true, // Get theme from Game
            },
          },
          user: {
            select: { id: true, pfpUrl: true, username: true, status: true },
          },
        },
      }),
      // 2. Get all players in this game, sorted by score, for ranking
      prisma.gamePlayer.findMany({
        where: { gameId: Number(gameId) },
        orderBy: { score: "desc" },
        include: {
          user: {
            select: { username: true, pfpUrl: true },
          },
        },
      }),
    ]);

    // Defensive: If user didn't play (no GamePlayer record), return null
    if (!gamePlayer || !gamePlayer.user) {
      return null;
    }

    // Enforce access control
    if (gamePlayer.user.status !== "ACTIVE") {
      redirect("/invite");
    }

    // 3. Calculate Rank and Percentile
    const userRank =
      allPlayersInGame.findIndex((p) => p.userId === gamePlayer.user.id) + 1;
    const totalPlayers = allPlayersInGame.length;
    const percentile =
      totalPlayers > 0
        ? Math.round(((totalPlayers - userRank) / totalPlayers) * 100)
        : 0;

    // 4. Placeholder for winnings logic
    // TODO: Implement real winnings calculation
    const winnings = userRank === 1 ? 50 : 0; // Example: Winner gets $50

    // 5. Format leaderboard (Top 3)
    const leaderboard = allPlayersInGame.slice(0, 3).map((p) => ({
      username: p.user?.username ?? "anon",
      pfpUrl: p.user?.pfpUrl ?? "", // Use new field
      score: p.score,
    }));

    return {
      userInfo: {
        username: gamePlayer.user.username ?? "Player",
        pfpUrl: gamePlayer.user.pfpUrl ?? "", // Use new field
      },
      category: gamePlayer.game?.theme ?? "UNKNOWN",
      winnings,
      score: gamePlayer.score ?? 0,
      rank: userRank,
      percentile,
      leaderboard,
    };
  }
);

export default async function ScorePage({
  params,
  searchParams,
}: {
  params: Promise<{ gameId: string }>;
  searchParams: Promise<{ fid: string }>;
}) {
  const { gameId } = await params;
  const { fid } = await searchParams;

  // Defensive: check params early
  if (!fid || isNaN(Number(fid)) || !gameId || isNaN(Number(gameId))) {
    return (
      <div className="flex flex-col text-white overflow-hidden">
        <p className="text-lg">Score not found.</p>
      </div>
    );
  }

  const scorePayloadPromise = getScorePagePayload(Number(gameId), Number(fid));

  return <ScorePageClient scorePayloadPromise={scorePayloadPromise} />;
}
