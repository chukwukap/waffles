import { BottomNav } from "@/components/BottomNav";
import GameHomePageClient from "./client";
import { prisma } from "@/lib/db";

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
