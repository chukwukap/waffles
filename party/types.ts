// Party server types

export interface StoredChatMessage {
  id: string;
  text: string;
  username: string;
  pfp: string | null;
  ts: number;
}

export type AlarmPhase =
  // Pre-game countdown notifications
  | "24h"
  | "12h"
  | "3h"
  | "1h"
  | "5min"
  // Existing phases
  | "notify" // 1 minute warning
  | "start" // Game goes live
  | "gameEnd" // Game ends, trigger settlement
  // Post-game
  | "unclaimed"; // Reminder for unclaimed prizes

// CORS headers for HTTP responses
export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json",
};
