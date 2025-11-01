import type { Prisma } from "@prisma/client";

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
        name: true;
        imageUrl: true;
      };
    };
  };
}>;

export type GameThemes = "FOOTBALL" | "MOVIES" | "POLITICS" | "CRYPTO";

export interface PlayerInfo {
  username: string | null;
  wallet: string | null;
  pfpUrl: string | null;
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

export interface LeaderboardEntry {
  id: string | number;
  fid: number; // <-- ADDED THIS
  rank: number;
  username: string | null;
  points: number;
  pfpUrl: string | null;
}

export type FriendSummary = {
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
