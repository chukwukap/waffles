import LiveGameClient from "./client";
import { prisma } from "@/lib/db";

export const revalidate = 0;

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
        where: {
          gameId: Number(gameId),
        },
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
      _count: {
        select: {
          answers: {
            where: {
              gameId: Number(gameId),
              userId: Number(fid),
            },
          },
        },
      },
    },
  });
  const userInfoPromise = prisma.user.findUnique({
    where: { fid: Number(fid) },
    include: {
      _count: {
        select: {
          answers: {
            where: {
              gameId: Number(gameId),
            },
          },
        },
      },
    },
  });

  return (
    <LiveGameClient
      gameInfoPromise={gameInfoPromise}
      userInfoPromise={userInfoPromise}
    />
  );
}
