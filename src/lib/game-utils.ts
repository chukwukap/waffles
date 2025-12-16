/**
 * Game Utilities
 *
 * Core helpers for game phase detection and time calculations.
 * These replace the old GameStatus enum with derived state.
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
 * No status enum needed - time is the source of truth.
 */
export function getGamePhase(game: GameTiming): GamePhase {
  const now = Date.now();
  const startMs = game.startsAt.getTime();
  const endMs = game.endsAt.getTime();

  if (now < startMs) return "SCHEDULED";
  if (now < endMs) return "LIVE";
  return "ENDED";
}

/**
 * Check if game is currently live.
 */
export function isGameLive(game: GameTiming): boolean {
  return getGamePhase(game) === "LIVE";
}

/**
 * Check if game has ended.
 */
export function isGameEnded(game: GameTiming): boolean {
  return getGamePhase(game) === "ENDED";
}

/**
 * Check if game is scheduled (not started yet).
 */
export function isGameScheduled(game: GameTiming): boolean {
  return getGamePhase(game) === "SCHEDULED";
}

// ==========================================
// TIME CALCULATIONS
// ==========================================

/**
 * Get seconds until game starts.
 * Returns 0 if game has already started.
 */
export function getSecondsUntilStart(game: GameTiming): number {
  const diff = game.startsAt.getTime() - Date.now();
  return Math.max(0, Math.floor(diff / 1000));
}

/**
 * Get seconds until game ends.
 * Returns 0 if game has already ended.
 */
export function getSecondsUntilEnd(game: GameTiming): number {
  const diff = game.endsAt.getTime() - Date.now();
  return Math.max(0, Math.floor(diff / 1000));
}

/**
 * Get game duration in seconds.
 */
export function getGameDuration(game: GameTiming): number {
  return Math.floor((game.endsAt.getTime() - game.startsAt.getTime()) / 1000);
}

/**
 * Get elapsed time since game started (in seconds).
 * Returns 0 if game hasn't started yet.
 */
export function getElapsedSeconds(game: GameTiming): number {
  if (isGameScheduled(game)) return 0;
  const diff = Date.now() - game.startsAt.getTime();
  return Math.max(0, Math.floor(diff / 1000));
}

// ==========================================
// FORMATTING
// ==========================================

/**
 * Format seconds as MM:SS or HH:MM:SS.
 */
export function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "00:00";

  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
}

/**
 * Format prize pool as currency string.
 */
export function formatPrizePool(amount: number): string {
  return `$${amount.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

/**
 * Format player count with proper pluralization.
 */
export function formatPlayerCount(count: number): string {
  return `${count} ${count === 1 ? "player" : "players"}`;
}

// ==========================================
// QUERY HELPERS
// ==========================================

/**
 * Build Prisma where clause for finding active game.
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
 * Build Prisma orderBy for finding active game.
 * Prioritizes live games, then earliest scheduled.
 */
export function getActiveGameOrderBy() {
  return [{ startsAt: "asc" as const }];
}
