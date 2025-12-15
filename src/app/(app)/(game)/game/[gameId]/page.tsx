import { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { Prisma, prisma } from "@/lib/db";

import GameDetailsClient from "./client";

// Type for game data
export type GameDetails = Prisma.GameGetPayload<{
  select: {
    id: true;
    title: true;
    theme: true;
    status: true;
    startsAt: true;
    endsAt: true;
    entryFee: true;
    prizePool: true;
    _count: { select: { tickets: true; players: true } };
  };
}>;

// Cached game fetch
const getGame = cache(async (gameId: string): Promise<GameDetails | null> => {
  const id = parseInt(gameId, 10);
  if (isNaN(id)) return null;

  return prisma.game.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      theme: true,
      status: true,
      startsAt: true,
      endsAt: true,
      entryFee: true,
      prizePool: true,
      _count: { select: { tickets: true, players: true } },
    },
  });
});

// Dynamic metadata
export async function generateMetadata({
  params,
}: {
  params: Promise<{ gameId: string }>;
}): Promise<Metadata> {
  const { gameId } = await params;
  const game = await getGame(gameId);

  return {
    title: game?.title ?? "Game Lobby",
    description: game
      ? `Join ${game.title} - Prize pool growing!`
      : "Play trivia games and win prizes!",
  };
}

export default async function GameDetailsPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = await params;
  const game = await getGame(gameId);

  if (!game) notFound();

  return <GameDetailsClient game={game} />;
}

export const revalidate = 3;
