/**
 * Shared Type Definitions
 *
 * Types used across multiple components.
 * Prefer Prisma types directly when possible.
 */

import { GameTheme } from "@/lib/db";

// Re-export Prisma enum for convenience
export { GameTheme };

// ==========================================
// GAME HISTORY (Profile Page)
// ==========================================

export interface GameHistoryEntry {
  id: number | string;
  onchainId: string | null;
  name: string;
  score: number;
  claimedAt: string | Date | null;
  winnings: number;
  winningsColor?: "green" | "gray";
}

// ==========================================
// PROFILE STATS (Profile Page)
// ==========================================

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

// ==========================================
// LEADERBOARD (Leaderboard Page)
// ==========================================

export interface LeaderboardEntry {
  id: string | number;
  fid: number;
  rank: number;
  username: string | null;
  points: number;
  pfpUrl: string | null;
}
