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

// ==========================================
// GAME PHASE
// ==========================================

export type GamePhase = "SCHEDULED" | "LIVE" | "ENDED";

export interface GameTiming {
  startsAt: Date;
  endsAt: Date;
}

/**
 * Derive game phase from timing.
 * Time is the source of truth - no status enum needed.
 */
export function getGamePhase(game: GameTiming): GamePhase {
  const now = Date.now();
  const startMs = game.startsAt.getTime();
  const endMs = game.endsAt.getTime();

  if (now < startMs) return "SCHEDULED";
  if (now < endMs) return "LIVE";
  return "ENDED";
}
