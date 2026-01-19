// Alarm phase handlers for PartyKit server

import type * as Party from "partykit/server";
import type { AlarmPhase } from "../types";
import type { Message } from "../../shared/protocol";

interface GameServer {
  room: Party.Room;
  getOnlineCount(): number;
  broadcast(msg: Message): void;
  sendNotifications(message: string, roomId?: string): Promise<void>;
}

/**
 * Handle notify alarm - sends 1 minute warning
 */
export async function handleNotifyAlarm(
  server: GameServer,
  roomId: string,
): Promise<void> {
  const gameId = await server.room.storage.get<string>("gameId");
  const startsAt = await server.room.storage.get<number>("startsAt");

  console.log("[PartyKit]", "notify_phase_start", {
    gameId,
    startsAt: startsAt ? new Date(startsAt).toISOString() : null,
  });

  await server.sendNotifications("Game starting in 1 minute! 🎮", roomId);
  server.broadcast({ type: "game:starting", in: 60 });

  // Schedule next alarm for game start
  await server.room.storage.put("alarmPhase", "start" as AlarmPhase);
  await server.room.storage.setAlarm(startsAt!);

  console.log("[PartyKit]", "notify_phase_complete", {
    gameId,
    nextPhase: "start",
  });
}

/**
 * Handle start alarm - game goes live
 */
export async function handleStartAlarm(
  server: GameServer,
  roomId: string,
): Promise<void> {
  const gameId = await server.room.storage.get<string>("gameId");
  const endsAt = await server.room.storage.get<number>("endsAt");

  console.log("[PartyKit]", "start_phase_begin", {
    gameId,
    endsAt: endsAt ? new Date(endsAt).toISOString() : null,
  });

  if (!endsAt) {
    console.error("[PartyKit]", "start_phase_no_endsAt", { gameId });
    return;
  }

  // Schedule game end alarm
  await server.room.storage.put("alarmPhase", "gameEnd" as AlarmPhase);
  await server.room.storage.setAlarm(endsAt);

  await server.sendNotifications("The game has started! 🚀", roomId);
  server.broadcast({ type: "game:live" });

  console.log("[PartyKit]", "start_phase_complete", {
    gameId,
    connectedClients: server.getOnlineCount(),
  });
}

/**
 * Handle game end alarm - triggers roundup
 */
export async function handleGameEndAlarm(
  server: GameServer,
  _roomId: string,
): Promise<void> {
  const gameId = await server.room.storage.get<string>("gameId");
  const appUrl = server.room.env.NEXT_PUBLIC_URL as string;
  const secret = server.room.env.PARTYKIT_SECRET as string;

  console.log("[PartyKit]", "gameEnd_phase_begin", { gameId });

  if (!gameId || !appUrl || !secret) {
    console.error("[PartyKit]", "gameEnd_missing_config", { gameId });
    return;
  }

  const roundupUrl = `${appUrl}/api/v1/internal/games/${gameId}/roundup`;

  try {
    console.log("[PartyKit]", "gameEnd_calling_roundup", { url: roundupUrl });

    const response = await fetch(roundupUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
      },
    });

    const result = await response.json();

    if (result.success) {
      server.broadcast({
        type: "game:end",
        gameId,
        prizePool: result.prizePool,
        winnersCount: result.winnersCount,
      });
      console.log("[PartyKit]", "gameEnd_roundup_success", { gameId });
    } else {
      console.error("[PartyKit]", "gameEnd_roundup_failed", {
        error: result.error,
      });
    }
  } catch (error) {
    console.error("[PartyKit]", "gameEnd_roundup_exception", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
