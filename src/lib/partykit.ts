"use server";

import PartySocket from "partysocket";
import { env } from "@/lib/env";

// ==========================================
// HELPER
// ==========================================

function partyFetch(gameId: string, path: string, body: unknown) {
  return PartySocket.fetch(
    {
      host: env.partykitHost || "localhost:1999",
      room: `game-${gameId}`,
      party: "main",
      path,
    },
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.partykitSecret}`,
      },
      body: JSON.stringify(body),
    }
  );
}

// ==========================================
// FUNCTIONS
// ==========================================

/**
 * Broadcast updated game stats to all connected PartyKit clients.
 * Called when a ticket is purchased.
 */
export async function broadcastGameStats(
  gameId: string,
  stats: { prizePool: number; playerCount: number }
): Promise<void> {
  if (!env.partykitHost || !env.partykitSecret) {
    console.warn("[broadcastGameStats] PartyKit not configured");
    return;
  }

  try {
    const res = await partyFetch(gameId, "stats-update", stats);

    if (res.ok) {
      console.log(
        `[broadcastGameStats] Sent to game ${gameId}: prizePool=${stats.prizePool}, playerCount=${stats.playerCount}`
      );
    } else {
      console.error(`[broadcastGameStats] Failed: ${res.status}`);
    }
  } catch (err) {
    console.error(`[broadcastGameStats] Error:`, err);
  }
}

/**
 * Cleanup PartyKit room when a game is deleted.
 * Notifies the PartyKit server to close connections and free resources.
 */
export async function cleanupGameRoom(gameId: string): Promise<void> {
  if (!env.partykitHost || !env.partykitSecret) {
    console.warn("[cleanupGameRoom] PartyKit not configured");
    return;
  }

  try {
    const res = await partyFetch(gameId, "cleanup", {
      reason: "game_deleted",
    });

    if (res.ok) {
      console.log(`[cleanupGameRoom] Cleaned up room for game ${gameId}`);
    } else {
      console.warn(
        `[cleanupGameRoom] Failed for game ${gameId}: ${res.status}`
      );
    }
  } catch (err) {
    // Don't throw - cleanup is best-effort
    console.error(`[cleanupGameRoom] Error for game ${gameId}:`, err);
  }
}

/**
 * Update game timing in PartyKit storage and reschedule alarms.
 * Called when admin updates startsAt or endsAt.
 */
export async function updateGameTiming(
  gameId: string,
  startsAt: Date,
  endsAt: Date
): Promise<void> {
  if (!env.partykitHost || !env.partykitSecret) {
    console.warn("[updateGameTiming] PartyKit not configured");
    return;
  }

  try {
    const res = await partyFetch(gameId, "update-timing", {
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
    });

    if (res.ok) {
      console.log(`[updateGameTiming] Updated timing for game ${gameId}`);
    } else {
      const error = await res.text();
      console.warn(
        `[updateGameTiming] Failed for game ${gameId}: ${res.status} - ${error}`
      );
    }
  } catch (err) {
    // Don't throw - sync is best-effort
    console.error(`[updateGameTiming] Error for game ${gameId}:`, err);
  }
}
