import GameHomePageClient from "./client";
import { prisma } from "@/lib/db";

export default async function GameHomePage() {
  const upcomingOrActiveGamePromise = getUpComingOrActiveGame();

  return (
    <GameHomePageClient
      upcomingOrActiveGamePromise={upcomingOrActiveGamePromise}
    />
  );
}

async function getUpComingOrActiveGame() {
  return prisma.game.findFirst({
    orderBy: { startTime: "asc" },
    include: {
      config: true,
      _count: { select: { tickets: true, participants: true } },
    },
    where: {
      // Show a game that is either *
      // - currently ongoing (now between startTime and endTime)
      // - OR upcoming (now < startTime)
      // We'll pick the earliest such game.
      endTime: { gt: new Date() },
    },
  });
}
