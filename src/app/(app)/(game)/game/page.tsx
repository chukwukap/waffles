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
    // Fetch games and sort by priority: LIVE → SCHEDULED → ENDED
    const games = await prisma.game.findMany({
      where: {
        status: { in: ["LIVE", "SCHEDULED", "ENDED"] },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        startsAt: true,
        endsAt: true,
        entryFee: true,
        prizePool: true,
        status: true,
        _count: {
          select: {
            tickets: true,
            players: true,
          },
        },
      },
    });

    // Define priority order
    const statusPriority: Record<string, number> = {
      LIVE: 1,
      SCHEDULED: 2,
      ENDED: 3,
      CANCELLED: 4
    };

    // Sort by status priority, then by createdAt (already sorted desc)
    const sortedGames = games.sort((a, b) => {
      const priorityDiff = statusPriority[a.status] - statusPriority[b.status];
      return priorityDiff;
    });

    // Return the first game (highest priority, most recent)
    const game = sortedGames[0];
    if (!game) return null;

    // Remove status from the return type to match UpcomingGamePayload
    const { status, ...gameWithoutStatus } = game;
    return gameWithoutStatus;
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
