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

  try {
    // 1. Fetch reciprocal followers (mutuals) from Neynar
    // This finds users who follow the target AND the target follows them.
    const reciprocalResponse = await neynar.fetchUserReciprocalFollowers({
      fid: fid,
      viewerFid: fid,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mutualFids = (reciprocalResponse as any).users
      .map((u: { fid: number }) => u.fid)
      .filter((fid: number | undefined) => fid !== undefined && fid !== null);

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
            status: "WAITLIST",
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
      totalCount = await prisma.user.count({ where: { status: "WAITLIST" } });
    } else if (safeContext === "game" && gameId) {
      totalCount = await prisma.gamePlayer.count({ where: { gameId } });
    }

    // 4. Return if we have enough mutuals (4+)
    if (joinedMutuals.length >= 4) {
      return NextResponse.json({
        mutuals: joinedMutuals.slice(0, 4),
        mutualCount: joinedMutuals.length,
        totalCount,
      });
    }

    // 5. Fallback: Fill with top players
    const limit = 10;
    let topPlayers: Array<{ fid: number; pfpUrl: string | null }> = [];

    if (safeContext === "waitlist") {
      const entries = await prisma.user.findMany({
        where: {
          status: "WAITLIST",
          pfpUrl: { not: null },
        },
        orderBy: [{ inviteQuota: "desc" }, { createdAt: "asc" }],
        take: limit,
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
        take: limit,
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
      ...additionalPlayers.slice(0, 4 - joinedMutuals.length),
    ];

    return NextResponse.json({
      mutuals: combined.slice(0, 4),
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
