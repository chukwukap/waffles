import TicketPageClientImpl from "./client";
import { prisma } from "@/lib/db";

import { BottomNav } from "@/components/BottomNav";
import { cache } from "react";
import { redirect } from "next/navigation";
import { Prisma } from "../../../../../../../prisma/generated/client";


export type TicketPageUserInfo = Prisma.UserGetPayload<{
  select: {
    fid: true;
    username: true;
    pfpUrl: true;
    status: true;
    tickets: {
      where: {
        gameId: number;
      };
    };
  };
}>;

export type TicketPageGameInfo = Prisma.GameGetPayload<{
  select: {
    id: true;
    title: true;
    description: true;
    coverUrl: true;
    startsAt: true;
    endsAt: true;
    theme: true;
    entryFee: true;
    prizePool: true;
    maxPlayers: true;
    _count: {
      select: {
        tickets: {
          where: {
            gameId: number;
          };
        };
      };
    };
  };
}>;

export default async function TicketPage({
  params,
  searchParams,
}: {
  params: Promise<{ gameId: string }>;
  searchParams: Promise<{ fid: string; ticketCode?: string }>;
}) {
  const { gameId } = await params;
  const { fid, ticketCode } = await searchParams;

  if (!fid) {
    throw new Error("Missing fid");
  }

  const gameIdNum = Number(gameId);
  if (isNaN(gameIdNum)) {
    throw new Error("Invalid game ID");
  }

  const getGameInfo = cache(async () => {
    return prisma.game
      .findUnique({
        where: { id: gameIdNum },
        select: {
          id: true,
          title: true,
          description: true,
          coverUrl: true,
          startsAt: true,
          endsAt: true,
          theme: true,
          entryFee: true,
          prizePool: true,
          maxPlayers: true,
          _count: {
            select: {
              tickets: {
                where: {
                  gameId: gameIdNum,
                },
              },
            },
          },
        },
      })
      .then((game) => {
        if (!game) {
          throw new Error("Game not found");
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
        username: true,
        pfpUrl: true,
        status: true,
        tickets: {
          where: {
            gameId: gameIdNum,
            user: {
              fid,
            }
          },
        },
      },
    });
  });

  // Await data in server component
  const [gameInfo, userInfo] = await Promise.all([
    getGameInfo(),
    getUserInfo(Number(fid)),
  ]);

  if (!userInfo || userInfo.status !== "ACTIVE") {
    redirect("/invite");
  }

  return (
    <>
      <TicketPageClientImpl
        gameInfo={gameInfo}
        userInfo={userInfo}
      />

      <BottomNav />
    </>
  );
}
