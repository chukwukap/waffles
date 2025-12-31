"use server";

import { prisma } from "@/lib/db";

interface Question {
  id: number;
  text: string;
  options: string[];
  correct: number;
  timeLimit: number;
}

/**
 * Sync game questions to PartyKit storage.
 * Called when questions are created, deleted, or reordered.
 */
export async function syncQuestionsToPartyKit(gameId: number): Promise<void> {
  const partykitHost = process.env.NEXT_PUBLIC_PARTYKIT_HOST;
  const partykitSecret = process.env.PARTYKIT_SECRET;

  if (!partykitHost || !partykitSecret) {
    console.warn("[syncQuestions] PartyKit not configured");
    return;
  }

  try {
    // Fetch game with questions
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

    // Transform to PartyKit format
    const questions: Question[] = game.questions.map((q) => ({
      id: q.id,
      text: q.content,
      options: q.options,
      correct: q.correctIndex,
      timeLimit: q.durationSec || game.roundBreakSec || 15,
    }));

    const partykitUrl = partykitHost.startsWith("http")
      ? partykitHost
      : `https://${partykitHost}`;

    const res = await fetch(
      `${partykitUrl}/parties/game/game-${gameId}/sync-questions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${partykitSecret}`,
        },
        body: JSON.stringify({ questions }),
      }
    );

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
