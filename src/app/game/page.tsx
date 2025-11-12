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
  const now = new Date();
  
  // First, try to find an active game (currently running)
  const activeGame = await prisma.game.findFirst({
    where: {
      startTime: { lte: now },
      endTime: { gt: now },
    },
    orderBy: { id: "desc" }, // Most recently created active game
    include: {
      config: true,
      _count: { select: { tickets: true, participants: true } },
    },
  });

  if (activeGame) {
    return activeGame;
  }

  // If no active game, find the most recently created upcoming game
  return prisma.game.findFirst({
    where: {
      startTime: { gt: now },
      endTime: { gt: now },
    },
    orderBy: { id: "desc" }, // Most recently created upcoming game
    include: {
      config: true,
      _count: { select: { tickets: true, participants: true } },
    },
  });
}
