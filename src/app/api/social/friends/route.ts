import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { neynar } from "@/lib/neynarClient";
import { z } from "zod";

type FriendSummary = {
  fid: number;
  username: string;
  displayName: string | null;
  pfpUrl: string | null;
  relationship: {
    isFollower: boolean;
    isFollowing: boolean;
  };
  hasTicket: boolean;
  ticketId?: number;
  ticketGameId?: number;
};

interface FriendsApiResponse {
  friends: FriendSummary[];
  gameId: number | null;
}

const DEFAULT_NEYNAR_LIMIT = 50;
const MAX_NEYNAR_LIMIT = 150;

const querySchema = z.object({
  fid: z
    .string()
    .regex(/^\d+$/, "FID must be a numeric string.")
    .transform(Number),
  limit: z
    .string()
    .regex(/^\d+$/, "Limit must be an integer.")
    .default(String(DEFAULT_NEYNAR_LIMIT))
    .transform(Number)
    .refine(
      (val) => val > 0 && val <= MAX_NEYNAR_LIMIT,
      `Limit must be between 1 and ${MAX_NEYNAR_LIMIT}.`
    ),
  gameId: z
    .string()
    .regex(/^\d+$/, "Game ID must be a numeric string.")
    .optional()
    .transform((val) => (val ? Number(val) : undefined)),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const queryValidation = querySchema.safeParse({
      fid: searchParams.get("fid"),
      limit: searchParams.get("limit"),
      gameId: searchParams.get("gameId"),
    });

    if (!queryValidation.success) {
      const firstError =
        queryValidation.error.message || "Invalid query parameters";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }
    const { fid, limit, gameId: requestedGameId } = queryValidation.data;

    let targetGameId: number | null = requestedGameId ?? null;
    if (!targetGameId) {
      const activeGame = await fetchActiveGame();
      targetGameId = activeGame?.id ?? null;
    }

    let followersRes, followingRes;
    try {
      [followersRes, followingRes] = await Promise.all([
        neynar.fetchUserFollowers({ fid, limit }),
        neynar.fetchUserFollowing({ fid, limit }),
      ]);
    } catch (neynarError) {
      console.error(
        "Neynar API Error fetching followers/following:",
        neynarError
      );
      return NextResponse.json(
        { error: "Failed to fetch social graph from Farcaster." },
        { status: 503 }
      );
    }

    type FriendAccumulator = {
      username: string;
      displayName: string | null;
      pfpUrl: string | null;
      isFollower: boolean;
      isFollowing: boolean;
    };
    const friendsMap = new Map<number, FriendAccumulator>();

    const ingestNeynarUsers = (
      list: typeof followersRes.users,
      relationshipType: "isFollower" | "isFollowing"
    ) => {
      if (!Array.isArray(list)) return;
      for (const entry of list) {
        const user = entry?.user;
        if (!user?.fid) continue;

        const existing = friendsMap.get(user.fid);
        if (existing) {
          existing[relationshipType] = true;
        } else {
          friendsMap.set(user.fid, {
            username: user.username,
            displayName: user.display_name ?? null,
            pfpUrl: user.pfp_url ?? null,
            isFollower: relationshipType === "isFollower",
            isFollowing: relationshipType === "isFollowing",
          });
        }
      }
    };

    ingestNeynarUsers(followersRes?.users ?? [], "isFollower");
    ingestNeynarUsers(followingRes?.users ?? [], "isFollowing");

    if (friendsMap.size === 0) {
      return NextResponse.json({ friends: [], gameId: targetGameId });
    }

    const friendFids = Array.from(friendsMap.keys());

    const friendUsersWithTickets = await prisma.user.findMany({
      where: { fid: { in: friendFids } },
      select: {
        fid: true,
        tickets: targetGameId
          ? {
              where: { gameId: targetGameId, status: "confirmed" },
              select: { id: true, gameId: true },
              orderBy: { purchasedAt: "desc" },
              take: 1,
            }
          : false,
      },
    });

    const ticketLookup = new Map<
      number,
      { ticketId: number; gameId: number }
    >();
    for (const user of friendUsersWithTickets) {
      const firstTicket = user.tickets?.[0];
      if (firstTicket) {
        ticketLookup.set(user.fid, {
          ticketId: firstTicket.id,
          gameId: firstTicket.gameId,
        });
      }
    }

    const result: FriendSummary[] = friendFids.map((friendFid) => {
      const baseInfo = friendsMap.get(friendFid)!;
      const ticketInfo = ticketLookup.get(friendFid);

      return {
        fid: friendFid,
        username: baseInfo.username,
        displayName: baseInfo.displayName,
        pfpUrl: baseInfo.pfpUrl,
        relationship: {
          isFollower: baseInfo.isFollower,
          isFollowing: baseInfo.isFollowing,
        },
        hasTicket: Boolean(
          ticketInfo && (!targetGameId || ticketInfo.gameId === targetGameId)
        ),
        ticketId: ticketInfo?.ticketId,
        ticketGameId: ticketInfo?.gameId,
      };
    });

    result.sort((a, b) => {
      if (a.hasTicket !== b.hasTicket) {
        return a.hasTicket ? -1 : 1;
      }
      return a.username.localeCompare(b.username);
    });

    const responseData: FriendsApiResponse = {
      friends: result,
      gameId: targetGameId,
    };
    return NextResponse.json(responseData);
  } catch (error) {
    console.error("GET /api/social/friends Error:", error);
    const errorMessage =
      error instanceof Error && error.message.includes("Neynar")
        ? "Failed to fetch social graph data."
        : "Internal Server Error";
    const status =
      error instanceof Error && error.message.includes("Neynar") ? 503 : 500;

    return NextResponse.json({ error: errorMessage }, { status });
  }
}

export const dynamic = "force-dynamic";

async function fetchActiveGame(): Promise<{ id: number } | null> {
  try {
    const now = new Date();
    const game = await prisma.game.findFirst({
      where: {
        startTime: { lte: now },
        endTime: { gt: now },
      },
      select: { id: true },
      orderBy: { startTime: "asc" },
    });
    return game ? { id: game.id } : null;
  } catch (err) {
    console.error("Error fetching active game:", err);
    return null;
  }
}
