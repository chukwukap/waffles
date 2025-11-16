"use server";
import ProfilePageClient from "./_components/profilePageClient";
import { prisma } from "@/lib/db";
import { GameHistoryEntry } from "@/lib/types";
import { cache } from "react";

// Only one cached loader, fetches everything needed in a single query, shape is same as props before
const getProfilePageData = cache(async (fidRaw: number | null) => {
  let profileData = null;
  let user: {
    id: number;
    fid: number;
    name: string | null;
    wallet: string | null;
    imageUrl: string | null;
  } | null = null;

  // Require user by fid: if not found, bail (NO demo fallback)
  if (fidRaw) {
    user = await prisma.user.findUnique({
      where: { fid: fidRaw },
      select: { fid: true, name: true, wallet: true, imageUrl: true, id: true },
    });
  }

  // If we have no user, bail
  if (!user) {
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

  profileData = {
    fid: user.fid,
    name: user.name,
    wallet: user.wallet,
    imageUrl: user.imageUrl,
  };

  // Get everything needed about this user in a single shot via nested Prisma include/selects
  // (minimizing DB roundtrips and only selecting the data we actually use)
  const userFull = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      // Scores: for stats (winrate, high score, etc)
      scores: {
        select: { points: true, gameId: true },
      },
      // Games this user participated in (limit 14 most recent for history)
      gameParticipants: {
        orderBy: { joinedAt: "desc" },
        take: 14,
        select: {
          gameId: true,
          joinedAt: true,
          game: {
            select: { id: true, name: true, startTime: true },
          },
        },
      },
      // Tickets for any of the above games (only CONFIRMED tickets)
      tickets: {
        where: {
          status: "confirmed",
        },
        select: { gameId: true, amountUSDC: true },
      },
      // Referral code and referral stats
      invitations: {
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { code: true },
      },
      _count: {
        select: {
          // Total number of games played
          gameParticipants: true,
          // Number of accepted referrals
          invitations: {
            where: { acceptedAt: { not: null } },
          },
        },
      },
    },
  });

  // Defensive: if no user now, bail (should never hit)
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

  // --- Gather unique game IDs for all user games (scores and history) ---
  const allGameIds = [
    ...new Set([
      ...userFull.scores.map((s) => s.gameId),
      ...userFull.gameParticipants.map((gp) => gp.gameId),
    ]),
  ];

  // For stats, to compute win/loss and positioning, fetch all scores for these games in one go
  let allScoresForUserGames: {
    gameId: number;
    userId: number;
    points: number;
  }[] = [];
  if (allGameIds.length > 0) {
    // Only select what's required
    allScoresForUserGames = await prisma.score.findMany({
      where: { gameId: { in: allGameIds } },
      select: { gameId: true, userId: true, points: true },
    });
  }

  // --- Build stats for profile ---

  // Build record of all scores for all games by gameId for lookup
  const scoresByGame: Record<number, { userId: number; points: number }[]> = {};
  for (const s of allScoresForUserGames) {
    if (!scoresByGame[s.gameId]) scoresByGame[s.gameId] = [];
    scoresByGame[s.gameId].push({ userId: s.userId, points: s.points });
  }

  // Placement/bestRank logic
  let bestRank: number | string = "-";
  const allPlacements: number[] = [];
  for (const entry of userFull.scores) {
    const sorted = (scoresByGame[entry.gameId] ?? []).sort(
      (a, b) => b.points - a.points
    );
    const placement =
      sorted.findIndex((item) => item.userId === userFull.id) + 1;
    if (placement > 0) allPlacements.push(placement);
  }
  if (allPlacements.length > 0) bestRank = Math.min(...allPlacements);

  // Single pass for wins, high score, total won
  let wins = 0;
  let highestScore = 0;
  let totalWon = 0;

  for (const entry of userFull.scores) {
    const players = scoresByGame[entry.gameId] ?? [];
    const topScore = Math.max(...players.map((p) => p.points), 0);
    if (entry.points === topScore && topScore > 0 && players.length > 0) {
      wins += 1;
    }
    if (entry.points > highestScore) highestScore = entry.points;
    totalWon += entry.points > 0 ? entry.points : 0;
  }

  const avgScore =
    userFull.scores.length > 0
      ? userFull.scores.reduce((sum, score) => sum + score.points, 0) /
        userFull.scores.length
      : 0;

  const totalGames = userFull._count.gameParticipants;
  const winRate = totalGames > 0 ? wins / totalGames : 0;

  // Calculate current streak (consecutive user scores >0, in most recent play order)
  // Use startTime sort from the up-to-14 recent games, but only count if user has a score
  let currentStreak = 0;
  if (userFull.gameParticipants.length > 0) {
    // Need mapping of gameId -> score for this user
    const scoreMap = Object.fromEntries(
      userFull.scores.map((s) => [s.gameId, s.points])
    );
    // sort gameParticipants by joinedAt (should already be desc)
    for (const gp of userFull.gameParticipants) {
      if ((scoreMap[gp.gameId] ?? 0) > 0) currentStreak += 1;
      else break;
    }
  }

  // --- Build Game History (14 max, with placement, score, winnings, etc) ---
  // Map all scores for quick lookup by gameId
  const historyScoresByGame: Record<
    number,
    { userId: number; points: number }[]
  > = {};
  for (const s of allScoresForUserGames) {
    if (!historyScoresByGame[s.gameId]) historyScoresByGame[s.gameId] = [];
    historyScoresByGame[s.gameId].push({ userId: s.userId, points: s.points });
  }

  // Build map for userFull.tickets by gameId for lookup
  const ticketMap: Record<number, number> = {};
  for (const t of userFull.tickets) {
    ticketMap[t.gameId] = t.amountUSDC;
  }

  const gameHistory: GameHistoryEntry[] = userFull.gameParticipants.map((p) => {
    const playersInGame = (historyScoresByGame[p.gameId] ?? []).sort(
      (a, b) => b.points - a.points
    );
    const scoreObj = playersInGame.find((i) => i.userId === userFull.id);
    const winnings = ticketMap[p.gameId] || 0;
    return {
      id: p.game.id,
      name: p.game.name ?? "Game",
      score: scoreObj?.points ?? 0,
      winnings: winnings,
      winningsColor: winnings > 0 ? "green" : "gray",
    };
  });

  // Compile referral info
  const inviteCode = userFull.invitations[0]?.code ?? null;
  const referralStatusData = userFull._count.invitations ?? 0;

  return {
    profileData,
    stats: {
      totalGames,
      wins,
      winRate,
      totalWon,
      highestScore,
      avgScore,
      currentStreak,
      bestRank,
    },
    gameHistory,
    streak: currentStreak,
    username: profileData?.name ?? null,
    inviteCode,
    referralStatusData,
  };
});

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
