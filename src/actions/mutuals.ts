"use server";

import { getMutualFids } from "@/lib/neynarClient";
import { prisma } from "@/lib/db";

export type MutualsData = {
  mutuals: Array<{ fid: number; pfpUrl: string | null }>;
  mutualCount: number;
  totalCount: number;
};

/**
 * Gets mutuals with fallback to top players.
 */
export async function getMutualsAction(
  fid: number,
  gameId: number | null,
  context: "waitlist" | "game"
): Promise<MutualsData> {
  try {
    // This now efficiently gets at most 1000 mutual FIDs using our neynarClient utility
    const mutualFids = await getMutualFids(fid);

    if (!mutualFids || mutualFids.length === 0) {
      // No mutuals found, return top players only
      return await getTopPlayersOnly(fid, gameId, context);
    }

    // Get user IDs for mutuals from our database
    const mutualUsers = await prisma.user.findMany({
      where: { fid: { in: mutualFids } },
      select: { id: true, fid: true, pfpUrl: true },
    });

    const mutualUserIds = mutualUsers.map((u) => u.id);

    // Filter mutuals who have joined game/waitlist
    let joinedMutuals: Array<{ fid: number; pfpUrl: string | null }> = [];

    if (context === "waitlist") {
      const waitlistEntries = await prisma.user.findMany({
        where: {
          id: { in: mutualUserIds },
          status: "WAITLIST",
        },
        select: { fid: true, pfpUrl: true },
      });

      joinedMutuals = waitlistEntries.map((entry) => ({
        fid: entry.fid,
        pfpUrl: entry.pfpUrl,
      }));
    } else if (context === "game" && gameId) {
      const gameParticipants = await prisma.gamePlayer.findMany({
        where: {
          gameId,
          userId: { in: mutualUserIds },
        },
        include: {
          user: {
            select: { fid: true, pfpUrl: true },
          },
        },
      });

      joinedMutuals = gameParticipants.map((participant) => ({
        fid: participant.user.fid,
        pfpUrl: participant.user.pfpUrl,
      }));
    }

    // Get total count for context
    let totalCount = 0;
    if (context === "waitlist") {
      totalCount = await prisma.user.count({ where: { status: "WAITLIST" } });
    } else if (context === "game" && gameId) {
      totalCount = await prisma.gamePlayer.count({
        where: { gameId },
      });
    }

    // If we have 4+ mutuals, return them
    if (joinedMutuals.length >= 4) {
      return {
        mutuals: joinedMutuals.slice(0, 4),
        mutualCount: joinedMutuals.length,
        totalCount,
      };
    }

    // Fill remaining slots with top players
    const topPlayers = await getTopPlayers(fid, gameId, context, 4);
    const topPlayerFids = new Set(joinedMutuals.map((m) => m.fid));

    // Filter out top players that are already in mutuals
    const additionalPlayers = topPlayers.filter(
      (p) => !topPlayerFids.has(p.fid)
    );

    const combined = [
      ...joinedMutuals,
      ...additionalPlayers.slice(0, 4 - joinedMutuals.length),
    ];

    return {
      mutuals: combined.slice(0, 4),
      mutualCount: joinedMutuals.length,
      totalCount,
    };
  } catch (error) {
    console.error("[GET_MUTUALS_ACTION_ERROR]", error);
    // Fallback to top players only on error
    return await getTopPlayersOnly(fid, gameId, context);
  }
}

/**
 * Gets top players only (fallback when no mutuals or error)
 */
async function getTopPlayersOnly(
  fid: number,
  gameId: number | null,
  context: "waitlist" | "game"
): Promise<MutualsData> {
  const topPlayers = await getTopPlayers(fid, gameId, context, 4);

  let totalCount = 0;
  if (context === "waitlist") {
    totalCount = await prisma.user.count({ where: { status: "WAITLIST" } });
  } else if (context === "game" && gameId) {
    totalCount = await prisma.gamePlayer.count({
      where: { gameId },
    });
  }

  return {
    mutuals: topPlayers.slice(0, 4),
    mutualCount: 0,
    totalCount,
  };
}

/**
 * Gets top players for fallback display
 */
async function getTopPlayers(
  fid: number,
  gameId: number | null,
  context: "waitlist" | "game",
  limit: number
): Promise<Array<{ fid: number; pfpUrl: string | null }>> {
  if (context === "waitlist") {
    // Top waitlist users by invite quota, then earliest join
    const waitlistEntries = await prisma.user.findMany({
      where: { status: "WAITLIST" },
      orderBy: [{ inviteQuota: "desc" }, { createdAt: "asc" }],
      take: limit,
      select: { fid: true, pfpUrl: true },
    });

    return waitlistEntries.map((entry) => ({
      fid: entry.fid,
      pfpUrl: entry.pfpUrl,
    }));
  } else if (context === "game" && gameId) {
    // Top players by score from GamePlayer
    const scores = await prisma.gamePlayer.findMany({
      where: { gameId },
      orderBy: { score: "desc" },
      take: limit,
      include: {
        user: {
          select: { fid: true, pfpUrl: true },
        },
      },
    });

    return scores.map((score) => ({
      fid: score.user.fid,
      pfpUrl: score.user.pfpUrl,
    }));
  }

  return [];
}
