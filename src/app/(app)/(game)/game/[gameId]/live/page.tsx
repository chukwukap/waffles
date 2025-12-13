import LiveGameClient from "./client";
import { Prisma, prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";

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
    throw new Error("Invalid game ID or FID");
  }

  // 1. Get User Data (we need the internal ID to check answers)
  const user = await prisma.user.findUnique({
    where: { fid: fidNum },
    select: { id: true, fid: true, status: true }, // Added status
  });

  if (!user) {
    throw new Error("User not found");
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
          { order: "asc" },
        ],
      },
    },
  });

  if (!game) {
    notFound();
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
    redirect(`/game/${gameId}/score`);
  }

  // 6. Resume Game
  // We pass 'answersCount' as the initial index.
  // If they answered 0, index is 0. If they answered 3, index is 3 (the 4th question).
  return (
    <LiveGameClient
      gameInfo={game}
      userInfo={user}
      initialQuestionIndex={answersCount}
    />
  );
}
