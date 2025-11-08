import { notFound } from "next/navigation";
import LiveGameClient from "./client";
import { prisma } from "@/lib/db";

export default async function LiveGamePage({
  searchParams,
}: {
  searchParams: Promise<{ gameId: string; fid: string }>;
}) {
  const { gameId, fid } = await searchParams;
  const gameInfo = await prisma.game.findUnique({
    where: { id: Number(gameId) },
    include: {
      config: true,
      questions: true,
      _count: { select: { answers: true } },
    },
  });
  const userInfo = await prisma.user.findUnique({
    where: { fid: Number(fid) },
    include: {
      _count: { select: { answers: true } },
    },
  });
  if (!gameInfo || !userInfo) {
    console.error("Game or user not found");
    return notFound();
  }
  return <LiveGameClient gameInfo={gameInfo} userInfo={userInfo} />;
}
