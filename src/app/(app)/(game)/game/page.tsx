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
    // Priority order: SCHEDULED → LIVE → ENDED
    // Return the most recently created game from the highest priority status
    const selectFields = {
      id: true,
      startsAt: true,
      endsAt: true,
      entryFee: true,
      prizePool: true,
      _count: {
        select: {
          tickets: true,
          players: true,
        },
      },
    };

    // Try SCHEDULED first
    const scheduledGame = await prisma.game.findFirst({
      where: { status: "SCHEDULED" },
      orderBy: { createdAt: "desc" },
      select: selectFields,
    });

    if (scheduledGame) return scheduledGame;

    // Try LIVE second
    const liveGame = await prisma.game.findFirst({
      where: { status: "LIVE" },
      orderBy: { createdAt: "desc" },
      select: selectFields,
    });

    if (liveGame) return liveGame;

    // Try ENDED last
    const endedGame = await prisma.game.findFirst({
      where: { status: "ENDED" },
      orderBy: { createdAt: "desc" },
      select: selectFields,
    });

    return endedGame;
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
