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

// PlayerState is now just UserProfile (no score tracking - DB is source of truth)
type PlayerState = UserProfile;

interface ChatMessage {
  id: string;
  text: string;
  sender: UserProfile;
  timestamp: number;
}

interface Question {
  id: string;
  text: string;
  options: string[];
  correct: number;
  timeLimit: number;
}

interface GameState {
  isLive: boolean;
  questions: Question[];
  currentQuestionIndex: number;
  questionStartTime: number;
  questionEndTime: number;
  isBreak: boolean;
  breakEndTime: number;
}

// Alarm phases for chained scheduling
type AlarmPhase = "notify" | "start" | "questionEnd" | "gameEnd";

// Client → Server messages
type ClientMessage =
  | { type: "chat"; text: string }
  | {
      type: "answer";
      data: { questionId: number; selected: number; timeMs: number };
    }
  | { type: "event"; data: { eventType: string; content: string } }
  | { type: "cheer" };

// ==========================================
// GAME SERVER
// ==========================================

export default class GameServer implements Party.Server {
  readonly options: Party.ServerOptions = { hibernate: true };

  chatHistory: ChatMessage[] = [];
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
            questions: Question[];
          };

          const startsAt = new Date(body.startsAt).getTime();
          const endsAt = new Date(body.endsAt).getTime();
          const notifyTime = startsAt - 60 * 1000; // 1 minute before

          // Store game metadata and questions
          await this.room.storage.put("gameId", body.gameId);
          await this.room.storage.put("startsAt", startsAt);
          await this.room.storage.put("endsAt", endsAt);
          await this.room.storage.put("questions", body.questions);

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
            // Skip notify, go straight to start
            await this.room.storage.put("alarmPhase", "start" as AlarmPhase);
            await this.room.storage.setAlarm(startsAt);
            console.log(
              `[Init] Game ${
                body.gameId
              } - start alarm scheduled for ${new Date(startsAt).toISOString()}`
            );
          } else {
            // Game starts immediately
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

      case "state": {
        const gameState = await this.room.storage.get<GameState>("gameState");
        const alarmPhase = await this.room.storage.get<AlarmPhase>(
          "alarmPhase"
        );
        return Response.json(
          {
            gameState,
            alarmPhase,
            onlineCount: this.getOnlineCount(),
          },
          { headers }
        );
      }

      case "sync-questions": {
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
          const body = (await req.json()) as { questions: Question[] };
          await this.room.storage.put("questions", body.questions);
          console.log(
            `[sync-questions] Stored ${body.questions.length} questions`
          );
          return Response.json(
            { success: true, count: body.questions.length },
            { headers }
          );
        } catch (error) {
          console.error("[sync-questions] Error:", error);
          return Response.json(
            { error: "Failed to sync questions" },
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

          // Broadcast to all connected clients
          this.broadcast({
            type: "gameStats",
            data: {
              prizePool: body.prizePool,
              playerCount: body.playerCount,
            },
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

          // Check if game is already live
          const gameState = await this.room.storage.get<GameState>("gameState");
          if (gameState?.isLive) {
            // Can't change timing while game is live
            return Response.json(
              { error: "Cannot update timing for live game" },
              { status: 400, headers }
            );
          }

          // Update stored timing
          await this.room.storage.put("startsAt", startsAt);
          await this.room.storage.put("endsAt", endsAt);

          // Reschedule alarms
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
  // ALARM HANDLER (Chained)
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
      case "questionEnd":
        await this.handleQuestionEndAlarm();
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

    // Send "starting soon" notifications
    await this.sendNotifications("Game starting in 1 minute! 🎮");

    // Broadcast to connected clients
    this.broadcast({
      type: "notification",
      data: { message: "Game starting in 1 minute!", timestamp: Date.now() },
    });

    // Schedule start alarm
    await this.room.storage.put("alarmPhase", "start" as AlarmPhase);
    await this.room.storage.setAlarm(startsAt!);
    console.log(`[Notify] Game ${gameId} - start alarm scheduled`);
  }

  async handleStartAlarm() {
    const gameId = await this.room.storage.get<string>("gameId");
    const endsAt = await this.room.storage.get<number>("endsAt");

    // Get questions from storage (sent during init)
    const questions = await this.room.storage.get<Question[]>("questions");
    if (!questions || questions.length === 0) {
      console.error(`[Start] Game ${gameId} - no questions found in storage`);
      return;
    }

    // Initialize game state
    const firstQuestion = questions[0];
    const questionDuration = (firstQuestion.timeLimit || 15) * 1000;

    const gameState: GameState = {
      isLive: true,
      questions,
      currentQuestionIndex: 0,
      questionStartTime: Date.now(),
      questionEndTime: Date.now() + questionDuration,
      isBreak: false,
      breakEndTime: 0,
    };

    await this.room.storage.put("gameState", gameState);

    // Schedule question end alarm
    await this.room.storage.put("alarmPhase", "questionEnd" as AlarmPhase);
    await this.room.storage.setAlarm(gameState.questionEndTime);

    // Also store game end time for fallback
    await this.room.storage.put("endsAt", endsAt);

    // Send "game started" notification
    await this.sendNotifications("The game has started! 🚀");

    // Broadcast first question
    this.broadcast({
      type: "gameStart",
      data: { message: "Game has started!", timestamp: Date.now() },
    });

    this.broadcast({
      type: "question",
      data: {
        index: 0,
        question: {
          id: firstQuestion.id,
          text: firstQuestion.text,
          options: firstQuestion.options,
          timeLimit: firstQuestion.timeLimit,
        },
        startTime: gameState.questionStartTime,
        endTime: gameState.questionEndTime,
      },
    });

    console.log(
      `[Start] Game ${gameId} - started with ${questions.length} questions`
    );
  }

  async handleQuestionEndAlarm() {
    const gameState = await this.room.storage.get<GameState>("gameState");
    const endsAt = await this.room.storage.get<number>("endsAt");

    if (!gameState) return;

    const nextIdx = gameState.currentQuestionIndex + 1;

    // Check if game should end (time-based or all questions done)
    if (nextIdx >= gameState.questions.length || Date.now() >= endsAt!) {
      await this.handleGameEndAlarm();
      return;
    }

    // If currently in break, start next question
    if (gameState.isBreak) {
      const question = gameState.questions[nextIdx];
      const questionDuration = (question.timeLimit || 15) * 1000;

      gameState.currentQuestionIndex = nextIdx;
      gameState.questionStartTime = Date.now();
      gameState.questionEndTime = Date.now() + questionDuration;
      gameState.isBreak = false;

      await this.room.storage.put("gameState", gameState);
      await this.room.storage.setAlarm(gameState.questionEndTime);

      this.broadcast({
        type: "question",
        data: {
          index: nextIdx,
          question: {
            id: question.id,
            text: question.text,
            options: question.options,
            timeLimit: question.timeLimit,
          },
          startTime: gameState.questionStartTime,
          endTime: gameState.questionEndTime,
        },
      });
    } else {
      // Start break
      const breakDuration = 5000; // 5 seconds
      gameState.isBreak = true;
      gameState.breakEndTime = Date.now() + breakDuration;

      await this.room.storage.put("gameState", gameState);
      await this.room.storage.setAlarm(gameState.breakEndTime);

      this.broadcast({
        type: "break",
        data: { endTime: gameState.breakEndTime, nextIndex: nextIdx },
      });
    }
  }

  async handleGameEndAlarm() {
    const gameId = await this.room.storage.get<string>("gameId");
    const gameState = await this.room.storage.get<GameState>("gameState");

    if (gameState) {
      gameState.isLive = false;
      await this.room.storage.put("gameState", gameState);
    }

    // Trigger rank calculation via API (DB is source of truth for scores)
    try {
      const appUrl = this.room.env.NEXT_PUBLIC_URL as string;
      const secret = this.room.env.PARTYKIT_SECRET as string;

      if (appUrl && secret) {
        const res = await fetch(
          `${appUrl}/api/v1/internal/games/${gameId}/finalize`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${secret}`,
            },
          }
        );

        if (!res.ok) {
          console.error(`[GameEnd] Finalize API failed: ${res.status}`);
        }
      }
    } catch (error) {
      console.error("[GameEnd] Failed to finalize game:", error);
    }

    // Send notifications
    await this.sendNotifications("Game has ended! Check your results 🏆");

    // Broadcast game end
    this.broadcast({
      type: "gameEnd",
      data: { gameId },
    });

    console.log(`[GameEnd] Game ${gameId} - finalized`);
  }

  // ==========================================
  // HELPERS
  // ==========================================

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
    // Load game state from storage
    this.chatHistory =
      (await this.room.storage.get<ChatMessage[]>("chatHistory")) || [];
    const savedFids = await this.room.storage.get<number[]>("seenFids");
    this.seenFids = new Set(savedFids || []);

    // Store room ID for onAlarm access
    if (this.room.id) {
      await this.room.storage.put("roomId", this.room.id);
    }
  }

  getConnectionTags(conn: Party.Connection): string[] {
    const state = conn.state as PlayerState | undefined;
    return state ? [`fid:${state.fid}`] : [];
  }

  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    const fid = Number(ctx.request.headers.get("X-User-Fid"));
    const username = ctx.request.headers.get("X-User-Username") || "Unknown";
    const pfpUrl = ctx.request.headers.get("X-User-PfpUrl") || null;

    const player: PlayerState = { fid, username, pfpUrl };
    conn.setState(player);

    if (!this.seenFids.has(fid)) {
      this.seenFids.add(fid);
      await this.room.storage.put("seenFids", [...this.seenFids]);
      this.broadcastPresence(player, "join");
    } else {
      this.broadcastPresence(player, "count");
    }

    // Send sync data (no scores - DB is source of truth)
    conn.send(
      JSON.stringify({
        type: "sync",
        data: {
          onlineCount: this.getOnlineCount(),
          chatHistory: this.chatHistory.slice(-50).map((msg) => ({
            id: msg.id,
            username: msg.sender.username,
            pfpUrl: msg.sender.pfpUrl,
            text: msg.text,
            timestamp: msg.timestamp,
          })),
        },
      })
    );
  }

  async onMessage(message: string, sender: Party.Connection) {
    try {
      const data = JSON.parse(message) as ClientMessage;
      const player = sender.state as PlayerState;
      if (!player) return;

      switch (data.type) {
        case "chat":
          await this.handleChat(player, data.text);
          break;
        case "answer":
          await this.handleAnswer(sender, player, data.data);
          break;
        case "event":
          this.broadcast({
            type: "event",
            data: {
              id: crypto.randomUUID(),
              eventType: data.data?.eventType || "event",
              username: player.username,
              pfpUrl: player.pfpUrl,
              content: data.data?.content || "",
              timestamp: Date.now(),
            },
          });
          break;
        case "cheer":
          // Broadcast to all EXCEPT sender (sender already shows local cheer)
          this.room.broadcast(JSON.stringify({ type: "cheer" }), [sender.id]);
          break;
      }
    } catch {
      // Ignore parse errors
    }
  }

  async handleAnswer(
    conn: Party.Connection,
    player: PlayerState,
    data: { questionId: number; selected: number; timeMs: number }
  ) {
    // PartyKit just broadcasts the answer event
    // Validation and scoring handled by client + /answers API → DB

    this.broadcast({
      type: "event",
      data: {
        id: crypto.randomUUID(),
        eventType: "answer",
        username: player.username,
        pfpUrl: player.pfpUrl,
        content: "answered",
        timestamp: Date.now(),
      },
    });
  }

  async handleChat(player: PlayerState, text: string) {
    const chatMsg: ChatMessage = {
      id: crypto.randomUUID(),
      text,
      sender: {
        fid: player.fid,
        username: player.username,
        pfpUrl: player.pfpUrl,
      },
      timestamp: Date.now(),
    };

    this.chatHistory.push(chatMsg);
    if (this.chatHistory.length > 100) this.chatHistory.shift();
    await this.room.storage.put("chatHistory", this.chatHistory);

    this.broadcast({
      type: "chat",
      data: {
        id: chatMsg.id,
        username: chatMsg.sender.username,
        pfpUrl: chatMsg.sender.pfpUrl,
        text: chatMsg.text,
        timestamp: chatMsg.timestamp,
      },
    });
  }

  onClose(conn: Party.Connection) {
    const player = conn.state as PlayerState;
    if (player) {
      this.broadcastPresence(player, "leave");
    }
  }

  onError(conn: Party.Connection, error: Error) {
    console.error(`[Error] Connection ${conn.id} error:`, error.message);
  }

  getOnlineCount(): number {
    return [...this.room.getConnections()].length;
  }

  broadcast(msg: Record<string, unknown>, exclude: string[] = []) {
    this.room.broadcast(JSON.stringify(msg), exclude);
  }

  broadcastPresence(user: UserProfile, action: "join" | "leave" | "count") {
    this.broadcast({
      type: "presence",
      data: {
        onlineCount: this.getOnlineCount(),
        joined: action === "join" ? user.username : undefined,
        pfpUrl: action === "join" ? user.pfpUrl : undefined,
        left: action === "leave" ? user.username : undefined,
      },
    });
  }
}

GameServer satisfies Party.Worker;
