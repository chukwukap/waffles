// HTTP API handlers for PartyKit server

import type * as Party from "partykit/server";
import { CORS_HEADERS, type AlarmPhase } from "../types";
import type { Entrant } from "../../shared/protocol";
import { handleStartAlarm } from "./alarms";

interface GameServer {
  room: Party.Room;
  entrants: Entrant[];
  chatHistory: unknown[];
  seenFids: Set<number>;
  getOnlineCount(): number;
  broadcast(msg: unknown): void;
}

// Common auth check
function checkAuth(req: Party.Request, secret: string): boolean {
  const authHeader = req.headers.get("Authorization");
  return authHeader === `Bearer ${secret}`;
}

// Debug endpoint
export async function handleDebug(server: GameServer): Promise<Response> {
  const gameId = await server.room.storage.get<string>("gameId");
  const startsAt = await server.room.storage.get<number>("startsAt");
  const endsAt = await server.room.storage.get<number>("endsAt");
  const alarmPhase = await server.room.storage.get<AlarmPhase>("alarmPhase");
  const currentAlarm = await server.room.storage.getAlarm();
  const now = Date.now();

  const debugInfo = {
    roomId: server.room.id,
    gameId,
    now: new Date(now).toISOString(),
    startsAt: startsAt ? new Date(startsAt).toISOString() : null,
    endsAt: endsAt ? new Date(endsAt).toISOString() : null,
    alarmPhase,
    alarmScheduled: currentAlarm ? new Date(currentAlarm).toISOString() : null,
    alarmInMs: currentAlarm ? currentAlarm - now : null,
    connectedClients: server.getOnlineCount(),
    chatHistoryCount: server.chatHistory.length,
    seenFidsCount: server.seenFids.size,
  };

  console.log("[PartyKit]", "debug_endpoint_called", debugInfo);
  return Response.json(debugInfo, { headers: CORS_HEADERS });
}

// Init endpoint - called when admin creates game
export async function handleInit(
  server: GameServer,
  req: Party.Request,
): Promise<Response> {
  const body = (await req.json()) as {
    gameId: string;
    startsAt: string;
    endsAt: string;
  };

  const startsAt = new Date(body.startsAt).getTime();
  const endsAt = new Date(body.endsAt).getTime();
  const notifyTime = startsAt - 60 * 1000;
  const now = Date.now();

  console.log("[PartyKit]", "init_received", {
    gameId: body.gameId,
    startsAt: new Date(startsAt).toISOString(),
    endsAt: new Date(endsAt).toISOString(),
    notifyTime: new Date(notifyTime).toISOString(),
  });

  await server.room.storage.put("gameId", body.gameId);
  await server.room.storage.put("startsAt", startsAt);
  await server.room.storage.put("endsAt", endsAt);

  if (notifyTime > now) {
    await server.room.storage.put("alarmPhase", "notify" as AlarmPhase);
    await server.room.storage.setAlarm(notifyTime);
    console.log("[PartyKit]", "init_alarm_scheduled", { phase: "notify" });
  } else if (startsAt > now) {
    await server.room.storage.put("alarmPhase", "start" as AlarmPhase);
    await server.room.storage.setAlarm(startsAt);
    console.log("[PartyKit]", "init_alarm_scheduled", { phase: "start" });
  } else {
    console.log("[PartyKit]", "init_immediate_start");
    // Immediate start - call alarm handler directly
    // Note: This requires server to have sendNotifications method
    await handleStartAlarm(server as any, server.room.id);
  }

  return Response.json(
    { success: true, gameId: body.gameId },
    { headers: CORS_HEADERS },
  );
}

// Ticket purchased endpoint
export async function handleTicketPurchased(
  server: GameServer,
  req: Party.Request,
): Promise<Response> {
  const body = (await req.json()) as {
    username: string;
    pfpUrl: string | null;
    prizePool: number;
    playerCount: number;
  };

  const entrant: Entrant = {
    username: body.username,
    pfpUrl: body.pfpUrl,
    timestamp: Date.now(),
  };

  server.entrants = [
    entrant,
    ...server.entrants.filter((e) => e.username !== entrant.username),
  ].slice(0, 20);

  await server.room.storage.put("entrants", server.entrants);

  server.broadcast({
    type: "stats",
    prizePool: body.prizePool,
    playerCount: body.playerCount,
  });
  server.broadcast({
    type: "entrant:new",
    username: entrant.username,
    pfpUrl: entrant.pfpUrl,
    timestamp: entrant.timestamp,
  });

  console.log("[PartyKit]", "ticket_purchased_broadcasted", {
    username: entrant.username,
    prizePool: body.prizePool,
    playerCount: body.playerCount,
  });

  return Response.json({ success: true }, { headers: CORS_HEADERS });
}

// Update timing endpoint
export async function handleUpdateTiming(
  server: GameServer,
  req: Party.Request,
): Promise<Response> {
  const body = (await req.json()) as {
    startsAt: string;
    endsAt: string;
  };

  const startsAt = new Date(body.startsAt).getTime();
  const endsAt = new Date(body.endsAt).getTime();
  const notifyTime = startsAt - 60 * 1000;
  const now = Date.now();
  const gameId = await server.room.storage.get<string>("gameId");

  console.log("[PartyKit]", "update_timing_received", {
    gameId,
    startsAt: new Date(startsAt).toISOString(),
    endsAt: new Date(endsAt).toISOString(),
  });

  await server.room.storage.put("startsAt", startsAt);
  await server.room.storage.put("endsAt", endsAt);

  if (notifyTime > now) {
    await server.room.storage.put("alarmPhase", "notify" as AlarmPhase);
    await server.room.storage.setAlarm(notifyTime);
  } else if (startsAt > now) {
    await server.room.storage.put("alarmPhase", "start" as AlarmPhase);
    await server.room.storage.setAlarm(startsAt);
  }

  return Response.json({ success: true }, { headers: CORS_HEADERS });
}

export { checkAuth };
