"use server";

import { neynar } from "@/lib/neynarClient";
import { prisma } from "@/lib/db";

export type MutualsData = {
  mutuals: Array<{ fid: number; imageUrl: string | null }>;
  mutualCount: number;
  totalCount: number;
};

/**
 * Fetches mutual connections who have joined the game or waitlist.
 * Mutuals are users who follow each other (bidirectional follows).
 * If there aren't enough mutuals, fills remaining slots with top players.
 */
/**
 * Fetches all users that a given user follows (with pagination)
 */
async function fetchAllFollowing(fid: number): Promise<number[]> {
  let cursor: string | null = "";
  const fids: number[] = [];

  do {
    const result = await neynar.fetchUserFollowing({
      fid,
      limit: 150,
      cursor: cursor || undefined,
    });

    fids.push(...result.result.users.map((u) => u.fid));
    cursor = result.result.next?.cursor || null;
  } while (cursor !== "" && cursor !== null);

  return fids;
}

/**
 * Fetches all users that follow a given user (with pagination)
 */
async function fetchAllFollowers(fid: number): Promise<number[]> {
  let cursor: string | null = "";
  const fids: number[] = [];

  do {
    const result = await neynar.fetchUserFollowers({
      fid,
      limit: 150,
      cursor: cursor || undefined,
    });

    fids.push(...result.result.users.map((u) => u.fid));
    cursor = result.result.next?.cursor || null;
  } while (cursor !== "" && cursor !== null);

  return fids;
}

export async function getMutualsAction(
  fid: number,
  gameId: number | null,
  context: "waitlist" | "game"
): Promise<MutualsData> {
  try {
    // Fetch user's following and followers from Neynar (with pagination)
    const [followingFids, followersFids] = await Promise.all([
      fetchAllFollowing(fid),
      fetchAllFollowers(fid),
    ]);

    // Convert to Sets for efficient lookup
    const followingSet = new Set(followingFids);
    const followersSet = new Set(followersFids);

    // Find mutuals: users who appear in both lists (bidirectional follows)
    const mutualFids = followingFids.filter((fid) => followersSet.has(fid));

    if (mutualFids.length === 0) {
      // No mutuals found, return top players only
      return await getTopPlayersOnly(fid, gameId, context);
    }

    // Get user IDs for mutuals from our database
    const mutualUsers = await prisma.user.findMany({
      where: { fid: { in: mutualFids } },
      select: { id: true, fid: true, imageUrl: true },
    });

    const mutualUserIds = mutualUsers.map((u) => u.id);
    const mutualFidToImageUrl = new Map(
      mutualUsers.map((u) => [u.fid, u.imageUrl])
    );

    // Filter mutuals who have joined game/waitlist
    let joinedMutuals: Array<{ fid: number; imageUrl: string | null }> = [];

    if (context === "waitlist") {
      const waitlistEntries = await prisma.waitlist.findMany({
        where: { userId: { in: mutualUserIds } },
        include: {
          user: {
            select: { fid: true, imageUrl: true },
          },
        },
      });

      joinedMutuals = waitlistEntries.map((entry) => ({
        fid: entry.user.fid,
        imageUrl: entry.user.imageUrl,
      }));
    } else if (context === "game" && gameId) {
      const gameParticipants = await prisma.gameParticipant.findMany({
        where: {
          gameId,
          userId: { in: mutualUserIds },
        },
        include: {
          user: {
            select: { fid: true, imageUrl: true },
          },
        },
      });

      joinedMutuals = gameParticipants.map((participant) => ({
        fid: participant.user.fid,
        imageUrl: participant.user.imageUrl,
      }));
    }

    // Get total count for context
    let totalCount = 0;
    if (context === "waitlist") {
      totalCount = await prisma.waitlist.count();
    } else if (context === "game" && gameId) {
      totalCount = await prisma.gameParticipant.count({
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
    totalCount = await prisma.waitlist.count();
  } else if (context === "game" && gameId) {
    totalCount = await prisma.gameParticipant.count({
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
): Promise<Array<{ fid: number; imageUrl: string | null }>> {
  if (context === "waitlist") {
    // Top waitlist users by earliest join time
    const waitlistEntries = await prisma.waitlist.findMany({
      orderBy: { createdAt: "asc" },
      take: limit,
      include: {
        user: {
          select: { fid: true, imageUrl: true },
        },
      },
    });

    return waitlistEntries.map((entry) => ({
      fid: entry.user.fid,
      imageUrl: entry.user.imageUrl,
    }));
  } else if (context === "game" && gameId) {
    // Top players by score for the game
    const scores = await prisma.score.findMany({
      where: { gameId },
      orderBy: { points: "desc" },
      take: limit,
      include: {
        user: {
          select: { fid: true, imageUrl: true },
        },
      },
    });

    return scores.map((score) => ({
      fid: score.user.fid,
      imageUrl: score.user.imageUrl,
    }));
  }

  return [];
}

