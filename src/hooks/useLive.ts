/**
 * useLive Hook
 *
 * Real-time WebSocket connection to PartyKit for game chat and events.
 * Uses the official usePartySocket hook and Zustand for state management.
 */

"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import usePartySocket from "partysocket/react";
import { useGameStore, selectIsConnected } from "@/lib/game-store";
import sdk from "@farcaster/miniapp-sdk";
import { env } from "@/lib/env";

// ==========================================
// MESSAGE PROTOCOL
// ==========================================

interface SyncPayload {
  n: number; // online count
  h: Array<{
    // history
    i: string;
    u: string;
    p: string | null;
    m: string;
    ts: number;
  }>;
}

interface PresencePayload {
  n: number; // online count
  j?: string; // joined username
  p?: string | null; // joined user pfp
  l?: string; // left username
}

interface ChatPayload {
  i: string; // id
  u: string; // username
  p: string | null; // pfp
  m: string; // message
  ts: number; // timestamp
}

interface EventPayload {
  i: string;
  t: "join" | "answer" | "achievement";
  u: string;
  p?: string | null; // pfp
  c: string;
  ts: number;
}

interface ReactionPayload {
  u: string; // username
  p?: string | null; // pfp
  r: string; // reaction type (e.g. 'cheer')
}

type IncomingMessage =
  | { t: "s"; d: SyncPayload }
  | { t: "p"; d: PresencePayload }
  | { t: "c"; d: ChatPayload }
  | { t: "e"; d: EventPayload }
  | { t: "r"; d: ReactionPayload }
  | { t: "a"; d: { u: string; p?: string | null; q: number; c: boolean } };

// ==========================================
// HOOK PROPS
// ==========================================

interface UseLiveProps {
  gameId: number;
  token?: string | null;
  enabled?: boolean;
}

// ==========================================
// HOOK IMPLEMENTATION
// ==========================================

