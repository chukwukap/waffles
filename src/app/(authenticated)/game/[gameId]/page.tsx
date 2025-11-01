import { GameClientImpl } from "./gameClientImpl";
import { notFound, redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { unstable_cache } from "next/cache";

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
  };
  questions: Array<{
    id: number;
    text: string;
    imageUrl: string | null;
    options: string[];
    soundUrl: string | null;
    _count: {
      answers: number;
    };
  }>;
  _count: {
    tickets: number;
    participants: number;
    questions: number;
  };
};

export default async function GamePage(props: {
  params: Promise<{ gameId: string }>;
  searchParams: Promise<{ fid: string }>;
}) {
  const { gameId } = await props.params;
  const { fid } = await props.searchParams;

  const numericGameId = Number(gameId);
  const game = await await prisma.game.findUnique({
    where: { id: numericGameId },
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
          _count: { select: { answers: true } },
        },
        orderBy: { id: "asc" },
      },
      _count: {
        select: { tickets: true, participants: true, questions: true },
      },
    },
  });

  console.log("game page", game);
  if (!game) {
    return notFound();
  }

  const userInfo: NeccessaryUserInfo | null = await prisma.user.findUnique({
    where: { fid: Number(fid) },
    select: {
      fid: true,
      imageUrl: true,
      name: true,
      _count: {
        select: {
          tickets: true,
          answers: true,
          gameParticipants: true,
        },
      },
    },
  });

  if (!userInfo) {
    return <div>User not found</div>;
  }

  // Server-side "game over" check:
  const now = new Date();
  const end = new Date(game.endTime);

  const isGameOver =
    now > end ||
    (userInfo?._count.answers ?? 0) === (game?._count.questions ?? 0);

  if (isGameOver) {
    redirect(`/game/${game.id}/score?fid=${fid}`);
  }

  return (
    <GameClientImpl game={game as NeccessaryGameInfo} userInfo={userInfo} />
  );
}
