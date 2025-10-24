import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { neynar } from "@/lib/neynarClient";
import { fetchActiveGame } from "@/lib/server/game";

type FriendSummary = {
  fid: number;
  username: string;
  displayName?: string | null;
  pfpUrl?: string | null;
  relationship: {
    isFollower: boolean;
    isFollowing: boolean;
  };
  hasTicket: boolean;
  ticketId?: number;
  ticketGameId?: number;
};

const DEFAULT_LIMIT = 75;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fidParam = searchParams.get("fid");
    if (!fidParam) {
      return NextResponse.json(
        { error: "Missing fid parameter" },
        { status: 400 }
      );
    }
    const fid = Number(fidParam);
    if (!Number.isFinite(fid) || fid <= 0) {
      return NextResponse.json({ error: "Invalid fid" }, { status: 400 });
    }

    const limitParam = Number.parseInt(
      searchParams.get("limit") ?? String(DEFAULT_LIMIT),
      10
    );
    const limit = Number.isFinite(limitParam)
      ? Math.max(1, Math.min(limitParam, 150))
      : DEFAULT_LIMIT;

    const gameIdParam = searchParams.get("gameId");
    let targetGameId: number | null = null;
    if (gameIdParam) {
      const parsed = Number(gameIdParam);
      if (Number.isFinite(parsed)) {
        targetGameId = parsed;
      }
    }
    if (!targetGameId) {
      const active = await fetchActiveGame();
      targetGameId = active?.id ?? null;
    }

    const [followersRes, followingRes] = await Promise.all([
      neynar.fetchUserFollowers({
        fid,
        limit,
      }),
      neynar.fetchUserFollowing({
        fid,
        limit,
      }),
    ]);

    type FriendAccumulator = {
      username: string;
      displayName?: string | null;
      pfpUrl?: string | null;
      isFollower: boolean;
      isFollowing: boolean;
    };

    const friends = new Map<number, FriendAccumulator>();

    const ingest = (
      list: typeof followersRes.users,
      key: "isFollower" | "isFollowing"
    ) => {
      for (const entry of list) {
        const user = entry?.user;
        if (!user?.fid) continue;
        const existing = friends.get(user.fid);
        if (existing) {
          existing[key] = true;
        } else {
          friends.set(user.fid, {
            username: user.username,
            displayName: user.display_name ?? null,
            pfpUrl: user.pfp_url ?? null,
            isFollower: key === "isFollower",
            isFollowing: key === "isFollowing",
          });
        }
      }
    };

    ingest(followersRes.users ?? [], "isFollower");
    ingest(followingRes.users ?? [], "isFollowing");

    if (friends.size === 0) {
      return NextResponse.json({ friends: [], gameId: targetGameId });
    }

    const friendFids = Array.from(friends.keys());
    const friendFidStrings = friendFids.map(String);

    const friendUsers = await prisma.user.findMany({
      where: { farcasterId: { in: friendFidStrings } },
      include: {
        tickets: targetGameId
          ? {
              where: { gameId: targetGameId },
              orderBy: { purchasedAt: "desc" },
            }
          : {
              orderBy: { purchasedAt: "desc" },
              take: 1,
            },
      },
    });

    const ticketLookup = new Map<
      string,
      { ticketId: number; gameId: number }
    >();
    for (const user of friendUsers) {
      const firstTicket = user.tickets?.[0];
      if (firstTicket) {
        ticketLookup.set(String(user.farcasterId), {
          ticketId: firstTicket.id,
          gameId: firstTicket.gameId,
        });
      }
    }

    const result: FriendSummary[] = friendFids.map((friendFid) => {
      const base = friends.get(friendFid)!;
      const ticketInfo = ticketLookup.get(String(friendFid));
      return {
        fid: friendFid,
        username: base.username,
        displayName: base.displayName,
        pfpUrl: base.pfpUrl,
        relationship: {
          isFollower: base.isFollower,
          isFollowing: base.isFollowing,
        },
        hasTicket: Boolean(
          ticketInfo && (!targetGameId || ticketInfo.gameId === targetGameId)
        ),
        ticketId: ticketInfo?.ticketId,
        ticketGameId: ticketInfo?.gameId,
      };
    });

    // Sort: friends with tickets first, then alphabetically
    result.sort((a, b) => {
      if (a.hasTicket !== b.hasTicket) {
        return a.hasTicket ? -1 : 1;
      }
      return a.username.localeCompare(b.username);
    });

    return NextResponse.json({
      friends: result,
      gameId: targetGameId,
    });
  } catch (error) {
    console.error("Failed to fetch Farcaster friends", error);
    return NextResponse.json(
      { error: "Failed to fetch friends" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
