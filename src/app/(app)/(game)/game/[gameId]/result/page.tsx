import { cache } from "react";
import { Metadata } from "next";
import { prisma } from "@/lib/db";
import ResultPageClient from "./client";
import { minikitConfig } from "../../../../../../../minikit.config";
import { env } from "@/lib/env";
import { buildPrizeOGUrl } from "@/lib/og";

export type ResultPagePayload = {
  userInfo: {
    username: string;
    pfpUrl: string;
  };
  category: string;
  winnings: number;
  score: number;
  rank: number;
  percentile: number;
  leaderboard: Array<{
    username: string;
    pfpUrl: string;
    score: number;
  }>;
};

interface ResultPageProps {
  params: Promise<{ gameId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Fetch public game data (leaderboard) for the result page
// Updated to use GameEntry instead of GamePlayer
const getGameLeaderboard = cache(async (gameId: number) => {
  const [game, allEntriesInGame] = await Promise.all([
    prisma.game.findUnique({
      where: { id: gameId },
      select: { theme: true, onchainId: true, title: true },
    }),
    prisma.gameEntry.findMany({
      where: { gameId, paidAt: { not: null } },
      orderBy: { score: "desc" },
      select: {
        score: true,
        rank: true,
        prize: true,
        claimedAt: true,
        user: {
          select: { fid: true, username: true, pfpUrl: true },
        },
      },
    }),
  ]);

  return { game, allPlayersInGame: allEntriesInGame };
});

// Generate metadata for Farcaster frame previews
export async function generateMetadata({
  params,
  searchParams,
}: ResultPageProps): Promise<Metadata> {
  const { gameId } = await params;
  const sParams = await searchParams;
  const gameIdNum = Number(gameId);

  // Get game info
  const { game } = await getGameLeaderboard(gameIdNum);
  if (!game) {
    return { title: "Game Not Found" };
  }

  // Extract share params (passed when sharing)
  const username = (sParams.username as string) || "Player";
  const prizeAmount = parseInt((sParams.prizeAmount as string) || "0", 10);
  const score = parseInt((sParams.score as string) || "0", 10);
  const pfpUrl = sParams.pfpUrl as string | undefined;

  // Check if this is a share context (has score or prizeAmount)
  const isShareContext = score > 0 || prizeAmount > 0;

  // Build OG image URL when in share context
  const imageUrl = isShareContext
    ? buildPrizeOGUrl({ prizeAmount, score, pfpUrl })
    : null;

  // Metadata based on context
  const title = prizeAmount > 0
    ? `${username} won on Waffles!`
    : score > 0
      ? `${username} scored ${score.toLocaleString()} pts on Waffles!`
      : `Game Results | ${game.title || game.theme}`;
  const description = prizeAmount > 0
    ? `${username} just won $${prizeAmount.toLocaleString()} on Waffles!`
    : score > 0
      ? `${username} scored ${score.toLocaleString()} points on Waffles!`
      : `Check out the results for ${game.title || game.theme}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
    other: prizeAmount > 0 ? {
      "fc:frame": JSON.stringify({
        version: minikitConfig.miniapp.version,
        imageUrl: imageUrl || minikitConfig.miniapp.heroImageUrl,
        button: {
          title: "Join the next game ➡️🔥",
          action: {
            name: "Play Waffles",
            type: "launch_frame",
            url: `${env.rootUrl}/game`,
            splashImageUrl: minikitConfig.miniapp.splashImageUrl,
            splashBackgroundColor: minikitConfig.miniapp.splashBackgroundColor,
          },
        },
      }),
    } : {},
  };
}

export default async function ResultPage({
  params,
}: ResultPageProps) {
  const { gameId } = await params;
  const gameIdNum = Number(gameId);

  if (isNaN(gameIdNum)) {
    return (
      <div className="flex flex-col text-white items-center justify-center min-h-full">
        <p className="text-lg">Invalid game ID</p>
      </div>
    );
  }

  // Fetch public leaderboard data server-side
  const leaderboardPromise = getGameLeaderboard(gameIdNum);

  // User-specific data (their result, rank) is fetched client-side with auth
  return <ResultPageClient leaderboardPromise={leaderboardPromise} gameId={gameIdNum} />;
}

