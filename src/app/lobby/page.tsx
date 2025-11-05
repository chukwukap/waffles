"use server";
import LobbyPageClientImpl from "./lobbyClient";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { cache, Suspense } from "react";

import { BottomNav } from "@/components/BottomNav";
import { Spinner } from "@/components/ui/spinner";
import Header from "@/components/Header";

export type LobbyPageUserInfo = Prisma.UserGetPayload<{
  select: {
    fid: true;
    imageUrl: true;
    name: true;
    _count: { select: { tickets: true } };
  };
}>;

export type LobbyPageGameInfo = Prisma.GameGetPayload<{
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
export default async function LobbyPage({
  searchParams,
}: {
  searchParams: Promise<{ fid: string }>;
}) {
  const { fid } = await searchParams;

  if (!fid) {
    console.warn("FID NOT FOUND");
    return null;
  }

  const getGameInfo = cache(async () => {
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
  });

  const getUserInfo = cache(async (fid: number | null) => {
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
  });

  const gameInfoPromise = getGameInfo();
  const userInfoPromise = getUserInfo(Number(fid));

  return (
    <div className="min-h-screen flex flex-col text-white ">
      <Header />
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center">
            <Spinner />
          </div>
        }
      >
        <LobbyPageClientImpl
          gameInfoPromise={gameInfoPromise}
          userInfoPromise={userInfoPromise}
        />
      </Suspense>
      <BottomNav />
    </div>
  );
}
