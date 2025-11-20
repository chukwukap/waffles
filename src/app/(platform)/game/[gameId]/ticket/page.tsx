import TicketPageClientImpl from "./client";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

import { BottomNav } from "@/components/BottomNav";
import { cache } from "react";
import { redirect } from "next/navigation";

// This type is still correct
export type TicketPageUserInfo = Prisma.UserGetPayload<{
  select: {
    fid: true;
    username: true; // Use new 'username' field
    pfpUrl: true; // Use new 'pfpUrl' field
    status: true; // Added status
    tickets: {
      where: {
        gameId: number;
      };
    };
  };
}>;

// This type is UPDATED to reflect the new schema
export type TicketPageGameInfo = Prisma.GameGetPayload<{
  select: {
    id: true;
    title: true;
    description: true;
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

// This is the server component
export default async function TicketPage({
  params,
  searchParams,
}: {
  params: Promise<{ gameId: string }>;
  searchParams: Promise<{ fid: string; ticketCode?: string }>; // Added ticketCode
}) {
  const { gameId } = await params;
  const { fid, ticketCode } = await searchParams; // Added ticketCode

  if (!fid) {
    redirect("/invite");
  }

  const gameIdNum = Number(gameId);
  if (isNaN(gameIdNum)) {
    throw new Error("Invalid game ID");
  }

  // UPDATED getGameInfo to use new schema
  const getGameInfo = cache(async () => {
    return prisma.game
      .findUnique({
        where: { id: gameIdNum },
        select: {
          id: true,
          title: true,
          description: true,
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

  // UPDATED getUserInfo to use new field names
  const getUserInfo = cache(async (fid: number | null) => {
    if (fid === null || isNaN(Number(fid))) {
      return null;
    }
    return prisma.user.findUnique({
      where: { fid },
      select: {
        fid: true,
        username: true, // Use new 'username' field
        pfpUrl: true, // Use new 'pfpUrl' field
        status: true, // Added status
        tickets: {
          where: {
            gameId: gameIdNum,
          },
        },
      },
    });
  });

  const gameInfoPromise = getGameInfo();
  const userInfoPromise = getUserInfo(Number(fid));

  // Enforce access control
  const userInfo = await userInfoPromise;
  if (!userInfo || userInfo.status !== "ACTIVE") {
    redirect("/invite");
  }

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
