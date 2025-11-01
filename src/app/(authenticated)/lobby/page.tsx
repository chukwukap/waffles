import LobbyPageClientImpl from "./lobbyClient";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

import { redirect } from "next/navigation";

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
  const now = new Date();
  const game = await prisma.game.findFirst({
    where: { endTime: { gt: now } },
    include: {
      config: true,
      questions: { orderBy: { id: "asc" } },
      _count: { select: { tickets: true } },
    },
    orderBy: { startTime: "asc" },
  });

  // if there is no active game, redirect to waitlist
  if (!game) {
    console.info("No active game found, redirecting to waitlist");
    return redirect(`/waitlist?fid=${fid}`);
  }

  const userInfo = await prisma.user.findUnique({
    where: { fid: Number(fid) },
    select: {
      fid: true,
      imageUrl: true,
      name: true,
      _count: { select: { tickets: true } },
    },
  });

  // if (!userInfo) {
  //   return null;
  //   return (
  //     <div className="flex flex-col items-center justify-center min-h-[80dvh] text-center px-4">
  //       User not found. likely not onboarded yet
  //     </div>
  //   );
  // }

  return <LobbyPageClientImpl activeGame={game} userInfo={userInfo} />;
}
