import TicketPageClientImpl from "./client";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

import { BottomNav } from "@/components/BottomNav";

export type TicketPageUserInfo = Prisma.UserGetPayload<{
  select: {
    fid: true;
    imageUrl: true;
    name: true;
    _count: { select: { tickets: true } };
  };
}>;

export type TicketPageGameInfo = Prisma.GameGetPayload<{
  select: {
    id: true;
    name: true;
    description: true;
    startTime: true;
    endTime: true;
    config: true;
    _count: { select: { tickets: true } };
  };
}>;

export default async function TicketPage({
  searchParams,
}: {
  searchParams: Promise<{ fid: string }>;
}) {
  const { fid } = await searchParams;

  if (!fid) {
    console.warn("FID NOT FOUND");
    return null;
  }

  const getGameInfo = async () => {
    const now = new Date();
    return prisma.game
      .findFirst({
        where: { endTime: { gt: now } },
        include: {
          config: true,
          questions: { orderBy: { id: "asc" } },
          _count: { select: { tickets: true } },
        },
        orderBy: { startTime: "asc" },
      })
      .then((game) => {
        if (!game) {
          throw new Error("Game not found or is not active");
        }
        return game;
      });
  };

  const getUserInfo = async (fid: number | null) => {
    if (fid === null || isNaN(Number(fid))) {
      return null;
    }
    return prisma.user.findUnique({
      where: { fid },
      select: {
        fid: true,
        imageUrl: true,
        name: true,
        _count: { select: { tickets: true } },
      },
    });
  };

  const gameInfoPromise = getGameInfo();
  const userInfoPromise = getUserInfo(Number(fid));

  return (
    <>
      <TicketPageClientImpl
        gameInfoPromise={gameInfoPromise}
        userInfoPromise={userInfoPromise}
      />

      <BottomNav />
    </>
  );
}
