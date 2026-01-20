"use server";

import PartySocket from "partysocket";
import { env } from "@/lib/env";

const SERVICE = "partykit-client";

// ==========================================
// HELPER
// ==========================================

function partyFetch(gameId: string, path: string, body: unknown) {
  const host = env.partykitHost || "localhost:1999";

  console.log("["+SERVICE+"]", "fetch_request", {
    gameId,
    path,
    host,
    room: `game-${gameId}`,
  });

  return PartySocket.fetch(
    {
      host,
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
    },
  );
}

// ==========================================
// FUNCTIONS
// ==========================================

/**
 * Initialize a PartyKit room for a new game.
 * THROWS on failure - caller must handle rollback.
 */
export async function initGameRoom(
  gameId: string,
  startsAt: Date,
  endsAt: Date,
): Promise<void> {
  if (!env.partykitHost || !env.partykitSecret) {
    throw new Error("PartyKit not configured");
  }

  console.log("["+SERVICE+"]", "init_room_request", {
    gameId,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
  });

  const res = await partyFetch(gameId, "init", {
    gameId,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "Unknown error");
    console.error("["+SERVICE+"]", "init_room_failed", {
      gameId,
      status: res.status,
      error: errorText,
    });
    throw new Error(`PartyKit init failed: ${errorText}`);
  }

  console.log("["+SERVICE+"]", "init_room_success", { gameId });
}

/**
 * Notify PartyKit of a ticket purchase.
 * Broadcasts both stats update and entrant addition atomically.
 */
export async function notifyTicketPurchased(
  gameId: string,
  data: {
    username: string;
    pfpUrl: string | null;
    prizePool: number;
    playerCount: number;
  },
): Promise<void> {
  if (!env.partykitHost || !env.partykitSecret) {
    console.warn("["+SERVICE+"]", "notify_ticket_purchased_skipped", {
      gameId,
      reason: "PartyKit not configured",
    });
    return;
  }

  try {
    const res = await partyFetch(gameId, "ticket-purchased", data);

    if (res.ok) {
      console.log("["+SERVICE+"]", "notify_ticket_purchased_success", {
        gameId,
        username: data.username,
        prizePool: data.prizePool,
        playerCount: data.playerCount,
      });
    } else {
      console.error("["+SERVICE+"]", "notify_ticket_purchased_failed", {
        gameId,
        status: res.status,
        statusText: res.statusText,
      });
    }
  } catch (err) {
    console.error("["+SERVICE+"]", "notify_ticket_purchased_error", {
      gameId,
      error: (err instanceof Error ? err.message : String(err)),
    });
  }
}

/**
 * Cleanup PartyKit room when a game is deleted.
 * Notifies the PartyKit server to close connections and free resources.
 */
export async function cleanupGameRoom(gameId: string): Promise<void> {
  if (!env.partykitHost || !env.partykitSecret) {
    console.warn("["+SERVICE+"]", "cleanup_skipped", {
      gameId,
      reason: "PartyKit not configured",
    });
    return;
  }

  try {
    console.log("["+SERVICE+"]", "cleanup_request", { gameId });

    const res = await partyFetch(gameId, "cleanup", {
      reason: "game_deleted",
    });

    if (res.ok) {
      console.log("["+SERVICE+"]", "cleanup_success", { gameId });
    } else {
      console.warn("["+SERVICE+"]", "cleanup_failed", {
        gameId,
        status: res.status,
      });
    }
  } catch (err) {
    // Don't throw - cleanup is best-effort
    console.error("["+SERVICE+"]", "cleanup_error", {
      gameId,
      error: (err instanceof Error ? err.message : String(err)),
    });
  }
}

/**
 * Update game timing in PartyKit storage and reschedule alarms.
 * Called when admin updates startsAt or endsAt.
 */
export async function updateGameTiming(
  gameId: string,
  startsAt: Date,
  endsAt: Date,
): Promise<void> {
  if (!env.partykitHost || !env.partykitSecret) {
    console.warn("["+SERVICE+"]", "update_timing_skipped", {
      gameId,
      reason: "PartyKit not configured",
    });
    return;
  }

  try {
    console.log("["+SERVICE+"]", "update_timing_request", {
      gameId,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
    });

    const res = await partyFetch(gameId, "update-game", {
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
    });

    if (res.ok) {
      console.log("["+SERVICE+"]", "update_timing_success", {
        gameId,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
      });
    } else {
      const errorText = await res.text();
      console.warn("["+SERVICE+"]", "update_timing_failed", {
        gameId,
        status: res.status,
        error: errorText,
      });
    }
  } catch (err) {
    // Don't throw - sync is best-effort
    console.error("["+SERVICE+"]", "update_timing_error", {
      gameId,
      error: (err instanceof Error ? err.message : String(err)),
    });
  }
}
