import { Suspense } from "react";
import { prisma } from "@/lib/db";
import ProfilePageClient from "./_components/profilePageClient";
import { SplashScreen } from "@/components/ui/SplashScreen";
import { GameHistoryEntry } from "@/state/types";
import { cookies } from "next/headers";

// Get the current user's fid from cookies
export async function getCurrentUserFid(): Promise<number | null> {
  const cookieStore = await cookies();
  const fidCookie = cookieStore.get("fid")?.value;
  if (!fidCookie || isNaN(Number(fidCookie))) return null;
  return Number(fidCookie);
}

// ProfileData maps to client
async function getProfileData(fid: number | null) {
  if (!fid) return null;
  const user = await prisma.user.findUnique({
    where: { fid: fid },
    select: {
      fid: true,
      name: true,
      wallet: true,
      imageUrl: true,
    },
  });
  return user;
}

async function getProfileStatsData(userId: number | null) {
  if (!userId) return null;

  // Total games played (using GameParticipant)
  const totalGames = await prisma.gameParticipant.count({
    where: { userId },
  });

  // Get scores for this user
  const scores = await prisma.score.findMany({
    where: { userId },
    select: { points: true, gameId: true },
  });

  let wins = 0;
  let highestScore = 0;
  let totalWon = 0;
  const allPlacements: number[] = [];

  // To compute placements, fetch all games user has played with scores
  const gameIds = scores.map((s) => s.gameId);
  let bestRank: number | string = "-";
  if (gameIds.length > 0) {
    // Get all scores for these games in bulk
    const allScoresForGames = await prisma.score.findMany({
      where: { gameId: { in: gameIds } },
      select: { gameId: true, userId: true, points: true },
    });

    // Map gameId -> all scores for that game
    const scoresByGame: Record<number, { userId: number; points: number }[]> =
      {};
    for (const s of allScoresForGames) {
      if (!scoresByGame[s.gameId]) scoresByGame[s.gameId] = [];
      scoresByGame[s.gameId].push({ userId: s.userId, points: s.points });
    }

    for (const entry of scores) {
      const scoresForGame = scoresByGame[entry.gameId] ?? [];
      // Find placement: sort descending by points
      const sorted = [...scoresForGame].sort((a, b) => b.points - a.points);
      const placement = sorted.findIndex((item) => item.userId === userId) + 1;
      if (placement > 0) {
        allPlacements.push(placement);
      }
    }
    // Find best (minimum) rank
    if (allPlacements.length > 0) {
      bestRank = Math.min(...allPlacements);
    }
  }

  // For "wins", define as having the highest score in a game.
  for (const entry of scores) {
    const winningScore = await prisma.score.findFirst({
      where: { gameId: entry.gameId },
      orderBy: { points: "desc" },
    });
    if (
      winningScore?.userId === userId &&
      entry.points === winningScore.points
    ) {
      wins += 1;
    }
    if (entry.points > highestScore) highestScore = entry.points;
    totalWon += entry.points > 0 ? entry.points : 0;
  }

  const avgScore =
    scores.length > 0
      ? scores.reduce((sum, score) => sum + score.points, 0) / scores.length
      : 0;
  const winRate = totalGames > 0 ? wins / totalGames : 0;

  // Simple streak: consecutive games where user scored > 0
  let currentStreak = 0;
  const playedGameIds = scores.map((s) => s.gameId);
  if (playedGameIds.length > 0) {
    const lastGames = await prisma.game.findMany({
      where: { id: { in: playedGameIds } },
      orderBy: { startTime: "desc" },
      select: { id: true, startTime: true },
    });
    for (const g of lastGames) {
      const sc = scores.find((s) => s.gameId === g.id);
      if (sc && sc.points > 0) currentStreak += 1;
      else break;
    }
  }

  return {
    totalGames,
    wins,
    winRate,
    totalWon,
    highestScore,
    avgScore,
    currentStreak,
    bestRank,
  };
}

