import type * as Party from "partykit/server";
import { jwtVerify } from "jose";
import type { Message, ChatItem, Player } from "../shared/protocol";

// ==========================================
// INTERNAL TYPES
// ==========================================

interface StoredChatMessage {
  id: string;
  text: string;
  username: string;
  pfp: string | null;
  ts: number;
}

type AlarmPhase = "notify" | "start" | "gameEnd";

// Log levels for structured logging
type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

// ==========================================
// LOGGING UTILITY
// Structured logging for PartyKit monitoring via `npx partykit tail`
// ==========================================

function log(
  level: LogLevel,
  roomId: string,
  event: string,
  data?: Record<string, unknown>
) {
  const timestamp = new Date().toISOString();
  const logData = {
    ts: timestamp,
    level,
    room: roomId,
    event,
    ...data,
  };
  // Use console methods for proper level filtering
  switch (level) {
    case "ERROR":
      console.error(JSON.stringify(logData));
      break;
    case "WARN":
      console.warn(JSON.stringify(logData));
      break;
    case "DEBUG":
      console.debug(JSON.stringify(logData));
      break;
    default:
      console.log(JSON.stringify(logData));
  }
}

// ==========================================
// GAME SERVER
// ==========================================

export default class GameServer implements Party.Server {
  readonly options: Party.ServerOptions = { hibernate: true };

  chatHistory: StoredChatMessage[] = [];
  seenFids: Set<number> = new Set();

  constructor(readonly room: Party.Room) {
    // Note: Cannot access room.id in constructor during alarm wake-ups
    // Logging moved to onStart() where room.id is reliably available
  }

  // ==========================================
  // AUTHENTICATION
  // ==========================================

