import { notFound } from "next/navigation";
import GameLobby from "./client";
import { prisma } from "@/lib/db";

export default async function GamePage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = await params;
  const gameInfo = await getGameById(gameId);
  if (!gameInfo) {
    return notFound();
  }
  return <GameLobby gameInfo={gameInfo} />;
}

async function getGameById(gameId: string) {
  const game = await prisma.game.findUnique({
    where: { id: Number(gameId) },
    select: {
      id: true,
      name: true,
      description: true,
      startTime: true,
      endTime: true,
      createdAt: true,
      config: true,
      _count: { select: { tickets: true } },
    },
  });
  return game;
}
