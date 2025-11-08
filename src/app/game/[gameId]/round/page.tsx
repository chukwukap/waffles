import { notFound } from "next/navigation";
import RoundCountdownView from "./client";
import { prisma } from "@/lib/db";

export default async function RoundPage({
  searchParams,
}: {
  searchParams: Promise<{ gameId: string }>;
}) {
  const { gameId } = await searchParams;

  const gameInfo = await prisma.game.findUnique({
    where: { id: Number(gameId) },
    include: {
      config: { select: { roundTimeLimit: true } },
    },
  });

  if (!gameInfo) {
    return notFound();
  }

  return <RoundCountdownView gameInfo={gameInfo} />;
}
