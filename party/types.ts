// Party server types

export interface StoredChatMessage {
  id: string;
  text: string;
  username: string;
  pfp: string | null;
  ts: number;
}

export type AlarmPhase = "notify" | "start" | "gameEnd";

// CORS headers for HTTP responses
export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json",
};
