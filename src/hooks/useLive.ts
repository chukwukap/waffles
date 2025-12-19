/**
 * useLive Hook
 *
 * Real-time WebSocket connection to PartyKit for game chat and events.
 * Uses the game store for state management.
 */

"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import PartySocket from "partysocket";
import { useGameStore, selectIsConnected } from "@/lib/game-store";
import sdk from "@farcaster/miniapp-sdk";

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
  const socketRef = useRef<PartySocket | null>(null);
  const hasConnectedRef = useRef(false);
  const [authToken, setAuthToken] = useState<string | null>(
    providedToken ?? null
  );

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
    [setOnlineCount, setMessages, addMessage, addEvent, addReaction]
  );

  // Fetch auth token if not provided
  useEffect(() => {
    if (providedToken) {
      setAuthToken(providedToken);
      return;
    }

    if (!enabled || !gameId) return;

    async function fetchToken() {
      try {
        const res = await sdk.quickAuth.fetch("/api/v1/auth/party-token");
        if (res.ok) {
          const data = await res.json();
          setAuthToken(data.token);
        } else {
          console.error("[useLive] Failed to fetch party token:", res.status);
        }
      } catch (error) {
        console.error("[useLive] Error fetching party token:", error);
      }
    }

    fetchToken();
  }, [providedToken, enabled, gameId]);

  // Connect to PartyKit
  useEffect(() => {
    if (!enabled || !gameId || !authToken) {
      return;
    }

    // Prevent duplicate connections
    if (hasConnectedRef.current && socketRef.current) {
      return;
    }

    const host = process.env.NEXT_PUBLIC_PARTYKIT_HOST;
    if (!host) {
      console.error("[useLive] NEXT_PUBLIC_PARTYKIT_HOST not configured");
      return;
    }

    const socket = new PartySocket({
      host,
      room: `game-${gameId}`,
      query: { token: authToken },
    });

    socket.onopen = () => {
      hasConnectedRef.current = true;
      setConnected(true);
    };

    socket.onclose = () => {
      setConnected(false);
    };

    socket.onmessage = handleMessage;

    socket.onerror = (error) => {
      console.error("[useLive] WebSocket error:", error);
    };

    socketRef.current = socket;

    return () => {
      socket.close();
      socketRef.current = null;
      hasConnectedRef.current = false;
      setConnected(false);
    };
  }, [gameId, authToken, enabled, handleMessage, setConnected]);

  // Send chat message - returns true if sent successfully
  const sendChat = useCallback((text: string): boolean => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      try {
        socketRef.current.send(JSON.stringify({ t: "c", m: text }));
        return true;
      } catch (error) {
        console.error("[useLive] Failed to send chat:", error);
        return false;
      }
    }
    console.warn("[useLive] Cannot send chat - socket not ready");
    return false;
  }, []);

  // Send game event (type: "answer", content: "answered question 3")
  const sendEvent = useCallback((type: string, content: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          t: "e",
          d: { t: type, c: content },
        })
      );
    }
  }, []);

  // Send reaction (e.g., cheer)
  const sendReaction = useCallback((reactionType: string = "cheer") => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          t: "r",
          r: reactionType,
        })
      );
    }
  }, []);

  // Get isConnected from store to trigger re-registration when connection state changes
  const isConnected = useGameStore(selectIsConnected);

  // Register sendChat, sendEvent, and sendReaction with store so other components can use them
  // Depends on isConnected to re-register when socket connects
  useEffect(() => {
    if (enabled && isConnected && socketRef.current) {
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
