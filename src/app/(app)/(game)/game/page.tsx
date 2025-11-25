import { BottomNav } from "@/components/BottomNav";
import GameHomePageClient from "./client";
import { Prisma, prisma } from "@/lib/db";

import { Metadata } from "next";
import { minikitConfig } from "../../../../../minikit.config";

import { cache } from "react";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: minikitConfig.miniapp.name,
    description: minikitConfig.miniapp.description,
    other: {
      "fc:frame": JSON.stringify({
        version: minikitConfig.miniapp.version,
        imageUrl: minikitConfig.miniapp.heroImageUrl,
        button: {
          title: `Play now`,
          action: {
            name: `Play now`,
            type: "launch_frame",
            url: minikitConfig.miniapp.homeUrl,
            splashImageUrl: minikitConfig.miniapp.splashImageUrl,
            splashBackgroundColor: minikitConfig.miniapp.splashBackgroundColor,
          },
        },
      }),
    },
  };
}

// Define the type for the payload, based on the *new* schema
export type UpcomingGamePayload = Prisma.GameGetPayload<{
  select: {
    id: true;
    startsAt: true;
    endsAt: true;
    entryFee: true;
    prizePool: true;
    _count: { select: { tickets: true; players: true } };
  };
}>;

const getUpComingOrActiveGame = cache(
  async (): Promise<UpcomingGamePayload | null> => {
    const now = new Date();

    // Find the most recently created game that is currently LIVE
    // Only LIVE games should be available for play
    return prisma.game.findFirst({
      where: {
        endsAt: { gt: now }, // Game hasn't ended yet
        status: "LIVE", // Only LIVE games can be played
      },
      orderBy: { startsAt: "asc" },
      select: {
        id: true,
        startsAt: true,
        endsAt: true,
        entryFee: true, // Merged from GameConfig
        prizePool: true, // Merged from GameConfig
        _count: {
          select: {
            tickets: true,
            players: true, // Renamed from `participants`
          },
        },
      },
    });
  }
);

export default async function GameHomePage() {
  const upcomingOrActiveGamePromise = getUpComingOrActiveGame();

  return (
    <>
      <GameHomePageClient
        upcomingOrActiveGamePromise={upcomingOrActiveGamePromise}
      />
      <BottomNav />
    </>
  );
}

export const dynamic = "force-dynamic";
