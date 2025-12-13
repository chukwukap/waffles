import { Prisma } from "@/lib/db";

export type GameStateType =
  | "WAITING"
  | "JOIN_GAME"
  | "FINAL_COUNTDOWN"
  | "GAME_LIVE"
  | "GAME_LIVE_ANSWER_SELECTED"
  | "GAME_LIVE_ANSWER_SUBMITTED"
  | "GAME_LIVE_NEXT_QUESTION_COUNTDOWN"
  | "GAME_LIVE_ROUND_COUNTDOWN"
  | "CHAT"
  | "GAME_OVER";

export type ChatWithUser = Prisma.ChatGetPayload<{
  include: {
    user: {
      select: {
        fid: true;
        id: true;
        username: true; // CHANGED
        pfpUrl: true; // CHANGED
      };
    };
  };
}>;

export type GameThemes = "FOOTBALL" | "MOVIES" | "POLITICS" | "CRYPTO";

export interface PlayerInfo {
  username: string | null;
  wallet: string | null;
  pfpUrl: string | null; // CHANGED
}

export interface Ticket {
  id: number;
  gameId: number;
  gameTitle?: string;
  userId?: number;
  txHash: string | null;
  code: string;
  amountUSDC: number;
  status: "pending" | "confirmed" | "used" | "invalid";
  purchasedAt: Date | string;
  usedAt?: Date | string | null;
}

export interface ReferralCode {
  code: string;
  inviterFid?: number | null;
  inviteeId?: number | null;
}

export interface InvitedBy {
  code: string;
  inviterFid: number | null;
  acceptedAt?: Date | string | null;
}

export interface GameHistoryEntry {
  id: number | string;
  name: string;
  score: number;
  claimedAt: string | Date | null;
  winnings: number;
  winningsColor?: "green" | "gray";
}

export interface AllTimeStats {
  totalGames: number;
  wins: number;
  winRate: string;
  totalWon: string;
  highestScore: number;
  averageScore: number;
  currentStreak: number;
  bestRank: number | string | null;
}

export interface ProfileStatsData {
  totalGames: number;
  wins: number;
  winRate: number;
  totalWon: number;
  highestScore: number;
  avgScore: number;
  currentStreak: number;
  bestRank: number | null;
}

// UPDATED LeaderboardEntry
export interface LeaderboardEntry {
  id: string | number; // This will be the User ID
  fid: number;
  rank: number;
  username: string | null;
  points: number;
  pfpUrl: string | null; // CHANGED
}

export type FriendSummary = {
  fid: number;
  username: string;
  displayName?: string | null;
  pfpUrl?: string | null; // CHANGED
  relationship: {
    isFollower: boolean;
    isFollowing: boolean;
  };
  hasTicket: boolean;
  ticketId?: number;
  ticketGameId?: number;
};
