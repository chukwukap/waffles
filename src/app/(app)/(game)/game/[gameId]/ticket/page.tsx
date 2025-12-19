import TicketPageClientImpl from "./client";
import { prisma } from "@/lib/db";
import { cache } from "react";

// Updated type for new schema (ticketPrice, entries instead of tickets)
export type TicketPageGameInfo = {
  id: number;
  onchainId: string | null; // bytes32 for on-chain interactions
  title: string;
  description: string | null;
  coverUrl: string | null;
  startsAt: Date;
  endsAt: Date;
  theme: string;
  ticketPrice: number;
  prizePool: number;
  maxPlayers: number;
  playerCount: number;
};

// Game data is public - can be fetched server-side
const getGameInfo = cache(async (gameIdNum: number): Promise<TicketPageGameInfo | null> => {
  const game = await prisma.game.findUnique({
    where: { id: gameIdNum },
    select: {
      id: true,
      onchainId: true,
      title: true,
      description: true,
      coverUrl: true,
      startsAt: true,
      endsAt: true,
      theme: true,
      tierPrices: true,
      prizePool: true,
      maxPlayers: true,
      playerCount: true,
    },
  });

  if (!game) return null;

  return {
    ...game,
    ticketPrice: game.tierPrices[0] ?? 0,
  };
});

export default async function TicketPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = await params;
  const gameIdNum = Number(gameId);

  if (isNaN(gameIdNum)) {
    throw new Error("Invalid game ID");
  }

  // Fetch public game data server-side
  const gameInfo = await getGameInfo(gameIdNum);

  if (!gameInfo) {
    throw new Error("Game not found");
  }

  // User data is fetched client-side via authenticated API
  return <TicketPageClientImpl gameInfo={gameInfo} />;
}
