/**
 * Game Utilities
 *
 * Core helpers for game phase detection and Prisma queries.
 */

// ==========================================
// TYPES
// ==========================================

export type GamePhase = "SCHEDULED" | "LIVE" | "ENDED";

export interface GameTiming {
  startsAt: Date;
  endsAt: Date;
}

// ==========================================
// PHASE DETECTION
// ==========================================

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

// ==========================================
// PRISMA QUERY HELPERS
// ==========================================

/**
 * Prisma where clause for finding active game.
 * Returns game that is LIVE, or next SCHEDULED if none live.
 */
export function getActiveGameWhere() {
  const now = new Date();
  return {
    OR: [
      // Live game
      { startsAt: { lte: now }, endsAt: { gt: now } },
      // Next scheduled game
      { startsAt: { gt: now } },
    ],
  };
}

/**
 * Prisma orderBy for finding active game.
 * Prioritizes live games, then earliest scheduled.
 */
export function getActiveGameOrderBy() {
  return [{ startsAt: "asc" as const }];
}
