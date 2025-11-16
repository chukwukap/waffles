import HistoryClient from "./_components/historyClient";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { GameHistoryEntry } from "@/lib/types";

const getGameHistory = cache(
  async (fid: number): Promise<GameHistoryEntry[]> => {
    // 1. Find last 14 participations in games for the user (like in main profile route)
    const participants = await prisma.gameParticipant.findMany({
      where: { userId: fid },
      orderBy: { joinedAt: "desc" },
      take: 14,
      include: {
        game: { select: { id: true, name: true, startTime: true } },
      },
    });

    const participatedGameIds = participants.map((p) => p.gameId);

    // 2. Fetch all scores for those games, for all users in those games (for placement)
    let allHistoryScores: { gameId: number; userId: number; points: number }[] =
      [];
    let allTickets: { gameId: number; amountUSDC: number }[] = [];
    if (participatedGameIds.length > 0) {
      [allHistoryScores, allTickets] = await Promise.all([
        prisma.score.findMany({
          where: { gameId: { in: participatedGameIds } },
          select: { gameId: true, userId: true, points: true },
        }),
        prisma.ticket.findMany({
          where: {
            userId: fid,
            gameId: { in: participatedGameIds },
            status: "confirmed",
          },
          select: { gameId: true, amountUSDC: true },
        }),
      ]);
    }

    // Index the scores for each game
    const historyScoresByGame: Record<
      number,
      { userId: number; points: number }[]
    > = {};
    for (const s of allHistoryScores) {
      if (!historyScoresByGame[s.gameId]) historyScoresByGame[s.gameId] = [];
      historyScoresByGame[s.gameId].push({
        userId: s.userId,
        points: s.points,
      });
    }

    // Compose each game history entry
    const gameHistory: GameHistoryEntry[] = participants.map((p) => {
      const playersInGame = (historyScoresByGame[p.gameId] ?? []).sort(
        (a, b) => b.points - a.points
      );
      const scoreObj = playersInGame.find((i) => i.userId === fid);
      const ticket = allTickets.find((t) => t.gameId === p.gameId);
      const winnings = ticket ? ticket.amountUSDC : 0;
      return {
        id: p.game.id,
        name: p.game.name ?? "Game",
        score: scoreObj?.points ?? 0,
        winnings: winnings,
        winningsColor: winnings > 0 ? "green" : "gray",
      };
    });

    return gameHistory;
  }
);

export default async function GameHistoryPage({
  params,
}: {
  params: Promise<{ fid: string }>;
}) {
  const { fid } = await params;
  if (!fid) {
    return null;
  }
  const gameHistoryPromise = getGameHistory(Number(fid));

  return <HistoryClient payloadPromise={gameHistoryPromise} />;
}
