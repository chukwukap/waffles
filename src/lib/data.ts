import { prisma } from "@/lib/db";
import { HydratedGame, HydratedUser } from "@/state/types";

/* ------------------------------------------------------ */
/*        1. UPCOMING / ACTIVE GAMES (NO PARAMS)          */
/* ------------------------------------------------------ */

export const fetchUpcomingGames = async (): Promise<HydratedGame[]> => {
  const now = new Date();
  const games = await prisma.game.findMany({
    where: { endTime: { gt: now } },
    include: {
      config: true,
      questions: { orderBy: { id: "asc" } },
      _count: { select: { tickets: true } },
    },
    orderBy: { startTime: "asc" },
    take: 1,
  });
  return games.map((g) => ({ ...g, config: g.config! }));
};

/* ------------------------------------------------------ */
/*                2. GAME DETAILS (BY ID)                 */
/* ------------------------------------------------------ */

export const fetchGameById = async (
  gameId: number
): Promise<HydratedGame | null> => {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      config: true,
      questions: { orderBy: { id: "asc" } },
      _count: { select: { tickets: true } },
    },
  });
  if (!game?.config) return null;
  return { ...game, config: game.config };
};

/* ------------------------------------------------------ */
/*         3. USER DATA FOR LOBBY (PARAMETERIZED)         */
/* ------------------------------------------------------ */

export const fetchUserWithGameDetailsAndReferral = async (
  userFid: number,
  gameId: number
): Promise<HydratedUser | null> => {
  return prisma.user.findUnique({
    where: { fid: userFid },
    include: {
      tickets: { where: { gameId } },
      scores: { where: { gameId } },
      answers: { where: { gameId } },
      gameParticipants: { where: { gameId } },
      referrals: {
        take: 1,
        select: {
          id: true,
          code: true,
          inviterId: true,
          acceptedAt: true,
          createdAt: true,
          inviter: {
            select: {
              id: true,
              fid: true,
              name: true,
              imageUrl: true,
              wallet: true,
            },
          },
        },
      },
    },
  }) as Promise<HydratedUser | null>;
};
/* ------------------------------------------------------ */
/*            4. FETCH GAME CHAT MESSAGES                 */
/* ------------------------------------------------------ */

/**
 * Fetches the latest chat messages for a game, ordered by creation.
 * Can specify a limit (default 24).
 *
 * Each message includes user (fid, id, name, imageUrl).
 */
export const fetchChatMessages = async (
  gameId: number,
  limit: number = 24
) => {
  return prisma.chat.findMany({
    where: { gameId },
    orderBy: { createdAt: "asc" },
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          fid: true,
          name: true,
          imageUrl: true,
        },
      },
    },
  });
};
