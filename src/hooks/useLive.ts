/**
 * useLive Hook
 *
 * Real-time WebSocket connection to PartyKit for game chat and events.
 * Uses the game store for state management.
 */

"use client";

import { useEffect, useRef, useCallback } from "react";
import PartySocket from "partysocket";
import { useGameStore } from "@/lib/game-store";
import type { ChatMessage, GameEvent } from "@/lib/game-store";

// ==========================================
// MESSAGE PROTOCOL
// ==========================================

// Compact message types (single char for payload size)
type MessageType = "s" | "p" | "c" | "e" | "a";

interface SyncPayload {
  n: number; // online count
  h: Array<{
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
  c: string;
  ts: number;
}

type IncomingMessage =
  | { t: "s"; d: SyncPayload }
  | { t: "p"; d: PresencePayload }
  | { t: "c"; d: ChatPayload }
  | { t: "e"; d: EventPayload }
  | { t: "a"; d: { u: string; q: number; c: boolean } };

// ==========================================
// HOOK PROPS
// ==========================================

interface UseLiveProps {
  gameId: number;
  token: string;
  enabled?: boolean;
}

// ==========================================
// HOOK IMPLEMENTATION
// ==========================================

export function useLive({ gameId, token, enabled = true }: UseLiveProps) {
  const socketRef = useRef<PartySocket | null>(null);
  const hasConnectedRef = useRef(false);

  // Store actions (stable references)
  const {
    setConnected,
    setOnlineCount,
    addMessage,
    setMessages,
    addEvent,
    setEvents,
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
              content: msg.d.c,
              timestamp: msg.d.ts,
            });
            break;

          case "a": // Answer notification
            addEvent({
              id: `answer-${Date.now()}`,
              type: "answer",
              username: msg.d.u,
              content: msg.d.c ? "answered correctly!" : "answered",
              timestamp: Date.now(),
            });
            break;
        }
      } catch (error) {
        console.error("[useLive] Failed to parse message:", error);
      }
    },
    [setOnlineCount, setMessages, addMessage, addEvent]
  );

  // Connect to PartyKit
  useEffect(() => {
    if (!enabled || !gameId || !token) {
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
      query: { t: token },
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
  }, [gameId, token, enabled, handleMessage, setConnected]);

  // Send chat message
  const sendChat = useCallback((text: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ t: "c", m: text }));
    }
  }, []);

  // Send game event
  const sendEvent = useCallback((type: string, content: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ t: "e", type, content }));
    }
  }, []);

  return {
    sendChat,
    sendEvent,
  };
}
