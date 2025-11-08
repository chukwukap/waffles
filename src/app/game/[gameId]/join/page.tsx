import JoinGameClient from "./client";
import { prisma } from "@/lib/db";

export default async function JoinGamePage({
  searchParams,
}: {
  searchParams: Promise<{ gameId: string; fid: string }>;
}) {
  const { gameId } = await searchParams;

  const joinedCount = await prisma.gameParticipant.count({
    where: {
      gameId: Number(gameId),
    },
  });

  return <JoinGameClient gameId={gameId} joinedCount={joinedCount} />;
}
