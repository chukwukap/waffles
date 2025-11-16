import TicketPageClientImpl from "./client";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

import { BottomNav } from "@/components/BottomNav";

export type TicketPageUserInfo = Prisma.UserGetPayload<{
  select: {
    fid: true;
    imageUrl: true;
    name: true;
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
    name: true;
    description: true;
    startTime: true;
    endTime: true;
    config: true;
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
  searchParams: Promise<{ fid: string }>;
}) {
  const { gameId } = await params;
  const { fid } = await searchParams;

  if (!fid) {
    console.warn("FID NOT FOUND");
    return null;
  }

  const gameIdNum = Number(gameId);
  if (isNaN(gameIdNum)) {
    throw new Error("Invalid game ID");
  }

  const getGameInfo = async () => {
    return prisma.game
      .findUnique({
        where: { id: gameIdNum },
        select: {
          id: true,
          name: true,
          description: true,
          startTime: true,
          endTime: true,
          config: true,
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
        tickets: {
          where: {
            gameId: gameIdNum,
          },
        },
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
