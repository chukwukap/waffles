import { cache, Suspense } from "react";
import { prisma } from "@/lib/db";
import ScorePageClient from "./_components/scoreClient";
import { Spinner } from "@/components/ui/spinner";
import Header from "@/components/Header";

// type for the cached score payload
export type ScorePagePayload = {
  userInfo: {
    username: string;
    avatarUrl: string;
  };
  category: string;
  winnings: number;
  score: number;
  rank: number;
  percentile: number;
  leaderboard: Array<{
    username: string;
    avatarUrl: string;
    score: number;
  }>;
};

const getScorePagePayload = cache(
  async (gameId: number, fid: number): Promise<ScorePagePayload | null> => {
    if (!fid || isNaN(Number(fid))) return null;

    // Do all required DB reads in parallel
    const [userScore, leaderboard, allScores] = await Promise.all([
      prisma.score.findFirst({
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
      }),
      prisma.score.findMany({
        where: { gameId: Number(gameId) },
        orderBy: { points: "desc" },
        take: 3,
        include: {
          user: {
            select: { name: true, imageUrl: true },
          },
        },
      }),
      prisma.score.findMany({
        where: { gameId: Number(gameId) },
        orderBy: { points: "desc" },
        select: { userId: true },
      }),
    ]);

    // Defensive: If user doesn't have a score, return null
    if (!userScore) {
      return null;
    }

    const sortedUserIds = allScores.map((s) => s.userId);
    const userRank = sortedUserIds.indexOf(userScore.user.id) + 1;
    const percentile =
      allScores.length > 0
        ? Math.round(((allScores.length - userRank) / allScores.length) * 100)
        : 0;

    // Placeholder for winnings logic
    const winnings = 50;

    return {
      userInfo: {
        username: userScore.user.name ?? "",
        avatarUrl: userScore.user.imageUrl ?? "",
      },
      category: userScore.game?.config?.theme ?? "UNKNOWN",
      winnings,
      score: userScore.points ?? 0,
      rank: userRank,
      percentile,
      leaderboard: leaderboard.map((r) => ({
        username: r.user?.name ?? "anon",
        avatarUrl: r.user?.imageUrl ?? "",
        score: r.points,
      })),
    };
  }
);

export default async function ScorePage({
  params,
  searchParams,
}: {
  params: Promise<{ gameId: string }>;
  searchParams: Promise<{ fid: string }>;
}) {
  const { gameId } = await params;
  const { fid } = await searchParams;

  // Defensive: check params early
  if (!fid || isNaN(Number(fid)) || !gameId || isNaN(Number(gameId))) {
    return null;
  }

  const scorePayloadPromise = getScorePagePayload(Number(gameId), Number(fid));

  return (
    <div className="flex flex-col text-white overflow-hidden">
      <Header />
      <Suspense fallback={<Spinner />}>
        <ScorePageClient scorePayloadPromise={scorePayloadPromise} />
      </Suspense>
    </div>
  );
}
