import type * as Party from "partykit/server";
import { jwtVerify } from "jose";

// ==========================================
// TYPES
// ==========================================

interface UserProfile {
  fid: number;
  username: string;
  pfpUrl: string | null;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: UserProfile;
  timestamp: number;
}

// Compact message protocol for minimal payload size
// t = type, d = data
// s = sync, p = presence, c = chat, e = event

// ==========================================
// GAME SERVER
// ==========================================

export default class GameServer implements Party.Server {
  // Enable hibernation for scale (up to 32K connections per room)
  readonly options: Party.ServerOptions = {
    hibernate: true,
  };

  chatHistory: ChatMessage[] = [];
  seenFids: Set<number> = new Set(); // Track first-time joins

  constructor(readonly room: Party.Room) {}

  // ==========================================
  // AUTHENTICATION (via onBeforeConnect)
  // ==========================================

  /**
   * Authenticate connections BEFORE they reach onConnect.
   * This follows PartyKit best practices from:
   * https://docs.partykit.io/guides/authentication/
   */
  static async onBeforeConnect(
    request: Party.Request,
    lobby: Party.Lobby
  ): Promise<Party.Request | Response> {
    try {
      // Get token from query string
      const url = new URL(request.url);
      const token = url.searchParams.get("token");

      if (!token) {
        console.error("[Auth] Missing token");
        return new Response("Unauthorized: No token", { status: 401 });
      }

      // Get secret from environment
      const secret = lobby.env.PARTYKIT_SECRET as string;
      if (!secret) {
        console.error("[Auth] PARTYKIT_SECRET not configured");
        return new Response("Server configuration error", { status: 500 });
      }

      // Verify JWT
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(secret),
        { algorithms: ["HS256"] }
      );

      if (!payload.fid || !payload.username) {
        console.error("[Auth] Invalid token payload");
        return new Response("Unauthorized: Invalid token", { status: 401 });
      }

      // Pass user info to onConnect via headers
      request.headers.set("X-User-Fid", String(payload.fid));
      request.headers.set("X-User-Username", String(payload.username));
      request.headers.set(
        "X-User-PfpUrl",
        payload.pfpUrl ? String(payload.pfpUrl) : ""
      );

      // Forward to onConnect
      return request;
    } catch (e) {
      console.error("[Auth] JWT verification failed:", e);
      return new Response("Unauthorized: Invalid token", { status: 401 });
    }
  }

  // ==========================================
  // LIFECYCLE HOOKS
  // ==========================================

  // Load state from storage on startup (or wake from hibernation)
  async onStart() {
    this.chatHistory =
      (await this.room.storage.get<ChatMessage[]>("chatHistory")) || [];
    // Load seenFids from storage for hibernation recovery
    const savedFids = await this.room.storage.get<number[]>("seenFids");
    this.seenFids = new Set(savedFids || []);

    // Schedule game start alarm if not already scheduled
    await this.scheduleGameStartAlarm();
  }

  // Schedule alarm for game start time
  async scheduleGameStartAlarm() {
    const gameId = parseInt(this.room.id);
    if (isNaN(gameId)) return;

    // Check if alarm already scheduled
    const existingAlarm = await this.room.storage.getAlarm();
    if (existingAlarm) return;

    // Fetch game start time from API
    try {
      const appUrl = this.room.env.NEXT_PUBLIC_URL as string;
      if (!appUrl) return;

      const res = await fetch(`${appUrl}/api/v1/games/${gameId}`);
      if (!res.ok) return;

      const game = await res.json();
      const startsAt = new Date(game.startsAt).getTime();
      const now = Date.now();

      // Only schedule if game starts in the future
      if (startsAt > now) {
        await this.room.storage.setAlarm(startsAt);
        console.log(
          `[Alarm] Scheduled game ${gameId} start notification for ${new Date(
            startsAt
          ).toISOString()}`
        );
      }
    } catch (e) {
      console.error("[Alarm] Failed to schedule:", e);
    }
  }

  // Called when alarm fires (game start time)
  async onAlarm() {
    const gameId = parseInt(this.room.id);
    console.log(`[Alarm] Game ${gameId} starting - triggering notifications`);

    // Call API to send notifications to all ticket holders
    try {
      const appUrl = this.room.env.NEXT_PUBLIC_URL as string;
      const secret = this.room.env.PARTYKIT_SECRET as string;

      if (!appUrl || !secret) {
        console.error("[Alarm] Missing env vars");
        return;
      }

      const res = await fetch(`${appUrl}/api/v1/games/${gameId}/notify-start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-PartyKit-Secret": secret,
        },
      });

      const result = await res.json();
      console.log(`[Alarm] Game ${gameId} notifications sent:`, result);
    } catch (e) {
      console.error("[Alarm] Failed to send notifications:", e);
    }
  }

  // Tag connections for targeted messaging (e.g., by fid)
  getConnectionTags(
    conn: Party.Connection,
    ctx: Party.ConnectionContext
  ): string[] {
    const user = conn.state as UserProfile | undefined;
    return user ? [`fid:${user.fid}`] : [];
  }

  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    // User is already authenticated via onBeforeConnect
    // Extract user info from headers set in onBeforeConnect
    const fid = Number(ctx.request.headers.get("X-User-Fid"));
    const username = ctx.request.headers.get("X-User-Username") || "Unknown";
    const pfpUrl = ctx.request.headers.get("X-User-PfpUrl") || null;

    const user: UserProfile = {
      fid,
      username,
      pfpUrl: pfpUrl || null,
    };

    // Attach user to connection state
    conn.setState(user);

    console.log(
      `[Join] ${user.username} (fid:${user.fid}) joined room ${this.room.id}`
    );

    // Only broadcast join for first-time connections this session
    if (!this.seenFids.has(user.fid)) {
      this.seenFids.add(user.fid);
      await this.room.storage.put("seenFids", [...this.seenFids]);
      this.broadcastPresence(user, "join");
    } else {
      // Reconnection - still broadcast updated count
      this.broadcastPresence(user, "count");
    }

    // Send initial sync data to this connection (compact format)
    // s = sync, n = online count, h = history
    conn.send(
      JSON.stringify({
        t: "s",
        d: {
          n: this.getOnlineCount(),
          h: this.chatHistory.map((m) => ({
            i: m.id,
            u: m.sender.username,
            p: m.sender.pfpUrl,
            m: m.text,
            ts: m.timestamp,
          })),
        },
      })
    );
  }

  async onMessage(message: string, sender: Party.Connection) {
    try {
      const data = JSON.parse(message);
      const user = sender.state as UserProfile;

      if (!user) return;

      // Handle compact format: t = type, m = message text
      switch (data.t) {
        case "c": {
          // c = chat message
          const chatMsg: ChatMessage = {
            id: crypto.randomUUID(),
            text: data.m,
            sender: user,
            timestamp: Date.now(),
          };

          this.chatHistory.push(chatMsg);
          if (this.chatHistory.length > 100) this.chatHistory.shift();

          await this.room.storage.put("chatHistory", this.chatHistory);

          // Broadcast chat in compact format
          this.broadcast({
            t: "c",
            d: {
              i: chatMsg.id,
              u: chatMsg.sender.username,
              p: chatMsg.sender.pfpUrl,
              m: chatMsg.text,
              ts: chatMsg.timestamp,
            },
          });
          break;
        }
        case "e": {
          // e = event (answer, achievement, etc.)
          this.broadcast({
            t: "e",
            d: {
              i: crypto.randomUUID(),
              t: data.d?.t || "event",
              u: user.username,
              p: user.pfpUrl,
              c: data.d?.c || "",
              ts: Date.now(),
            },
          });
          break;
        }
        case "r": {
          // r = reaction (cheers, etc.) - broadcast directly without storing
          // This goes to all clients but doesn't pollute the event feed
          this.broadcast({
            t: "r",
            d: {
              u: user.username,
              p: user.pfpUrl,
              r: data.r || "cheer", // reaction type
            },
          });
          break;
        }
      }
    } catch (e) {
      console.error("Failed to parse message", e);
    }
  }

  onClose(conn: Party.Connection) {
    const user = conn.state as UserProfile;
    if (user) {
      console.log(`[Leave] ${user.username} left room ${this.room.id}`);
      this.broadcastPresence(user, "leave");
    }
  }

  onError(conn: Party.Connection, error: Error) {
    console.error(`[Error] Connection ${conn.id} error:`, error.message);
  }

  // ==========================================
  // HELPERS
  // ==========================================

  /** Get current online count from active connections (hibernation-safe) */
  getOnlineCount(): number {
    return [...this.room.getConnections()].length;
  }

  broadcast(msg: Record<string, unknown>, exclude: string[] = []) {
    this.room.broadcast(JSON.stringify(msg), exclude);
  }

  broadcastPresence(user: UserProfile, type: "join" | "leave" | "count") {
    // p = presence, n = online count, j = joined, l = left, p = pfpUrl
    this.broadcast({
      t: "p",
      d: {
        n: this.getOnlineCount(),
        j: type === "join" ? user.username : undefined,
        p: type === "join" ? user.pfpUrl : undefined,
        l: type === "leave" ? user.username : undefined,
      },
    });
  }
}

GameServer satisfies Party.Worker;
