import { cache } from "react";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getGamePhase } from "@/lib/game-utils";
import LiveGameClient from "./client";

export const dynamic = "force-dynamic";

// ==========================================
// TYPES
// ==========================================

export interface LiveGameQuestion {
  id: number;
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
  id: number;
  roundBreakSec: number;
  questions: LiveGameQuestion[];
}

// ==========================================
// DATA FETCHING
// ==========================================

const getLiveGame = cache(async (gameId: number): Promise<LiveGameData | null> => {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: {
      id: true,
      startsAt: true,
      endsAt: true,
      roundBreakSec: true,
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
    },
  });

  if (!game) return null;

  // Check if game is live
  const phase = getGamePhase(game);
  if (phase !== "LIVE") {
    return null; // Not live, should redirect
  }

  return {
    id: game.id,
    roundBreakSec: game.roundBreakSec,
    questions: game.questions,
  };
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
  const gameIdNum = Number(gameId);

  if (isNaN(gameIdNum)) {
    notFound();
  }

  const game = await getLiveGame(gameIdNum);

  // If game doesn't exist or is not live, redirect to game hub
  if (!game) {
    redirect("/game");
  }

  return <LiveGameClient game={game} />;
}
