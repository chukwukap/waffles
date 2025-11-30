import { neynar } from "@/lib/neynarClient";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const fidStr = searchParams.get("fid");
  const context = searchParams.get("context") as "waitlist" | "game" | null;
  const gameIdStr = searchParams.get("gameId");

  if (!fidStr || isNaN(Number(fidStr))) {
    return NextResponse.json({ error: "Invalid FID" }, { status: 400 });
  }

  const fid = Number(fidStr);
  const gameId = gameIdStr ? Number(gameIdStr) : null;
  const safeContext = context || "waitlist";
  const limit = searchParams.get("limit")
    ? Number(searchParams.get("limit"))
    : 4;

  try {
    // 1. Fetch reciprocal followers (mutuals) from Neynar
    // This finds users who follow the target AND the target follows them.
    let mutualFids: number[] = [];
    try {
      const reciprocalResponse = await neynar.fetchUserReciprocalFollowers({
        fid: fid,
        viewerFid: fid,
      });

      mutualFids = (reciprocalResponse as any).users
        .map((u: { fid: number }) => u.fid)
        .filter((fid: number | undefined) => fid !== undefined && fid !== null);
    } catch (err) {
      console.warn(
        "[API_MUTUALS_WARNING] Failed to fetch mutuals from Neynar (likely 402 Payment Required or Rate Limit). Falling back to top players.",
        err
      );
      // Proceed with empty mutualFids -> will trigger fallback to top players
    }

    // 2. Get user details from our DB
    let joinedMutuals: Array<{ fid: number; pfpUrl: string | null }> = [];

    if (mutualFids.length > 0) {
      const mutualUsers = await prisma.user.findMany({
        where: { fid: { in: mutualFids } },
        select: { id: true, fid: true, pfpUrl: true },
      });
      const mutualUserIds = mutualUsers.map((u) => u.id);

      if (safeContext === "waitlist") {
        const waitlistEntries = await prisma.user.findMany({
          where: {
            id: { in: mutualUserIds },
            status: { in: ["WAITLIST", "ACTIVE"] },
          },
          select: { fid: true, pfpUrl: true },
        });
        joinedMutuals = waitlistEntries.map((entry) => ({
          fid: entry.fid,
          pfpUrl: entry.pfpUrl,
        }));
      } else if (safeContext === "game" && gameId) {
        const gameParticipants = await prisma.gamePlayer.findMany({
          where: {
            gameId,
            userId: { in: mutualUserIds },
          },
          include: {
            user: { select: { fid: true, pfpUrl: true } },
          },
        });
        joinedMutuals = gameParticipants.map((p) => ({
          fid: p.user.fid,
          pfpUrl: p.user.pfpUrl,
        }));
      }
    }

    // 3. Get Total Count
    let totalCount = 0;
    if (safeContext === "waitlist") {
      totalCount = await prisma.user.count({
        where: { status: { in: ["WAITLIST", "ACTIVE"] } },
      });
    } else if (safeContext === "game" && gameId) {
      totalCount = await prisma.gamePlayer.count({ where: { gameId } });
    }

    // 4. Return if we have enough mutuals (limit)
    if (joinedMutuals.length >= limit) {
      return NextResponse.json({
        mutuals: joinedMutuals.slice(0, limit),
        mutualCount: joinedMutuals.length,
        totalCount,
      });
    }

    // 5. Fallback: Fill with top players
    // We need to fetch enough top players to fill the remaining slots up to 'limit'
    // But we fetch a bit more (limit * 2) to account for duplicates we might filter out
    const fetchLimit = limit * 2;
    let topPlayers: Array<{ fid: number; pfpUrl: string | null }> = [];

    if (safeContext === "waitlist") {
      const entries = await prisma.user.findMany({
        where: {
          status: { in: ["WAITLIST", "ACTIVE"] },
          pfpUrl: { not: null },
        },
        orderBy: [{ inviteQuota: "desc" }, { createdAt: "asc" }],
        take: fetchLimit,
        select: { fid: true, pfpUrl: true },
      });
      topPlayers = entries.map((e) => ({ fid: e.fid, pfpUrl: e.pfpUrl }));
    } else if (safeContext === "game" && gameId) {
      const scores = await prisma.gamePlayer.findMany({
        where: {
          gameId,
          user: { pfpUrl: { not: null } },
        },
        orderBy: { score: "desc" },
        take: fetchLimit,
        include: { user: { select: { fid: true, pfpUrl: true } } },
      });
      topPlayers = scores.map((s) => ({
        fid: s.user.fid,
        pfpUrl: s.user.pfpUrl,
      }));
    }

    // Filter out duplicates (mutuals that are also top players)
    const mutualFidSet = new Set(joinedMutuals.map((m) => m.fid));
    const additionalPlayers = topPlayers.filter(
      (p) => !mutualFidSet.has(p.fid)
    );

    const combined = [
      ...joinedMutuals,
      ...additionalPlayers.slice(0, limit - joinedMutuals.length),
    ];

    return NextResponse.json({
      mutuals: combined.slice(0, limit),
      mutualCount: joinedMutuals.length,
      totalCount,
    });
  } catch (error) {
    console.error("[API_MUTUALS_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to fetch mutuals" },
      { status: 500 }
    );
  }
}
