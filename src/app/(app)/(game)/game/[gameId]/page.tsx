import { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { Prisma, prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { minikitConfig } from "../../../../../../minikit.config";

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

  const title = game?.title ?? "Game Lobby";
  const description = game
    ? `Join ${game.title} - Prize pool growing!`
    : minikitConfig.miniapp.description;

  return {
    title,
    description,
    other: {
      "fc:frame": JSON.stringify({
        version: minikitConfig.miniapp.version,
        imageUrl: minikitConfig.miniapp.heroImageUrl,
        button: {
          title: "Play Now",
          action: {
            name: "Play Waffles",
            type: "launch_frame",
            url: `${env.rootUrl}/game/${gameId}`,
            splashImageUrl: minikitConfig.miniapp.splashImageUrl,
            splashBackgroundColor: minikitConfig.miniapp.splashBackgroundColor,
          },
        },
      }),
    },
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