async function getGameHistory(
  userId: number | null
): Promise<GameHistoryEntry[]> {
  if (!userId) return [];
  // Get recent games the user played in, with their score and position
  const participants = await prisma.gameParticipant.findMany({
    where: { userId },
    orderBy: { joinedAt: "desc" },
    take: 14,
    include: {
      game: {
        select: {
          id: true,
          name: true,
          startTime: true,
        },
      },
    },
  });

  // bulk get all scores for games user participated in
  const allScores = await prisma.score.findMany({
    where: {
      gameId: { in: participants.map((p) => p.gameId) },
    },
    select: { gameId: true, userId: true, points: true, id: true },
  });

  // get tickets for winnings/amountUSDC (prize) if applicable
  const allTickets = await prisma.ticket.findMany({
    where: {
      userId,
      gameId: { in: participants.map((p) => p.gameId) },
      status: "confirmed",
    },
    select: { gameId: true, amountUSDC: true },
  });

  // Build the GameHistoryEntry[]
  const history: GameHistoryEntry[] = participants.map((p) => {
    // Get score for this game
    const score = allScores.find(
      (s) => s.userId === userId && s.gameId === p.gameId
    );
    // Ranking (1-indexed placement)
    const scoresThisGame = allScores
      .filter((s) => s.gameId === p.gameId)
      .sort((a, b) => b.points - a.points);
    const placement =
      score && scoresThisGame.length > 0
        ? scoresThisGame.findIndex((s) => s.userId === userId) + 1
        : undefined;

    // Find confirmed winnings for this game (if any, from ticket, or set to 0)
    const ticket = allTickets.find((t) => t.gameId === p.gameId);
    const winnings = ticket ? ticket.amountUSDC : 0;

    return {
      id: p.game.id,
      name: p.game.name ?? "Game",
      score: score?.points ?? 0,
      winnings: winnings,
      winningsColor: winnings > 0 ? "green" : "gray",
    };
  });

  return history;
}

async function getInviteData(userId: number | null) {
  if (!userId) return { code: null, status: null };

  // Get referral code generated by user, if any
  const referral = await prisma.referral.findFirst({
    where: { inviterId: userId },
    orderBy: { createdAt: "asc" },
  });
  const inviteCode = referral?.code ?? null;

  // Referral status info (e.g., # of successful invites)
  const status = await prisma.referral.count({
    where: { inviterId: userId, acceptedAt: { not: null } },
  });

  return {
    code: inviteCode,
    status,
  };
}

export default async function ProfilePage() {
  const fid = await getCurrentUserFid();

  let profileData = await getProfileData(fid);
  let stats = null;
  let gameHistory: GameHistoryEntry[] = [];
  let inviteCode: string | null = null;
  let referralStatusData: number | null = null;
  let streak = 0;
  let username: string | null = null;

  let userId =
    profileData?.fid != null
      ? (
          await prisma.user.findUnique({
            where: { fid: profileData.fid },
            select: { id: true },
          })
        )?.id ?? null
      : null;

  if (userId) {
    stats = await getProfileStatsData(userId);
    gameHistory = await getGameHistory(userId);
    username = profileData?.name ?? null;
    streak = stats?.currentStreak ?? 0;
    const invite = await getInviteData(userId);
    inviteCode = invite.code;
    referralStatusData = invite.status;
  }

  // Fallback for demo mode: show any user profile if no user is logged in
  if (!profileData) {
    const anyUser = await prisma.user.findFirst();
    if (anyUser) {
      profileData = {
        fid: anyUser.fid,
        name: anyUser.name,
        wallet: anyUser.wallet,
        imageUrl: anyUser.imageUrl,
      };
      userId = anyUser.id;
      stats = await getProfileStatsData(userId);
      gameHistory = await getGameHistory(userId);
      username = profileData.name ?? null;
      streak = stats?.currentStreak ?? 0;
      const invite = await getInviteData(userId);
      inviteCode = invite.code;
      referralStatusData = invite.status;
    }
  }

  return (
    <Suspense fallback={<SplashScreen />}>
      <ProfilePageClient
        profileData={profileData}
        stats={stats}
        gameHistory={gameHistory}
        streak={streak}
        username={username}
        inviteCode={inviteCode}
        referralStatusData={referralStatusData}
      />
    </Suspense>
  );
}
