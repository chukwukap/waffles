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

// ==========================================
// GAME SERVER
// ==========================================

export default class GameServer implements Party.Server {
  readonly options: Party.ServerOptions = { hibernate: true };

  chatHistory: StoredChatMessage[] = [];
  seenFids: Set<number> = new Set();

  constructor(readonly room: Party.Room) {}

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

          await this.room.storage.put("gameId", body.gameId);
          await this.room.storage.put("startsAt", startsAt);
          await this.room.storage.put("endsAt", endsAt);

          // Schedule first alarm (notify phase)
          const now = Date.now();
          if (notifyTime > now) {
            await this.room.storage.put("alarmPhase", "notify" as AlarmPhase);
            await this.room.storage.setAlarm(notifyTime);
            console.log(
              `[Init] Game ${
                body.gameId
              } - notify alarm scheduled for ${new Date(
                notifyTime
              ).toISOString()}`
            );
          } else if (startsAt > now) {
            await this.room.storage.put("alarmPhase", "start" as AlarmPhase);
            await this.room.storage.setAlarm(startsAt);
            console.log(
              `[Init] Game ${
                body.gameId
              } - start alarm scheduled for ${new Date(startsAt).toISOString()}`
            );
          } else {
            await this.handleStartAlarm();
          }

          return Response.json(
            { success: true, gameId: body.gameId },
            { headers }
          );
        } catch (error) {
          console.error("[Init] Error:", error);
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

          console.log(
            `[stats-update] Broadcasted: prizePool=${body.prizePool}, playerCount=${body.playerCount}`
          );

          return Response.json({ success: true }, { headers });
        } catch (error) {
          console.error("[stats-update] Error:", error);
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

          await this.room.storage.put("startsAt", startsAt);
          await this.room.storage.put("endsAt", endsAt);

          if (notifyTime > now) {
            await this.room.storage.put("alarmPhase", "notify" as AlarmPhase);
            await this.room.storage.setAlarm(notifyTime);
            console.log(
              `[update-timing] Rescheduled notify alarm for ${new Date(
                notifyTime
              ).toISOString()}`
            );
          } else if (startsAt > now) {
            await this.room.storage.put("alarmPhase", "start" as AlarmPhase);
            await this.room.storage.setAlarm(startsAt);
            console.log(
              `[update-timing] Rescheduled start alarm for ${new Date(
                startsAt
              ).toISOString()}`
            );
          }

          return Response.json({ success: true }, { headers });
        } catch (error) {
          console.error("[update-timing] Error:", error);
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
    const phase = await this.room.storage.get<AlarmPhase>("alarmPhase");
    const gameId = await this.room.storage.get<string>("gameId");
    console.log(`[Alarm] Game ${gameId} - phase: ${phase}`);

    switch (phase) {
      case "notify":
        await this.handleNotifyAlarm();
        break;
      case "start":
        await this.handleStartAlarm();
        break;
      case "gameEnd":
        await this.handleGameEndAlarm();
        break;
      default:
        console.warn(`[Alarm] Unknown phase: ${phase}`);
    }
  }

  async handleNotifyAlarm() {
    const gameId = await this.room.storage.get<string>("gameId");
    const startsAt = await this.room.storage.get<number>("startsAt");

    await this.sendNotifications("Game starting in 1 minute! 🎮");

    this.broadcast({ type: "game:starting", in: 60 });

    await this.room.storage.put("alarmPhase", "start" as AlarmPhase);
    await this.room.storage.setAlarm(startsAt!);
    console.log(`[Notify] Game ${gameId} - start alarm scheduled`);
  }

  async handleStartAlarm() {
    const gameId = await this.room.storage.get<string>("gameId");
    const endsAt = await this.room.storage.get<number>("endsAt");

    if (!endsAt) {
      console.error(`[Start] Game ${gameId} - no endsAt found`);
      return;
    }

    await this.room.storage.put("alarmPhase", "gameEnd" as AlarmPhase);
    await this.room.storage.setAlarm(endsAt);

    await this.sendNotifications("The game has started! 🚀");

    this.broadcast({ type: "game:live" });

    console.log(
      `[Start] Game ${gameId} - started, ends at ${new Date(
        endsAt
      ).toISOString()}`
    );
  }

  async handleGameEndAlarm() {
    const gameId = await this.room.storage.get<string>("gameId");

    await this.sendNotifications("Game has ended! Check your results 🏆");

    this.broadcast({ type: "game:end", gameId: gameId || "" });

    console.log(
      `[GameEnd] Game ${gameId} - complete (ranking handled by cron)`
    );
  }

  async sendNotifications(message: string) {
    try {
      const appUrl = this.room.env.NEXT_PUBLIC_URL as string;
      const secret = this.room.env.PARTYKIT_SECRET as string;
      const gameId = await this.room.storage.get<string>("gameId");

      if (!appUrl || !secret || !gameId) return;

      await fetch(`${appUrl}/api/v1/internal/games/${gameId}/notify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${secret}`,
        },
        body: JSON.stringify({ message }),
      });
    } catch (error) {
      console.error("[Notify] Error:", error);
    }
  }

  // ==========================================
  // LIFECYCLE
  // ==========================================

  async onStart() {
    this.chatHistory =
      (await this.room.storage.get<StoredChatMessage[]>("chatHistory")) || [];
    const savedFids = await this.room.storage.get<number[]>("seenFids");
    this.seenFids = new Set(savedFids || []);
  }

  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    const fid = Number(ctx.request.headers.get("X-User-Fid"));
    const username = ctx.request.headers.get("X-User-Username") || "Unknown";
    const pfp = ctx.request.headers.get("X-User-PfpUrl") || null;

    const player: Player = { fid, username, pfp };
    conn.setState(player);

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
      this.broadcast({ type: "left", username: player.username });
      this.broadcast({ type: "connected", count: this.getOnlineCount() });
    }
  }

  onError(conn: Party.Connection, error: Error) {
    console.error(`[Error] Connection ${conn.id} error:`, error.message);
  }

  // ==========================================
  // HELPERS
  // ==========================================

  getOnlineCount(): number {
    return [...this.room.getConnections()].length;
  }

  broadcast(msg: Message, exclude: string[] = []) {
    this.room.broadcast(JSON.stringify(msg), exclude);
  }
}

GameServer satisfies Party.Worker;
