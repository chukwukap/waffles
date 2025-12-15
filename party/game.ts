import type * as Party from "partykit/server";
import { jwtVerify } from "jose";

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

interface ServerMessage {
  type: "chat" | "presence" | "event" | "sync";
  payload: unknown;
}

export default class GameServer implements Party.Server {
  // Enable hibernation for scale (up to 32K connections per room)
  readonly options: Party.ServerOptions = {
    hibernate: true,
  };

  chatHistory: ChatMessage[] = [];

  constructor(readonly room: Party.Room) {}

  // Load state from storage on startup (or wake from hibernation)
  async onStart() {
    this.chatHistory =
      (await this.room.storage.get<ChatMessage[]>("chatHistory")) || [];
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
    // 1. JWT Authentication
    const url = new URL(ctx.request.url);
    const token = url.searchParams.get("token");

    if (!token) {
      console.error("Missing token");
      conn.close(1008, "Unauthorized: No token");
      return;
    }

    let user: UserProfile;
    try {
      const secret = this.room.env.PARTYKIT_SECRET as string;
      if (!secret) {
        throw new Error("PARTYKIT_SECRET not configured on server");
      }

      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(secret),
        { algorithms: ["HS256"] }
      );

      if (!payload.fid || !payload.username) {
        throw new Error("Invalid token payload");
      }

      user = {
        fid: Number(payload.fid),
        username: String(payload.username),
        pfpUrl: payload.pfpUrl ? String(payload.pfpUrl) : null,
      };
    } catch (e) {
      console.error("Auth failed:", e);
      conn.close(1008, "Unauthorized: Invalid token");
      return;
    }

    // 2. Attach user to connection state
    conn.setState(user);

    console.log(
      `[Join] ${user.username} (fid:${user.fid}) joined room ${this.room.id}`
    );

    // 3. Broadcast presence update to others
    this.broadcastPresence(user, "join");

    // 4. Send initial sync data to this connection
    conn.send(
      JSON.stringify({
        type: "sync",
        payload: {
          onlineCount: this.getOnlineCount(),
          history: this.chatHistory,
        },
      })
    );
  }

  async onMessage(message: string, sender: Party.Connection) {
    try {
      const data = JSON.parse(message);
      const user = sender.state as UserProfile;

      if (!user) return;

      switch (data.type) {
        case "chat": {
          const chatMsg: ChatMessage = {
            id: crypto.randomUUID(),
            text: data.text,
            sender: user,
            timestamp: Date.now(),
          };

          this.chatHistory.push(chatMsg);
          if (this.chatHistory.length > 100) this.chatHistory.shift();

          await this.room.storage.put("chatHistory", this.chatHistory);

          this.broadcast({ type: "chat", payload: chatMsg });
          break;
        }
        case "event": {
          this.broadcast({
            type: "event",
            payload: { ...data.payload, user },
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

  // --- Helpers ---

  /** Get current online count from active connections (hibernation-safe) */
  getOnlineCount(): number {
    return [...this.room.getConnections()].length;
  }

  broadcast(msg: ServerMessage, exclude: string[] = []) {
    this.room.broadcast(JSON.stringify(msg), exclude);
  }

  broadcastPresence(user: UserProfile, type: "join" | "leave") {
    this.broadcast({
      type: "presence",
      payload: {
        onlineCount: this.getOnlineCount(),
        joined: type === "join" ? user : undefined,
        left: type === "leave" ? user : undefined,
      },
    });
  }
}

GameServer satisfies Party.Worker;