  static async onBeforeConnect(
    request: Party.Request,
    lobby: Party.Lobby
  ): Promise<Party.Request | Response> {
    try {
      const url = new URL(request.url);
      const token = url.searchParams.get("token");

      if (!token) {
        return new Response("Unauthorized: No token", { status: 401 });
      }

      const secret = lobby.env.PARTYKIT_SECRET as string;
      if (!secret) {
        return new Response("Server configuration error", { status: 500 });
      }

      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(secret),
        { algorithms: ["HS256"] }
      );

      if (!payload.fid || !payload.username) {
        return new Response("Unauthorized: Invalid token", { status: 401 });
      }

      request.headers.set("X-User-Fid", String(payload.fid));
      request.headers.set("X-User-Username", String(payload.username));
      request.headers.set(
        "X-User-PfpUrl",
        payload.pfpUrl ? String(payload.pfpUrl) : ""
      );

      return request;
    } catch {
      return new Response("Unauthorized: Invalid token", { status: 401 });
    }
  }

  // ==========================================
  // HTTP API
  // ==========================================

  async onRequest(req: Party.Request): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname.split("/").pop();

    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Content-Type": "application/json",
    };

    if (req.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    switch (path) {
      // ==========================================
      // DEBUG - Health check and state inspection
      // ==========================================
      case "debug": {
        const secret = this.room.env.PARTYKIT_SECRET as string;
        const authHeader = req.headers.get("Authorization");
        if (authHeader !== `Bearer ${secret}`) {
          return Response.json(
            { error: "Unauthorized" },
            { status: 401, headers }
          );
        }

        try {
          const gameId = await this.room.storage.get<string>("gameId");
          const startsAt = await this.room.storage.get<number>("startsAt");
          const endsAt = await this.room.storage.get<number>("endsAt");
          const alarmPhase = await this.room.storage.get<AlarmPhase>(
            "alarmPhase"
          );
          const currentAlarm = await this.room.storage.getAlarm();
          const now = Date.now();

          const debugInfo = {
            roomId: this.room.id,
            gameId,
            now: new Date(now).toISOString(),
            startsAt: startsAt ? new Date(startsAt).toISOString() : null,
            endsAt: endsAt ? new Date(endsAt).toISOString() : null,
            alarmPhase,
            alarmScheduled: currentAlarm
              ? new Date(currentAlarm).toISOString()
              : null,
            alarmInMs: currentAlarm ? currentAlarm - now : null,
            connectedClients: this.getOnlineCount(),
            chatHistoryCount: this.chatHistory.length,
            seenFidsCount: this.seenFids.size,
            env: {
              hasPartykitSecret: !!this.room.env.PARTYKIT_SECRET,
              hasNextPublicUrl: !!this.room.env.NEXT_PUBLIC_URL,
              nextPublicUrl: this.room.env.NEXT_PUBLIC_URL || "NOT_SET",
            },
          };

          log("DEBUG", this.room.id, "debug_endpoint_called", debugInfo);
          return Response.json(debugInfo, { headers });
        } catch (error) {
          return Response.json(
            { error: String(error) },
            { status: 500, headers }
          );
        }
      }

      // ==========================================
      // INIT - Called when admin creates game
      // ==========================================
      case "init": {
        if (req.method !== "POST") {
          return Response.json(
            { error: "Method not allowed" },
            { status: 405, headers }
          );
        }

        const secret = this.room.env.PARTYKIT_SECRET as string;
        const authHeader = req.headers.get("Authorization");
        if (authHeader !== `Bearer ${secret}`) {
          log("WARN", this.room.id, "init_unauthorized", {
            message: "Unauthorized init attempt",
          });
          return Response.json(
            { error: "Unauthorized" },
            { status: 401, headers }
          );
        }

        try {
          const body = (await req.json()) as {
            gameId: string;
            startsAt: string;
            endsAt: string;
          };

          const startsAt = new Date(body.startsAt).getTime();
          const endsAt = new Date(body.endsAt).getTime();
          const notifyTime = startsAt - 60 * 1000; // 1 minute before
          const now = Date.now();

          log("INFO", this.room.id, "init_received", {
            gameId: body.gameId,
            now: new Date(now).toISOString(),
            startsAt: new Date(startsAt).toISOString(),
            endsAt: new Date(endsAt).toISOString(),
            notifyTime: new Date(notifyTime).toISOString(),
            timeUntilNotify: notifyTime - now,
            timeUntilStart: startsAt - now,
          });

          await this.room.storage.put("gameId", body.gameId);
          await this.room.storage.put("startsAt", startsAt);
          await this.room.storage.put("endsAt", endsAt);

          // Schedule first alarm (notify phase)
          if (notifyTime > now) {
            await this.room.storage.put("alarmPhase", "notify" as AlarmPhase);
            await this.room.storage.setAlarm(notifyTime);
            log("INFO", this.room.id, "init_alarm_scheduled", {
              gameId: body.gameId,
              phase: "notify",
              scheduledFor: new Date(notifyTime).toISOString(),
              inMs: notifyTime - now,
            });
          } else if (startsAt > now) {
            await this.room.storage.put("alarmPhase", "start" as AlarmPhase);
            await this.room.storage.setAlarm(startsAt);
            log("INFO", this.room.id, "init_alarm_scheduled", {
              gameId: body.gameId,
              phase: "start",
              scheduledFor: new Date(startsAt).toISOString(),
              inMs: startsAt - now,
              note: "Notify time already passed, skipping to start",
            });
          } else {
            log("INFO", this.room.id, "init_immediate_start", {
              gameId: body.gameId,
              note: "Start time already passed, triggering immediately",
            });
            await this.handleStartAlarm(this.room.id);
          }

          return Response.json(
            { success: true, gameId: body.gameId },
            { headers }
          );
        } catch (error) {
          log("ERROR", this.room.id, "init_error", {
            error: error instanceof Error ? error.message : String(error),
          });
          return Response.json(
            { error: "Failed to initialize room" },
            { status: 500, headers }
          );
        }
      }

      // ==========================================
      // STATS-UPDATE - Called when ticket purchased
      // ==========================================
      case "stats-update": {
        if (req.method !== "POST") {
          return Response.json(
            { error: "Method not allowed" },
            { status: 405, headers }
          );
        }

        const secret = this.room.env.PARTYKIT_SECRET as string;
        const authHeader = req.headers.get("Authorization");
        if (authHeader !== `Bearer ${secret}`) {
          return Response.json(
            { error: "Unauthorized" },
            { status: 401, headers }
          );
        }

        try {
          const body = (await req.json()) as {
            prizePool: number;
            playerCount: number;
          };

          this.broadcast({
            type: "stats",
            prizePool: body.prizePool,
            playerCount: body.playerCount,
          });

          log("INFO", this.room.id, "stats_update_broadcasted", {
            prizePool: body.prizePool,
            playerCount: body.playerCount,
            connectedClients: this.getOnlineCount(),
          });

          return Response.json({ success: true }, { headers });
        } catch (error) {
          log("ERROR", this.room.id, "stats_update_error", {
            error: error instanceof Error ? error.message : String(error),
          });
          return Response.json(
            { error: "Failed to broadcast stats" },
            { status: 500, headers }
          );
        }
      }

      // ==========================================
      // UPDATE-TIMING - Called when admin updates game
      // ==========================================
      case "update-timing": {
        if (req.method !== "POST") {
          return Response.json(
            { error: "Method not allowed" },
            { status: 405, headers }
          );
        }

        const secret = this.room.env.PARTYKIT_SECRET as string;
        const authHeader = req.headers.get("Authorization");
        if (authHeader !== `Bearer ${secret}`) {
          return Response.json(
            { error: "Unauthorized" },
            { status: 401, headers }
          );
        }

        try {
          const body = (await req.json()) as {
            startsAt: string;
            endsAt: string;
          };

          const startsAt = new Date(body.startsAt).getTime();
          const endsAt = new Date(body.endsAt).getTime();
          const notifyTime = startsAt - 60 * 1000;
          const now = Date.now();
          const gameId = await this.room.storage.get<string>("gameId");

          log("INFO", this.room.id, "update_timing_received", {
            gameId,
            startsAt: new Date(startsAt).toISOString(),
            endsAt: new Date(endsAt).toISOString(),
            notifyTime: new Date(notifyTime).toISOString(),
          });

          await this.room.storage.put("startsAt", startsAt);
          await this.room.storage.put("endsAt", endsAt);

          if (notifyTime > now) {
            await this.room.storage.put("alarmPhase", "notify" as AlarmPhase);
            await this.room.storage.setAlarm(notifyTime);
            log("INFO", this.room.id, "update_timing_alarm_rescheduled", {
              gameId,
              phase: "notify",
              scheduledFor: new Date(notifyTime).toISOString(),
            });
          } else if (startsAt > now) {
            await this.room.storage.put("alarmPhase", "start" as AlarmPhase);
            await this.room.storage.setAlarm(startsAt);
            log("INFO", this.room.id, "update_timing_alarm_rescheduled", {
              gameId,
              phase: "start",
              scheduledFor: new Date(startsAt).toISOString(),
              note: "Notify time already passed",
            });
          } else {
            log("WARN", this.room.id, "update_timing_no_alarm", {
              gameId,
              note: "Both notify and start times already passed",
            });
          }

          return Response.json({ success: true }, { headers });
        } catch (error) {
          log("ERROR", this.room.id, "update_timing_error", {
            error: error instanceof Error ? error.message : String(error),
          });
          return Response.json(
            { error: "Failed to update timing" },
            { status: 500, headers }
          );
        }
      }

      default:
        return Response.json({ error: "Not found" }, { status: 404, headers });
    }
  }

  // ==========================================
  // ALARM HANDLER
  // ==========================================

  async onAlarm() {
    // IMPORTANT: Cannot access this.room.id in onAlarm - known PartyKit limitation
    // Retrieve stored roomId from storage instead
    const roomId = (await this.room.storage.get<string>("roomId")) || "unknown";
    const phase = await this.room.storage.get<AlarmPhase>("alarmPhase");
    const gameId = await this.room.storage.get<string>("gameId");
    const now = Date.now();

    log("INFO", roomId, "alarm_triggered", {
      gameId,
      phase,
      triggeredAt: new Date(now).toISOString(),
      message: "Alarm callback invoked",
    });

    switch (phase) {
      case "notify":
        await this.handleNotifyAlarm(roomId);
        break;
      case "start":
        await this.handleStartAlarm(roomId);
        break;
      case "gameEnd":
        await this.handleGameEndAlarm(roomId);
        break;
      default:
        log("WARN", roomId, "alarm_unknown_phase", {
          gameId,
          phase,
          message: "Alarm triggered with unknown phase",
        });
    }
  }

  async handleNotifyAlarm(roomId: string) {
    const gameId = await this.room.storage.get<string>("gameId");
    const startsAt = await this.room.storage.get<number>("startsAt");

    log("INFO", roomId, "notify_phase_start", {
      gameId,
      startsAt: startsAt ? new Date(startsAt).toISOString() : null,
    });

    await this.sendNotifications("Game starting in 1 minute! 🎮", roomId);
    this.broadcast({ type: "game:starting", in: 60 });

    // Schedule next alarm for game start
    await this.room.storage.put("alarmPhase", "start" as AlarmPhase);
    await this.room.storage.setAlarm(startsAt!);

    log("INFO", roomId, "notify_phase_complete", {
      gameId,
      nextPhase: "start",
      nextAlarmAt: new Date(startsAt!).toISOString(),
    });
  }

  async handleStartAlarm(roomId: string) {
    const gameId = await this.room.storage.get<string>("gameId");
    const endsAt = await this.room.storage.get<number>("endsAt");

    log("INFO", roomId, "start_phase_begin", {
      gameId,
      endsAt: endsAt ? new Date(endsAt).toISOString() : null,
    });

    if (!endsAt) {
      log("ERROR", roomId, "start_phase_no_endsAt", {
        gameId,
        message: "No endsAt found in storage - cannot schedule gameEnd alarm",
      });
      return;
    }

    // Schedule game end alarm
    await this.room.storage.put("alarmPhase", "gameEnd" as AlarmPhase);
    await this.room.storage.setAlarm(endsAt);

    await this.sendNotifications("The game has started! 🚀", roomId);
    this.broadcast({ type: "game:live" });

    log("INFO", roomId, "start_phase_complete", {
      gameId,
      nextPhase: "gameEnd",
      nextAlarmAt: new Date(endsAt).toISOString(),
      connectedClients: this.getOnlineCount(),
    });
  }

  async handleGameEndAlarm(roomId: string) {
    const gameId = await this.room.storage.get<string>("gameId");
    const appUrl = this.room.env.NEXT_PUBLIC_URL as string;
    const secret = this.room.env.PARTYKIT_SECRET as string;

    log("INFO", roomId, "gameEnd_phase_begin", {
      gameId,
      hasAppUrl: !!appUrl,
      hasSecret: !!secret,
    });

    if (!gameId || !appUrl || !secret) {
      log("ERROR", roomId, "gameEnd_missing_config", {
        gameId,
        hasAppUrl: !!appUrl,
        hasSecret: !!secret,
        message: "Missing required env vars for roundup API call",
      });
      return;
    }

    const roundupUrl = `${appUrl}/api/v1/internal/games/${gameId}/roundup`;

    try {
      log("DEBUG", roomId, "gameEnd_calling_roundup", {
        gameId,
        url: roundupUrl,
      });

      // Call roundup API (handles ranking, on-chain, and notifications)
      const response = await fetch(roundupUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${secret}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        // Only broadcast if roundup succeeded
        this.broadcast({
          type: "game:end",
          gameId,
          prizePool: result.prizePool,
          winnersCount: result.winnersCount,
        });

        log("INFO", roomId, "gameEnd_roundup_success", {
          gameId,
          winnersCount: result.winnersCount,
          prizePool: result.prizePool,
        });
      } else {
        log("ERROR", roomId, "gameEnd_roundup_failed", {
          gameId,
          error: result.error,
          message: "Roundup API returned error - cron fallback will handle",
        });
      }
    } catch (error) {
      log("ERROR", roomId, "gameEnd_roundup_exception", {
        gameId,
        error: error instanceof Error ? error.message : String(error),
        message: "Roundup API threw exception - cron fallback will handle",
      });
    }
  }

  async sendNotifications(message: string, roomId?: string) {
    // Use provided roomId or fallback to this.room.id (safe in non-alarm contexts)
    const logRoomId = roomId || this.room.id;
    const gameId = await this.room.storage.get<string>("gameId");
    const appUrl = this.room.env.NEXT_PUBLIC_URL as string;
    const secret = this.room.env.PARTYKIT_SECRET as string;

    if (!appUrl || !secret || !gameId) {
      log("WARN", logRoomId, "notify_skipped_missing_config", {
        gameId,
        hasAppUrl: !!appUrl,
        hasSecret: !!secret,
        message,
      });
      return;
    }

    const notifyUrl = `${appUrl}/api/v1/internal/games/${gameId}/notify`;

    try {
      log("DEBUG", logRoomId, "notify_sending", {
        gameId,
        message,
        url: notifyUrl,
      });

      const response = await fetch(notifyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${secret}`,
        },
        body: JSON.stringify({ message }),
      });

      if (response.ok) {
        log("INFO", logRoomId, "notify_sent", {
          gameId,
          message,
          status: response.status,
        });
      } else {
        log("WARN", logRoomId, "notify_failed", {
          gameId,
          message,
          status: response.status,
          statusText: response.statusText,
        });
      }
    } catch (error) {
      log("ERROR", logRoomId, "notify_error", {
        gameId,
        message,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // ==========================================
  // LIFECYCLE
  // ==========================================

  async onStart() {
    // Store room.id for use in onAlarm (where this.room.id is not available)
    // This MUST happen first before any other operations
    await this.room.storage.put("roomId", this.room.id);

    log("INFO", this.room.id, "room_starting", {
      action: "onStart",
      message: "Room waking up from hibernation or initializing",
    });

    // Restore persisted state
    this.chatHistory =
      (await this.room.storage.get<StoredChatMessage[]>("chatHistory")) || [];
    const savedFids = await this.room.storage.get<number[]>("seenFids");
    this.seenFids = new Set(savedFids || []);

    // Log alarm state for debugging
    const alarmPhase = await this.room.storage.get<AlarmPhase>("alarmPhase");
    const currentAlarm = await this.room.storage.getAlarm();
    const gameId = await this.room.storage.get<string>("gameId");

    log("INFO", this.room.id, "room_state_restored", {
      gameId,
      alarmPhase,
      alarmScheduledAt: currentAlarm
        ? new Date(currentAlarm).toISOString()
        : null,
      chatHistoryCount: this.chatHistory.length,
      seenFidsCount: this.seenFids.size,
    });
  }

  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    const fid = Number(ctx.request.headers.get("X-User-Fid"));
    const username = ctx.request.headers.get("X-User-Username") || "Unknown";
    const pfp = ctx.request.headers.get("X-User-PfpUrl") || null;

    const player: Player = { fid, username, pfp };
    conn.setState(player);

    // Safe room ID access - may not be available during hibernation wake
    const roomId = this.safeRoomId();

    log("DEBUG", roomId, "client_connected", {
      connectionId: conn.id,
      fid,
      username,
      totalConnections: this.getOnlineCount(),
    });

    // Send sync to new client
    const chat: ChatItem[] = this.chatHistory.slice(-50).map((msg) => ({
      id: msg.id,
      username: msg.username,
      pfp: msg.pfp,
      text: msg.text,
      ts: msg.ts,
    }));

    conn.send(
      JSON.stringify({
        type: "sync",
        connected: this.getOnlineCount(),
        chat,
      } as Message)
    );

    // Broadcast join to others
    if (!this.seenFids.has(fid)) {
      this.seenFids.add(fid);
      await this.room.storage.put("seenFids", [...this.seenFids]);
      this.broadcast({ type: "joined", username, pfp }, [conn.id]);
    }

    // Update connected count for all
    this.broadcast({ type: "connected", count: this.getOnlineCount() });
  }

  async onMessage(message: string, sender: Party.Connection) {
    try {
      const msg = JSON.parse(message) as Message;
      const player = sender.state as Player;
      if (!player) return;

      switch (msg.type) {
        case "chat":
          await this.handleChat(player, msg.text);
          break;

        case "submit":
          this.broadcast(
            {
              type: "answered",
              questionIndex: msg.q,
              username: player.username,
              pfp: player.pfp,
            },
            [sender.id]
          );
          break;

        case "cheer":
          this.room.broadcast(JSON.stringify({ type: "cheer" } as Message), [
            sender.id,
          ]);
          break;
      }
    } catch {
      // Ignore parse errors
    }
  }

  async handleChat(player: Player, text: string) {
    const chatMsg: StoredChatMessage = {
      id: crypto.randomUUID(),
      text,
      username: player.username,
      pfp: player.pfp,
      ts: Date.now(),
    };

    this.chatHistory.push(chatMsg);
    if (this.chatHistory.length > 100) this.chatHistory.shift();
    await this.room.storage.put("chatHistory", this.chatHistory);

    this.broadcast({
      type: "chat:new",
      id: chatMsg.id,
      username: chatMsg.username,
      pfp: chatMsg.pfp,
      text: chatMsg.text,
      ts: chatMsg.ts,
    });
  }

  onClose(conn: Party.Connection) {
    const player = conn.state as Player;
    if (player) {
      const roomId = this.safeRoomId();
      log("DEBUG", roomId, "client_disconnected", {
        connectionId: conn.id,
        fid: player.fid,
        username: player.username,
        remainingConnections: this.getOnlineCount(),
      });
      this.broadcast({ type: "left", username: player.username });
      this.broadcast({ type: "connected", count: this.getOnlineCount() });
    }
  }

  onError(conn: Party.Connection, error: Error) {
    const player = conn.state as Player | undefined;
    const roomId = this.safeRoomId();
    log("ERROR", roomId, "connection_error", {
      connectionId: conn.id,
      fid: player?.fid,
      username: player?.username,
      error: error.message,
    });
  }

  // ==========================================
  // HELPERS
  // ==========================================

  /**
   * Safely access room.id - PartyKit may throw if accessed before initialization
   * (especially during hibernation wake-up). Falls back to "unknown".
   */
  safeRoomId(): string {
    try {
      return this.room.id;
    } catch {
      return "unknown";
    }
  }

  getOnlineCount(): number {
    return [...this.room.getConnections()].length;
  }

  broadcast(msg: Message, exclude: string[] = []) {
    this.room.broadcast(JSON.stringify(msg), exclude);
  }
}

GameServer satisfies Party.Worker;
