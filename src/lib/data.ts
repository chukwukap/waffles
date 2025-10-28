import { prisma } from "@/lib/db";
import { HydratedGame, HydratedUser } from "@/state/types";
import { unstable_cache } from "next/cache";

/* ------------------------------------------------------ */
/*        1. UPCOMING / ACTIVE GAMES (NO PARAMS)          */
/* ------------------------------------------------------ */

export const fetchUpcomingGames = () =>
  unstable_cache(
    async (): Promise<HydratedGame[]> => {
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
    },
    ["lobby-upcoming-games"],
    {
      tags: ["lobby-upcoming-games"],
    }
  )();

/* ------------------------------------------------------ */
/*                2. GAME DETAILS (BY ID)                 */
/* ------------------------------------------------------ */

export const fetchGameById = (gameId: number) =>
  unstable_cache(
    async (): Promise<HydratedGame | null> => {
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
    },
    ["game-details", gameId.toString()],
    {
      tags: [`game-details-${gameId}`],
    }
  )();

/* ------------------------------------------------------ */
/*         3. USER DATA FOR LOBBY (PARAMETERIZED)         */
/* ------------------------------------------------------ */

export const fetchUserWithGameDetailsAndReferral = (
  userFid: number,
  gameId: number
) =>
  unstable_cache(
    async (): Promise<HydratedUser | null> => {
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
    },
    ["user-game-details", userFid.toString(), gameId.toString()],
    {
      tags: [`user-game-details-${userFid}-${gameId}`],
    }
  )();
