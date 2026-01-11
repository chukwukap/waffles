import { cache } from "react";
import { prisma } from "@/lib/db";
import type { Game } from "@prisma";
import { GameHeader } from "./game/_components/GameHeader";
import { GameProvider } from "@/components/providers/GameProvider";

/**
 * Fetch current live game or next scheduled game.
 * Cached for request deduplication.
 */
const getCurrentOrNextGame = cache(async (): Promise<Game | null> => {
  const now = new Date();

  return prisma.game.findFirst({
    where: {
      OR: [
        { startsAt: { lte: now }, endsAt: { gt: now } },
        { startsAt: { gt: now } },
      ],
    },
    orderBy: [{ startsAt: "asc" }],
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
