import { Metadata } from "next";
import { cache } from "react";

import { prisma, Prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { minikitConfig } from "../../../../../minikit.config";

import LobbyClient from "./_components/LobbyClient";

export const metadata: Metadata = {
  title: minikitConfig.miniapp.name,
  description: minikitConfig.miniapp.description,
  other: {
    "fc:frame": JSON.stringify({
      version: minikitConfig.miniapp.version,
      imageUrl: minikitConfig.miniapp.heroImageUrl,
      button: {
        title: "Play Waffles",
        action: {
          name: "Play now",
          type: "launch_frame",
          url: `${env.rootUrl}/game`,
          splashImageUrl: minikitConfig.miniapp.splashImageUrl,
          splashBackgroundColor: minikitConfig.miniapp.splashBackgroundColor,
        },
      },
    }),
  },
};

// Game type for the lobby
export type LobbyGame = Prisma.GameGetPayload<{
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

// Shared select for game queries
const gameSelect = {
  id: true,
  title: true,
  theme: true,
  status: true,
  startsAt: true,
  endsAt: true,
  entryFee: true,
  prizePool: true,
  _count: { select: { tickets: true, players: true } },
} as const;

// Fetch next upcoming/live game and past games
const getGames = cache(async () => {
  // Get the next game (LIVE first, then SCHEDULED)
  const nextGame = await prisma.game.findFirst({
    where: { status: { in: ["LIVE", "SCHEDULED"] } },
    orderBy: [
      { status: "asc" }, // LIVE comes before SCHEDULED alphabetically
      { startsAt: "asc" },
    ],
    select: gameSelect,
  });

  // Get recent ended games
  const pastGames = await prisma.game.findMany({
    where: { status: "ENDED" },
    orderBy: { endsAt: "desc" },
    take: 10,
    select: gameSelect,
  });

  return { nextGame, pastGames };
});

export default async function GameLobbyPage() {
  const { nextGame, pastGames } = await getGames();

  return <LobbyClient nextGame={nextGame} pastGames={pastGames} />;
}

export const revalidate = 3;

