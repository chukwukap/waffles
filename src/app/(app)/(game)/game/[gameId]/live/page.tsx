import { cache } from "react";
import { redirect, } from "next/navigation";
import { prisma } from "@/lib/db";
import { getGamePhase } from "@/lib/types";
import LiveGameScreen from "./LiveGameScreen";

export const dynamic = "force-dynamic";

// ==========================================
// TYPES (exported for LiveGameProvider)
// ==========================================

export interface LiveGameQuestion {
  id: string;

  content: string;
  mediaUrl: string | null;
  soundUrl: string | null;
  options: string[];
  correctIndex: number;
  durationSec: number;
  points: number;
  roundIndex: number;
  orderInRound: number;
}

export interface LiveGameData {
  id: string;
  endsAt: Date;
  roundBreakSec: number;
  prizePool: number;
  theme: string;
  questions: LiveGameQuestion[];
  recentPlayers: { pfpUrl: string | null; username: string }[];
}

// ==========================================
// DATA FETCHING
// ==========================================

const getGame = cache(async (gameId: string) => {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: {
      id: true,
      startsAt: true,
      endsAt: true,
      roundBreakSec: true,
      prizePool: true,
      theme: true,
      questions: {
        select: {
          id: true,
          content: true,
          mediaUrl: true,
          soundUrl: true,
          options: true,
          correctIndex: true,
          durationSec: true,
          points: true,
          roundIndex: true,
          orderInRound: true,
        },
        orderBy: [
          { roundIndex: "asc" },
          { orderInRound: "asc" },
        ],
      },
      entries: {
        select: {
          user: {
            select: {
              pfpUrl: true,
              username: true,
            },
          },
        },
        take: 10,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!game) return null;

  // Check if game is live
  const phase = getGamePhase(game);
  if (phase !== "LIVE") {
    return null;
  }

  return {
    id: game.id,
    endsAt: game.endsAt,
    roundBreakSec: game.roundBreakSec,
    prizePool: game.prizePool,
    theme: game.theme,
    questions: game.questions.map((q) => ({
      ...q,
      durationSec: q.durationSec ?? 10,
    })),
    recentPlayers: game.entries.map((e) => ({
      pfpUrl: e.user.pfpUrl,
      username: e.user.username || `Player`,
    })),
  } satisfies LiveGameData;
});

// ==========================================
// PAGE COMPONENT
// ==========================================

export default async function LiveGamePage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = await params;

  const game = await getGame(gameId);

  // If game doesn't exist or is not live, redirect to game hub
  if (!game) {
    redirect("/game");
  }

  return (
    <LiveGameScreen game={game} />
  );
}
