import { prisma } from "@/lib/db";
import ScorePageClient from "./_components/scoreClient";

export default async function ScorePage({
  params,
  searchParams,
}: {
  params: Promise<{ gameId: string }>;
  searchParams: Promise<{ fid: string }>;
}) {
  const { gameId } = await params;
  const { fid } = await searchParams;

  console.log("score page", { gameId, fid });
  console.log("search params", await searchParams);
  console.log("params", await params);

  if (!fid) {
    throw new Error("FID is required");
  }

  // Look up the user's score for the game by joining Score -> User (using fid)
  const userScore = await prisma.score.findFirst({
    where: {
      gameId: Number(gameId),
      user: { fid: Number(fid) },
    },
    include: {
      game: {
        select: {
          config: {
            select: { theme: true },
          },
        },
      },
      user: {
        select: { id: true, imageUrl: true, name: true },
      },
    },
  });

  // Get leaderboard top 3 for this game
  const leaderboard = await prisma.score.findMany({
    where: { gameId: Number(gameId) },
    orderBy: { points: "desc" },
    take: 3,
    include: {
      user: {
        select: {
          name: true,
          imageUrl: true,
        },
      },
    },
  });

  // Get all scores for this game for percentile+rank
  const allScores = await prisma.score.findMany({
    where: { gameId: Number(gameId) },
    orderBy: { points: "desc" },
    select: { userId: true },
  });

  // Find user's rank using their internal userId
  const sortedUserIds = allScores.map((s) => s.userId);
  const userRank = sortedUserIds.indexOf(userScore?.user.id ?? 0) + 1;
  const percentile =
    allScores.length > 0
      ? Math.round(((allScores.length - userRank) / allScores.length) * 100)
      : 0;

  // If we had real winnings, we'd calculate by pool logic. Here, 0 for now.
  const winnings = 50;

  return (
    <ScorePageClient
      userInfo={{
        username: userScore?.user.name ?? "",
        avatarUrl: userScore?.user.imageUrl ?? "",
      }}
      category={userScore?.game?.config?.theme ?? "UNKNOWN"}
      winnings={winnings}
      score={userScore?.points ?? 0}
      rank={userRank}
      percentile={percentile}
      leaderboard={leaderboard.map((r) => ({
        username: r.user?.name ?? "anon",
        avatarUrl: r.user?.imageUrl ?? "",
        score: r.points,
      }))}
    />
  );
}
