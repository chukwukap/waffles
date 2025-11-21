import ProfilePageClient from "./client";
import { prisma } from "@/lib/db";
import { GameHistoryEntry, ProfileStatsData } from "@/lib/types";
import { cache } from "react";
import { calculateStreak } from "@/lib/streaks";
import { redirect } from "next/navigation";

// Define the payload type for the client
interface ProfilePagePayload {
  profileData: {
    fid: number;
    username: string | null;
    wallet: string | null;
    pfpUrl: string | null;
  } | null;
  stats: ProfileStatsData | null;
  gameHistory: GameHistoryEntry[] | null;
  streak: number;
  username: string | null;
  inviteCode: string | null;
  referralStatusData: number | null;
}

/**
 * Fetches all data required for the profile page in a single, optimized query.
 */
const getProfilePageData = cache(
  async (fidRaw: number | null): Promise<ProfilePagePayload> => {
    // 1. Require a valid FID
    if (!fidRaw || isNaN(fidRaw)) {
      return {
        profileData: null,
        stats: null,
        gameHistory: [],
        streak: 0,
        username: null,
        inviteCode: null,
        referralStatusData: null,
      };
    }

    // 2. Fetch all user data in one go
    const userFull = await prisma.user.findUnique({
      where: { fid: fidRaw },
      select: {
        // Profile Data
        id: true,
        fid: true,
        username: true,
        pfpUrl: true,
        wallet: true,
        inviteCode: true,
        status: true, // Added status

        // Stats Data: Get all games the user played
        games: {
          // This is GamePlayer[]
          select: {
            score: true,
            rank: true, // This is finalRank, might be null
            joinedAt: true,
            claimedAt: true,
            game: {
              select: {
                id: true,
                title: true, // Renamed from name
                startsAt: true, // Renamed from startTime
                // Get this user's ticket for this game to find winnings
                tickets: {
                  where: {
                    // userId: { equals: prisma.user.fields.id }, // Failsafe, though relation should handle
                    status: "PAID", // or "REDEEMED" ? Let's check enum
                  },
                  select: { amountUSDC: true },
                  take: 1,
                },
              },
            },
          },
          orderBy: {
            joinedAt: "desc", // For streak and history (most recent first)
          },
        },

        // Referral Count
        _count: {
          select: {
            rewards: true, // Counts records where this user is the inviter
          },
        },
      },
    });

    // 3. If user not found, bail
    if (!userFull) {
      return {
        profileData: null,
        stats: null,
        gameHistory: [],
        streak: 0,
        username: null,
        inviteCode: null,
        referralStatusData: null,
      };
    }

    // Enforce access control
    if (userFull.status !== "ACTIVE") {
      redirect("/invite");
    }

    // 4. Process the data into stats
    const totalGames = userFull.games.length;
    let wins = 0;
    let totalWon = 0;
    let highestScore = 0;
    let scoreSum = 0;
    const allRanks: (number | null)[] = [];
    const gameDates: Date[] = [];

    for (const game of userFull.games) {
      // Check for Win (assuming rank 1 is a win)
      if (game.rank === 1) {
        wins += 1;
      }
      // Sum Winnings
      const winnings = game.game.tickets[0]?.amountUSDC ?? 0;
      totalWon += winnings;

      // Find Highest Score
      if (game.score > highestScore) {
        highestScore = game.score;
      }
      // Sum for Average
      scoreSum += game.score;

      // Collect Ranks
      allRanks.push(game.rank);

      // Collect Dates for Streak
      gameDates.push(game.joinedAt);
    }

    const avgScore = totalGames > 0 ? scoreSum / totalGames : 0;
    const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;
    const bestRank =
      allRanks.length > 0
        ? Math.min(...allRanks.filter((r): r is number => r !== null))
        : null;

    // Calculate streak using the dedicated lib function
    const currentStreak = calculateStreak(gameDates);

    // 5. Build Game History (max 14, already ordered by query)
    const gameHistory: GameHistoryEntry[] = userFull.games
      .slice(0, 14)
      .map((g) => {
        const winnings = g.game.tickets[0]?.amountUSDC ?? 0;
        return {
          id: g.game.id,
          name: g.game.title ?? "Game",
          score: g.score,
          claimedAt: g.claimedAt,
          winnings: winnings,
          winningsColor: winnings > 0 ? "green" : "gray",
        };
      });

    // 6. Compile Final Payload
    const profileData = {
      fid: userFull.fid,
      username: userFull.username,
      wallet: userFull.wallet,
      pfpUrl: userFull.pfpUrl,
    };

    const stats: ProfileStatsData = {
      totalGames,
      wins,
      winRate,
      totalWon,
      highestScore,
      avgScore: Math.round(avgScore),
      currentStreak,
      bestRank,
    };

    return {
      profileData,
      stats,
      gameHistory,
      streak: currentStreak,
      username: profileData.username,
      inviteCode: userFull.inviteCode,
      referralStatusData: userFull._count.rewards,
    };
  }
);

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ fid: string }>;
}) {
  const { fid } = await searchParams;
  // Pass single promise prop
  const profilePageDataPromise = getProfilePageData(Number(fid));
  return <ProfilePageClient profilePageDataPromise={profilePageDataPromise} />;
}
