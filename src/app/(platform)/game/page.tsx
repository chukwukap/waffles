import { BottomNav } from "@/components/BottomNav";
import GameHomePageClient from "./client";
import { prisma } from "@/lib/db";

import { Metadata } from "next";
import { minikitConfig } from "../../../../minikit.config";

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

async function getUpComingOrActiveGame() {
  const now = new Date();

  // Find the most recently created game that hasn't ended yet
  // Single query: gets active or upcoming games, ordered by most recent first
  return prisma.game.findFirst({
    where: {
      endTime: { gt: now },
    },
    orderBy: { id: "desc" }, // Most recently created game
    include: {
      config: true,
      _count: { select: { tickets: true, participants: true } },
    },
  });
}

export const dynamic = "force-dynamic";