export function useLive({
  gameId,
  token: providedToken,
  enabled = true,
}: UseLiveProps) {
  const [authToken, setAuthToken] = useState<string | null>(
    providedToken ?? null
  );
  const tokenFetchedRef = useRef(false);

  // Store actions (stable references)
  const {
    setConnected,
    setOnlineCount,
    addMessage,
    setMessages,
    addEvent,
    setEvents,
    setSendChat,
    setSendEvent,
    addReaction,
    setSendReaction,
    addPlayer,
  } = useGameStore();

  // Handle incoming messages
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data) as IncomingMessage;

        switch (msg.t) {
          case "s": // Sync (initial state)
            setOnlineCount(msg.d.n);
            setMessages(
              msg.d.h.map((m) => ({
                id: m.i,
                username: m.u,
                pfpUrl: m.p,
                text: m.m,
                timestamp: m.ts,
              }))
            );
            break;

          case "p": // Presence update
            setOnlineCount(msg.d.n);
            if (msg.d.j) {
              // Add player to recent players list
              addPlayer({
                username: msg.d.j,
                pfpUrl: msg.d.p || null,
                timestamp: Date.now(),
              });
              // Also add to events feed
              addEvent({
                id: `join-${Date.now()}`,
                type: "join",
                username: msg.d.j,
                pfpUrl: msg.d.p || null,
                content: "joined the game",
                timestamp: Date.now(),
              });
            }
            break;

          case "c": // Chat message
            addMessage({
              id: msg.d.i,
              username: msg.d.u,
              pfpUrl: msg.d.p,
              text: msg.d.m,
              timestamp: msg.d.ts,
            });
            break;

          case "e": // Game event
            addEvent({
              id: msg.d.i,
              type: msg.d.t,
              username: msg.d.u,
              pfpUrl: msg.d.p || null,
              content: msg.d.c,
              timestamp: msg.d.ts,
            });
            break;

          case "a": // Answer notification
            addEvent({
              id: `answer-${Date.now()}`,
              type: "answer",
              username: msg.d.u,
              pfpUrl: msg.d.p || null,
              content: msg.d.c ? "answered correctly!" : "answered",
              timestamp: Date.now(),
            });
            break;

          case "r": // Reaction (cheers)
            addReaction({
              id: `reaction-${Date.now()}-${Math.random()}`,
              username: msg.d.u,
              pfpUrl: msg.d.p || null,
              type: msg.d.r,
              timestamp: Date.now(),
            });
            break;
        }
      } catch (error) {
        console.error("[useLive] Failed to parse message:", error);
      }
    },
    [setOnlineCount, setMessages, addMessage, addEvent, addReaction, addPlayer]
  );

  // Fetch auth token if not provided
  useEffect(() => {
    if (providedToken) {
      setAuthToken(providedToken);
      return;
    }

    if (!enabled || !gameId || tokenFetchedRef.current) return;

    async function fetchToken() {
      try {
        tokenFetchedRef.current = true;
        const res = await sdk.quickAuth.fetch("/api/v1/auth/party-token");
        if (res.ok) {
          const data = await res.json();
          setAuthToken(data.token);
        } else {
          console.error("[useLive] Failed to fetch party token:", res.status);
        }
      } catch (error) {
        console.error("[useLive] Error fetching party token:", error);
        tokenFetchedRef.current = false; // Allow retry
      }
    }

    fetchToken();
  }, [providedToken, enabled, gameId]);

  // Get PartyKit host
  const host = env.partykitHost;

  // Use official usePartySocket hook
  const ws = usePartySocket({
    host: host || "localhost:1999",
    room: `game-${gameId}`,
    query: { token: authToken ?? "" },

    // Connection established
    onOpen() {
      setConnected(true);
    },

    // Connection closed
    onClose() {
      setConnected(false);
    },

    // Message received
    onMessage: handleMessage,

    // Connection error (non-critical - chat/events may not work)
    onError(error) {
      console.warn(
        "[useLive] WebSocket connection issue (chat may be unavailable):",
        error
      );
    },

    // Only connect when we have token and enabled
    startClosed: !enabled || !authToken || !gameId,
  });

  // Reconnect when token becomes available
  useEffect(() => {
    if (enabled && authToken && gameId && ws) {
      ws.reconnect();
    }
  }, [enabled, authToken, gameId, ws]);

  // Send chat message - returns true if sent successfully
  const sendChat = useCallback(
    (text: string): boolean => {
      if (ws?.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify({ t: "c", m: text }));
          return true;
        } catch (error) {
          console.error("[useLive] Failed to send chat:", error);
          return false;
        }
      }
      console.warn("[useLive] Cannot send chat - socket not ready");
      return false;
    },
    [ws]
  );

  // Send game event (type: "answer", content: "answered question 3")
  const sendEvent = useCallback(
    (type: string, content: string) => {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            t: "e",
            d: { t: type, c: content },
          })
        );
      }
    },
    [ws]
  );

  // Send reaction (e.g., cheer)
  const sendReaction = useCallback(
    (reactionType: string = "cheer") => {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            t: "r",
            r: reactionType,
          })
        );
      }
    },
    [ws]
  );

  // Get isConnected from store to trigger re-registration when connection state changes
  const isConnected = useGameStore(selectIsConnected);

  // Register sendChat, sendEvent, and sendReaction with store so other components can use them
  useEffect(() => {
    if (enabled && isConnected && ws) {
      setSendChat(sendChat);
      setSendEvent(sendEvent);
      setSendReaction(sendReaction);
    }
    return () => {
      // Clear on unmount
      setSendChat(() => {});
      setSendEvent(() => {});
      setSendReaction(() => {});
    };
  }, [
    enabled,
    isConnected,
    ws,
    sendChat,
    sendEvent,
    sendReaction,
    setSendChat,
    setSendEvent,
    setSendReaction,
  ]);

  return {
    sendChat,
    sendEvent,
    sendReaction,
  };
}
