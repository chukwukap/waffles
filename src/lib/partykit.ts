"use server";

import PartySocket from "partysocket";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

interface Question {
  id: number;
  text: string;
  options: string[];
  correct: number;
  timeLimit: number;
}

// ==========================================
// HELPER
// ==========================================

function partyFetch(gameId: number, path: string, body: unknown) {
  return PartySocket.fetch(
    {
      host: env.partykitHost || "localhost:1999",
      room: `game-${gameId}`,
      party: "game",
      path,
    },
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.partykitSecret}`,
      },
      body: JSON.stringify(body),
    }
  );
}

// ==========================================
// FUNCTIONS
// ==========================================

/**
 * Sync game questions to PartyKit storage.
 * Called when questions are created, deleted, or reordered.
 */
export async function syncQuestionsToPartyKit(gameId: number): Promise<void> {
  if (!env.partykitHost || !env.partykitSecret) {
    console.warn("[syncQuestions] PartyKit not configured");
    return;
  }

  try {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        questions: {
          orderBy: [{ roundIndex: "asc" }, { orderInRound: "asc" }],
        },
      },
    });

    if (!game) {
      console.error(`[syncQuestions] Game ${gameId} not found`);
      return;
    }

    const questions: Question[] = game.questions.map((q) => ({
      id: q.id,
      text: q.content,
      options: q.options,
      correct: q.correctIndex,
      timeLimit: q.durationSec || game.roundBreakSec || 15,
    }));

    const res = await partyFetch(gameId, "sync-questions", { questions });

    if (res.ok) {
      console.log(
        `[syncQuestions] Synced ${questions.length} questions for game ${gameId}`
      );
    } else {
      console.error(`[syncQuestions] Failed: ${res.status}`);
    }
  } catch (err) {
    console.error(`[syncQuestions] Error:`, err);
  }
}

/**
 * Broadcast updated game stats to all connected PartyKit clients.
 * Called when a ticket is purchased.
 */
export async function broadcastGameStats(
  gameId: number,
  stats: { prizePool: number; playerCount: number }
): Promise<void> {
  if (!env.partykitHost || !env.partykitSecret) {
    console.warn("[broadcastGameStats] PartyKit not configured");
    return;
  }

  try {
    const res = await partyFetch(gameId, "stats-update", stats);

    if (res.ok) {
      console.log(
        `[broadcastGameStats] Sent to game ${gameId}: prizePool=${stats.prizePool}, playerCount=${stats.playerCount}`
      );
    } else {
      console.error(`[broadcastGameStats] Failed: ${res.status}`);
    }
  } catch (err) {
    console.error(`[broadcastGameStats] Error:`, err);
  }
}
