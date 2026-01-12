import { cache } from "react";
import { prisma } from "@/lib/db";
import type { Game } from "@prisma";
import { GameHeader } from "./game/_components/GameHeader";
import { GameProvider } from "@/components/providers/GameProvider";

/**
 * Fetch current live game, next scheduled game, or most recent ended game.
 * Priority: Live > Scheduled > Last Ended
 * Cached for request deduplication.
 */
const getCurrentOrNextGame = cache(async (): Promise<Game | null> => {
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
  });

  if (activeGame) return activeGame;

  // Fallback: get most recent ended game
  return prisma.game.findFirst({
    where: { endsAt: { lte: now } },
    orderBy: [{ endsAt: "desc" }],
  });
});

export default async function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const game = await getCurrentOrNextGame();

  return (
    <GameProvider game={game}>
      <GameHeader />
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {children}
      </div>
    </GameProvider>
  );
}

// Force dynamic rendering for real-time data
export const dynamic = "force-dynamic";
