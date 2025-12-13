import TicketPageClientImpl from "./client";
import { prisma } from "@/lib/db";
import { cache } from "react";
import { Prisma } from "../../../../../../../prisma/generated/client";

export type TicketPageGameInfo = Prisma.GameGetPayload<{
  select: {
    id: true;
    title: true;
    description: true;
    coverUrl: true;
    startsAt: true;
    endsAt: true;
    theme: true;
    entryFee: true;
    prizePool: true;
    maxPlayers: true;
    _count: {
      select: {
        tickets: true;
      };
    };
  };
}>;

// Game data is public - can be fetched server-side
const getGameInfo = cache(async (gameIdNum: number) => {
  return prisma.game.findUnique({
    where: { id: gameIdNum },
    select: {
      id: true,
      title: true,
      description: true,
      coverUrl: true,
      startsAt: true,
      endsAt: true,
      theme: true,
      entryFee: true,
      prizePool: true,
      maxPlayers: true,
      _count: {
        select: {
          tickets: true,
        },
      },
    },
  });
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
