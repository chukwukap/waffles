// ───────────────────────── src/lib/server/fetchInitialGame.ts ─────────────────────────
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
export type GameWithConfigAndQuestions = Prisma.GameGetPayload<{
  include: {
    config: true;
    questions: true;
  };
}>;

export async function fetchInitialGame(gameId: number) {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      config: true,
      questions: true,
    },
  });

  if (!game) throw new Error("Game not found");

  return {
    id: game.id,
    name: game.name,
    description: game.description,
    config: {
      ticketPrice: game.config?.ticketPrice ?? 50,
      roundTimeLimit: game.config?.roundTimeLimit ?? 15,
      questionsPerGame: game.config?.questionsPerGame ?? game.questions.length,
      scoreMultiplier: game.config?.scoreMultiplier ?? 1,
      scorePenalty: game.config?.scorePenalty,
      maxPlayers: game.config?.maxPlayers ?? 100,
      soundEnabled: game.config?.soundEnabled ?? true,
    },
    questions: game.questions.map((q) => ({
      id: q.id,
      text: q.text,
      imageUrl: q.imageUrl,
      options: q.options,
      correctAnswer: q.correctAnswer,
    })),
  };
}

/**
 * Fetches the most recent active game with its configuration and questions.
 * A game is considered "active" if:
 *  - It has a startTime <= now
 *  - It has no endTime, or endTime > now
 * If none match, it falls back to the most recently created game.
 */
export async function fetchActiveGame(): Promise<GameWithConfigAndQuestions | null> {
  const now = new Date();

  // Try to find an active game
  const active = await prisma.game.findFirst({
    where: {
      OR: [
        {
          startTime: { lte: now },
          endTime: { gt: now },
        },
        {
          startTime: { lte: now },
          endTime: null,
        },
      ],
    },
    include: {
      config: true,
      questions: true,
    },
    orderBy: { startTime: "desc" },
  });

  // Fallback to most recent created game if no active game found
  const game = active
    ? active
    : await prisma.game.findFirst({
        include: { config: true, questions: true },
        orderBy: { createdAt: "desc" },
      });

  if (!game) return null;

  return game;
}
