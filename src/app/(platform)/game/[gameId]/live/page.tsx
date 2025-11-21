import LiveGameClient from "./client";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Prisma } from "../../../../../../prisma/generated/client";

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

export type LiveGameUserInfoPayload = Prisma.UserGetPayload<{
  select: {
    fid: true;
    status: true; // Added status
  };
}>;

// Server-side data fetching
export default async function LiveGamePage({
  searchParams,
}: {
  searchParams: Promise<{ gameId: string; fid: string }>;
}) {
  const { gameId, fid } = await searchParams;
  const gameIdNum = Number(gameId);
  const fidNum = Number(fid);

  if (isNaN(gameIdNum) || isNaN(fidNum)) {
    redirect("/game");
  }

  // 1. Get User Data (we need the internal ID to check answers)
  const user = await prisma.user.findUnique({
    where: { fid: fidNum },
    select: { id: true, fid: true, status: true }, // Added status
  });

  if (!user) {
    redirect("/game");
  }

  // Enforce access control
  if (user.status !== "ACTIVE") {
    redirect("/invite");
  }

  // 2. Fetch Game Data (to get total questions count)
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
          { roundIndex: "asc" }, // Order by round first
          { id: "asc" }, // Then by ID
        ],
      },
    },
  });

  if (!game) {
    redirect("/game");
  }

  // 3. Check Progress: Count how many questions this user has already answered
  const answersCount = await prisma.answer.count({
    where: {
      userId: user.id,
      gameId: gameIdNum,
    },
  });

  // 4. Logic Check
  // If they've answered all questions (or more), they are done.
  if (answersCount >= game.questions.length) {
    redirect(`/game/${gameId}/score?fid=${fid}`);
  }

  // 5. Pass data to client
  // Since we already fetched the data, we wrap it in a resolved promise
  // to match the client component's interface which expects promises.
  const gameInfoPromise = Promise.resolve(game);
  const userInfoPromise = Promise.resolve(user);

  // 6. Resume Game
  // We pass 'answersCount' as the initial index.
  // If they answered 0, index is 0. If they answered 3, index is 3 (the 4th question).
  return (
    <LiveGameClient
      gameInfoPromise={gameInfoPromise}
      userInfoPromise={userInfoPromise}
      initialQuestionIndex={answersCount}
    />
  );
}
