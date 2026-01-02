/**
 * useGameSocket - Singleton WebSocket Hook
 *
 * URL-driven singleton pattern for PartyKit WebSocket connection.
 * Works anywhere in the app without prop drilling.
 *
 * Features:
 * - Gets gameId from URL params OR store
 * - Singleton connection (same gameId = same socket)
 * - Auto-reconnect on gameId change
 * - Updates Zustand store with incoming messages
 */

"use client";

import { useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import PartySocket from "partysocket";
import sdk from "@farcaster/miniapp-sdk";
import { env } from "@/lib/env";
import { useGameStoreApi } from "@/components/providers/GameStoreProvider";

// ==========================================
// SINGLETON CONNECTION MANAGER
// ==========================================

interface SocketInstance {
  socket: PartySocket | null;
  gameId: number | null;
  refCount: number;
  token: string | null;
}

// Global singleton - lives outside React
const instance: SocketInstance = {
  socket: null,
  gameId: null,
  refCount: 0,
  token: null,
};

// ==========================================
// MESSAGE TYPES
// ==========================================

interface SyncData {
  onlineCount: number;
  chatHistory: Array<{
    id: string;
    username: string;
    pfpUrl: string | null;
    text: string;
    timestamp: number;
  }>;
}

interface PresenceData {
  onlineCount: number;
  joined?: string;
  pfpUrl?: string | null;
}

interface ChatData {
  id: string;
  username: string;
  pfpUrl: string | null;
  text: string;
  timestamp: number;
}

interface EventData {
  id: string;
  eventType: "join" | "answer" | "achievement" | "event";
  username: string;
  pfpUrl?: string | null;
  content: string;
  timestamp: number;
}

interface GameStatsData {
  prizePool: number;
  playerCount: number;
}

interface GameEndData {
  gameId: number;
}

type IncomingMessage =
  | { type: "sync"; data: SyncData }
  | { type: "presence"; data: PresenceData }
  | { type: "chat"; data: ChatData }
  | { type: "event"; data: EventData }
  | { type: "cheer" } // Simple - no data needed
  | { type: "gameStats"; data: GameStatsData }
  | {
      type: "answerResult";
      data: { totalScore?: number; answeredCount?: number };
    }
  | { type: "gameEnd"; data: GameEndData };

// ==========================================
// HOOK
// ==========================================

interface UseGameSocketOptions {
  enabled?: boolean;
  gameId?: number | null;
}

interface UseGameSocketReturn {
  isConnected: boolean;
  sendChat: (text: string) => boolean;
  sendCheer: () => void;
  sendAnswer: (questionId: number, selected: number, timeMs: number) => void;
}

export function useGameSocket(
  options: UseGameSocketOptions = {}
): UseGameSocketReturn {
  const { enabled = true, gameId: explicitGameId } = options;
  const params = useParams();
  const router = useRouter();
  const store = useGameStoreApi();

  // Get gameId from URL params or explicit option
  const gameIdParam = params?.gameId;
  const gameId = gameIdParam ? Number(gameIdParam) : explicitGameId ?? null;

  const isConnectedRef = useRef(false);

  // Message handler
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data) as IncomingMessage;
        const state = store.getState();

        switch (msg.type) {
          case "sync":
            state.setOnlineCount(msg.data.onlineCount);
            state.setMessages(
              msg.data.chatHistory.map((m) => ({
                id: m.id,
                username: m.username,
                pfpUrl: m.pfpUrl,
                text: m.text,
                timestamp: m.timestamp,
              }))
            );
            break;

          case "presence":
            state.setOnlineCount(msg.data.onlineCount);
            if (msg.data.joined) {
              state.addPlayer({
                username: msg.data.joined,
                pfpUrl: msg.data.pfpUrl || null,
                timestamp: Date.now(),
              });
              state.addEvent({
                id: `join-${Date.now()}`,
                type: "join",
                username: msg.data.joined,
                pfpUrl: msg.data.pfpUrl || null,
                content: "joined the game",
                timestamp: Date.now(),
              });
            }
            break;

          case "chat":
            state.addMessage({
              id: msg.data.id,
              username: msg.data.username,
              pfpUrl: msg.data.pfpUrl,
              text: msg.data.text,
              timestamp: msg.data.timestamp,
            });
            break;

          case "event":
            state.addEvent({
              id: msg.data.id,
              type:
                msg.data.eventType === "answer"
                  ? "answer"
                  : msg.data.eventType === "join"
                  ? "join"
                  : "achievement",
              username: msg.data.username,
              pfpUrl: msg.data.pfpUrl || null,
              content: msg.data.content,
              timestamp: msg.data.timestamp,
            });
            // Track answerers for current question
            if (msg.data.eventType === "answer") {
              state.addAnswerer({
                username: msg.data.username,
                pfpUrl: msg.data.pfpUrl || null,
                timestamp: msg.data.timestamp,
              });
            }
            break;

          case "cheer":
            // Fire cheer for other players (ephemeral, no store)
            import("@/app/(app)/(game)/game/_components/CheerOverlay").then(
              ({ fireCheer }) => fireCheer(false)
            );
            break;

          case "gameStats":
            state.updateGameStats({
              prizePool: msg.data.prizePool,
              playerCount: msg.data.playerCount,
            });
            break;

          case "answerResult":
            // Score is tracked locally in LiveGameScreen
            if (msg.data.answeredCount !== undefined) {
              state.incrementAnswered();
            }
            break;

          case "gameEnd":
            // Redirect to result page
            router.push(`/game/${msg.data.gameId}/result`);
            break;
        }
      } catch {
        // Ignore parse errors
      }
    },
    [store, router]
  );

  // Connect/disconnect effect
  useEffect(() => {
    if (!gameId || !enabled) {
      return;
    }

    // Same game already connected? Just increment ref count
    if (instance.socket && instance.gameId === gameId) {
      instance.refCount++;
      isConnectedRef.current = instance.socket.readyState === WebSocket.OPEN;
      return () => {
        instance.refCount--;
        if (instance.refCount <= 0) {
          instance.socket?.close();
          instance.socket = null;
          instance.gameId = null;
          instance.refCount = 0;
          store.getState().setConnected(false);
        }
      };
    }

    // Different game? Close old connection
    if (instance.socket && instance.gameId !== gameId) {
      instance.socket.close();
      instance.socket = null;
      instance.gameId = null;
    }

    // Fetch auth token and connect
    let cancelled = false;

    async function connect() {
      try {
        const res = await sdk.quickAuth.fetch("/api/v1/auth/party-token");
        if (res.ok && !cancelled) {
          const data = await res.json();
          instance.token = data.token || "";
        }
      } catch {
        instance.token = "";
      }

      if (cancelled) return;

      const socket = new PartySocket({
        host: env.partykitHost || "localhost:1999",
        room: `game-${gameId}`,
        query: { token: instance.token || "" },
      });

      socket.addEventListener("open", () => {
        isConnectedRef.current = true;
        store.getState().setConnected(true);
      });

      socket.addEventListener("close", () => {
        isConnectedRef.current = false;
        store.getState().setConnected(false);
      });

      socket.addEventListener("message", handleMessage);

      instance.socket = socket;
      instance.gameId = gameId;
      instance.refCount = 1;
    }

    connect();

    return () => {
      cancelled = true;
      instance.refCount--;
      if (instance.refCount <= 0) {
        instance.socket?.close();
        instance.socket = null;
        instance.gameId = null;
        instance.refCount = 0;
        store.getState().setConnected(false);
      }
    };
  }, [gameId, enabled, store, handleMessage]);

  // ==========================================
  // SEND FUNCTIONS
  // ==========================================

  const sendChat = useCallback((text: string): boolean => {
    if (instance.socket?.readyState === WebSocket.OPEN) {
      try {
        instance.socket.send(JSON.stringify({ type: "chat", text }));
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }, []);

  const sendCheer = useCallback(() => {
    if (instance.socket?.readyState === WebSocket.OPEN) {
      instance.socket.send(JSON.stringify({ type: "cheer" }));
    }
  }, []);

  const sendAnswer = useCallback(
    (questionId: number, selected: number, timeMs: number) => {
      if (instance.socket?.readyState === WebSocket.OPEN) {
        instance.socket.send(
          JSON.stringify({
            type: "answer",
            data: { questionId, selected, timeMs },
          })
        );
      }
    },
    []
  );

  // Return stable object
  return useMemo(
    () => ({
      isConnected: isConnectedRef.current,
      sendChat,
      sendCheer,
      sendAnswer,
    }),
    [sendChat, sendCheer, sendAnswer]
  );
}
