import { GameClientImpl } from "./gameClientImpl";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { cache, Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";
import { redirect } from "next/navigation";
import { GameHeader } from "./_components/GameHeader";

export type NeccessaryUserInfo = Prisma.UserGetPayload<{
  select: {
    fid: true;
    imageUrl: true;
    name: true;
    _count: {
      select: {
        tickets: { where: { gameId: number } };
        answers: { where: { gameId: number } };
        gameParticipants: { where: { gameId: number } };
      };
    };
  };
}>;

export type NeccessaryGameInfo = {
  id: number;
  name: string;
  description: string | null;
  startTime: Date;
  endTime: Date;
  createdAt: Date;
  config: {
    ticketPrice: number | null;
    roundTimeLimit: number | null;
    questionsPerGame: number | null;
    maxPlayers: number | null;
    soundEnabled: boolean | null;
    additionPrizePool: number | null;
    questionTimeLimit: number | null;
    theme: string | null;
    scoreMultiplier: number | null;
    scorePenalty: number | null;
  } | null;
  questions: Array<{
    id: number;
    text: string;
    imageUrl: string | null;
    options: string[];
    soundUrl: string | null;
    round: {
      id: number;
      roundNum: number;
      _count: {
        questions: number;
      };
    };
    _count: {
      answers: number;
    };
  }>;
  _count: {
    tickets: number;
    participants: number;
    questions: number;
    rounds: number;
  };
};

export default async function GamePage(props: {
  params: Promise<{ gameId: string }>;
  searchParams: Promise<{ fid: string }>;
}) {
  const { gameId } = await props.params;
  const { fid } = await props.searchParams;
  const gameIdNum = Number(gameId);
  const fidNum = Number(fid);

  if (isNaN(gameIdNum) || isNaN(fidNum)) {
    redirect("/lobby"); // Redirect if params are invalid
  }

  const getGameInfo = cache(async (gameId: number) => {
    if (isNaN(Number(gameId))) {
      return null;
    }
    return prisma.game
      .findUnique({
        where: { id: gameId },
        select: {
          id: true,
          name: true,
          description: true,
          startTime: true,
          endTime: true,
          createdAt: true,
          config: {
            select: {
              ticketPrice: true,
              roundTimeLimit: true,
              questionsPerGame: true,
              maxPlayers: true,
              soundEnabled: true,
              additionPrizePool: true,
              questionTimeLimit: true,
              theme: true,
              scoreMultiplier: true,
              scorePenalty: true,
            },
          },
          questions: {
            select: {
              id: true,
              text: true,
              imageUrl: true,
              options: true,
              soundUrl: true,
              round: {
                select: {
                  id: true,
                  roundNum: true,
                  _count: {
                    select: {
                      questions: true,
                    },
                  },
                },
              },
              _count: { select: { answers: true } },
            },
            // Sort questions so those in earlier rounds come before those in later rounds
            orderBy: [{ round: { roundNum: "asc" } }],
          },
          _count: {
            select: {
              tickets: true,
              participants: true,
              questions: true,
              rounds: true,
            },
          },
        },
      })
      .then((game) => {
        if (!game) {
          return null;
        }
        // check if game has ended:
        const now = Date.now();
        const end = game.endTime.getTime();
        const isGameOver = now > end;

        // --- FIX: Redirect to score page if game is over ---
        // This was firing too early, now we check participation first.
        if (isGameOver) {
          console.log("Game is over, redirecting to score page.");
          redirect(`/game/${game?.id}/score?fid=${fid}`);
        }
        return game;
      });
  });

  // --- FIX: Changed signature to accept gameId ---
  const getUserInfo = cache(async (fid: number, gameId: number) => {
    if (fid === null || isNaN(Number(fid))) {
      return null;
    }
    // --- FIX: Added check for gameId ---
    if (gameId === null || isNaN(Number(gameId))) {
      return null;
    }
    return prisma.user.findUnique({
      where: { fid },
      select: {
        fid: true,
        imageUrl: true,
        name: true,
        // --- FIX: Applied gameId filter to _count ---
        _count: {
          select: {
            tickets: { where: { gameId: gameId } },
            answers: { where: { gameId: gameId } },
            gameParticipants: { where: { gameId: gameId } },
          },
        },
        // --- END FIX ---
      },
    });
  });

  // --- FIX: Pass gameIdNum to both functions ---
  const userInfoPromise = getUserInfo(fidNum, gameIdNum);
  const gameInfoPromise = getGameInfo(gameIdNum);

  return (
    <div className="w-full min-h-dvh flex-1 overflow-y-auto">
      <GameHeader
        userInfoPromise={userInfoPromise}
        gameInfoPromise={gameInfoPromise}
      />
      <Suspense fallback={<Spinner />}>
        <GameClientImpl
          gameInfoPromise={gameInfoPromise}
          userInfoPromise={userInfoPromise}
        />
      </Suspense>
    </div>
  );
}
