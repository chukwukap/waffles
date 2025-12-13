import LiveGameClient from "./client";
import { Prisma, prisma } from "@/lib/db";
import { notFound } from "next/navigation";

export const revalidate = 0;

// Define the payload types for the client component
export type LiveGameInfoPayload = Prisma.GameGetPayload<{
  select: {
    id: true;
    roundDurationSec: true;
    questions: {
      select: {
        id: true;
        gameId: true;
        content: true;
        mediaUrl: true;
        soundUrl: true;
        options: true;
        correctIndex: true;
        durationSec: true;
        roundIndex: true;
      };
      orderBy: [{ roundIndex: "asc" }, { id: "asc" }];
    };
  };
}>;

export type LiveGameUserInfoPayload = {
  fid: number;
  status: string;
};

// Server-side data fetching - only fetch public game data
export default async function LiveGamePage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = await params;
  const gameIdNum = Number(gameId);

  if (isNaN(gameIdNum)) {
    throw new Error("Invalid game ID");
  }

  // Fetch Game Data (public - includes questions)
  const game = await prisma.game.findUnique({
    where: { id: gameIdNum },
    select: {
      id: true,
      roundDurationSec: true,
      questions: {
        select: {
          id: true,
          gameId: true,
          content: true,
          mediaUrl: true,
          soundUrl: true,
          options: true,
          correctIndex: true,
          durationSec: true,
          roundIndex: true,
        },
        orderBy: [
          { roundIndex: "asc" },
          { order: "asc" },
        ],
      },
    },
  });

  if (!game) {
    notFound();
  }

  // User auth and progress tracking is handled client-side
  return <LiveGameClient gameInfo={game} />;
}
