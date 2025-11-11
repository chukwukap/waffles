import LiveGameClient from "./client";
import { prisma } from "@/lib/db";

export default async function LiveGamePage({
  searchParams,
}: {
  searchParams: Promise<{ gameId: string; fid: string }>;
}) {
  const { gameId, fid } = await searchParams;
  const gameInfoPromise = prisma.game.findUnique({
    where: { id: Number(gameId) },
    include: {
      config: true,
      questions: {
        include: {
          round: {
            select: {
              id: true,
              roundNum: true,
            },
          },
        },
        orderBy: {
          id: "asc",
        },
      },
      _count: { select: { answers: true } },
    },
  });
  const userInfoPromise = prisma.user.findUnique({
    where: { fid: Number(fid) },
    include: {
      _count: { select: { answers: true } },
    },
  });

  return (
    <LiveGameClient
      gameInfoPromise={gameInfoPromise}
      userInfoPromise={userInfoPromise}
    />
  );
}
