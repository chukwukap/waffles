import { cache } from "react";
import { prisma } from "@/lib/db";
import type { Game } from "@prisma";
import { GameHeader } from "./game/_components/GameHeader";
import {
  GameProvider,
  type RecentPlayer,
} from "@/components/providers/GameProvider";

// Include entries for recent players display and question count
const gameInclude = {
  entries: {
    where: { paidAt: { not: null } },
    select: { user: { select: { pfpUrl: true, username: true } } },
    take: 10,
    orderBy: { createdAt: "desc" as const },
  },
  _count: {
    select: { questions: true },
  },
};

/**
 * Fetch current live game, next scheduled game, or most recent ended game.
 * Priority: Live > Scheduled > Last Ended
 * Includes recent player entries for avatar display.
 * Cached for request deduplication.
 */
const getCurrentOrNextGame = cache(
  async (): Promise<{
    game: (Game & { questionCount: number }) | null;
    recentPlayers: RecentPlayer[];
  }> => {
    const now = new Date();

    // First try to get current live or upcoming game
    const activeGame = await prisma.game.findFirst({
      where: {
        OR: [
          { startsAt: { lte: now }, endsAt: { gt: now } }, // Live
          { startsAt: { gt: now } }, // Scheduled
        ],
      },
      orderBy: [{ startsAt: "asc" }],
      include: gameInclude,
    });

    if (activeGame) {
      const { entries, _count, ...gameData } = activeGame;
      return {
        game: { ...gameData, questionCount: _count.questions },
        recentPlayers: entries.map((e) => ({
          username: e.user.username || "Player",
          pfpUrl: e.user.pfpUrl,
          timestamp: Date.now(),
        })),
      };
    }

    // Fallback: get most recent ended game
    const endedGame = await prisma.game.findFirst({
      where: { endsAt: { lte: now } },
      orderBy: [{ endsAt: "desc" }],
      include: gameInclude,
    });

    if (endedGame) {
      const { entries, _count, ...gameData } = endedGame;
      return {
        game: { ...gameData, questionCount: _count.questions },
        recentPlayers: entries.map((e) => ({
          username: e.user.username || "Player",
          pfpUrl: e.user.pfpUrl,
          timestamp: Date.now(),
        })),
      };
    }

    return { game: null, recentPlayers: [] };
  }
);

export default async function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { game, recentPlayers } = await getCurrentOrNextGame();

  return (
    <GameProvider game={game} initialRecentPlayers={recentPlayers}>
      <GameHeader />
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {children}
      </div>
    </GameProvider>
  );
}

// Force dynamic rendering for real-time data
export const dynamic = "force-dynamic";
