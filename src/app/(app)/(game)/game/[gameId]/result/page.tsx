import { cache } from "react";
import { Metadata } from "next";
import { prisma } from "@/lib/db";
import ResultPageClient from "./client";
import { minikitConfig } from "@minikit-config";
import { env } from "@/lib/env";
import { buildPrizeOGUrl } from "@/lib/og";

interface ResultPageProps {
  params: Promise<{ gameId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Fetch game info
const getGame = cache(async (gameId: number) => {
  return prisma.game.findUnique({
    where: { id: gameId },
  });
});

// Fetch top 3 entries for leaderboard display
const getTop3Entries = cache(async (gameId: number) => {
  return prisma.gameEntry.findMany({
    where: { gameId, paidAt: { not: null } },
    orderBy: { score: "desc" },
    take: 3,
    select: {
      score: true,
      rank: true,
      user: {
        select: { fid: true, username: true, pfpUrl: true },
      },
    },
  });
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
  const game = await getGame(gameIdNum);
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
    other: {
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
    },
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

  // Fetch data server-side in parallel
  const gamePromise = getGame(gameIdNum);
  const top3Promise = getTop3Entries(gameIdNum);

  // User-specific data (their result, rank) is fetched client-side with auth
  return <ResultPageClient gamePromise={gamePromise} top3Promise={top3Promise} />;
}

