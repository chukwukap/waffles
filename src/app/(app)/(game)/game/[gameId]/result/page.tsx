import { cache } from "react";
import { prisma } from "@/lib/db";
import ResultPageClient from "./client";

export type ResultPagePayload = {
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

// Fetch public game data (leaderboard) for the result page
// Updated to use GameEntry instead of GamePlayer
const getGameLeaderboard = cache(async (gameId: number) => {
  const [game, allEntriesInGame] = await Promise.all([
    prisma.game.findUnique({
      where: { id: gameId },
      select: { theme: true, onchainId: true },
    }),
    prisma.gameEntry.findMany({
      where: { gameId, paidAt: { not: null } },
      orderBy: { score: "desc" },
      select: {
        score: true,
        rank: true,
        prize: true,
        claimedAt: true,
        user: {
          select: { fid: true, username: true, pfpUrl: true },
        },
      },
    }),
  ]);

  return { game, allPlayersInGame: allEntriesInGame };
});

export default async function ResultPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = await params;
  const gameIdNum = Number(gameId);

  if (isNaN(gameIdNum)) {
    return (
      <div className="flex flex-col text-white items-center justify-center min-h-full">
        <p className="text-lg">Invalid game ID</p>
      </div>
    );
  }

  // Fetch public leaderboard data server-side
  const leaderboardPromise = getGameLeaderboard(gameIdNum);

  // User-specific data (their result, rank) is fetched client-side with auth
  return <ResultPageClient leaderboardPromise={leaderboardPromise} gameId={gameIdNum} />;
}
