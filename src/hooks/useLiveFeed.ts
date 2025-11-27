import { useState, useEffect, useCallback } from "react";
import { useGameEvents } from "./useGameEvents";

export type EventType = "join" | "chat";

export interface Event {
  id: number;
  avatar: string | null;
  content: string;
  type: EventType;
  username: string;
}

interface UseLiveFeedProps {
  gameId: number | null;
  maxEvents?: number;
}

export function useLiveFeed({ gameId, maxEvents = 5 }: UseLiveFeedProps) {
  const [events, setEvents] = useState<Event[]>([]);

  // Helper to append new events and keep only the last N
  const addEvent = useCallback(
    (newEvent: Event) => {
      setEvents((prev) => {
        // Check for duplicates (especially for chat messages that might come from history + realtime)
        if (
          prev.some((e) => e.id === newEvent.id && e.type === newEvent.type)
        ) {
          return prev;
        }
        return [...prev, newEvent].slice(-maxEvents);
      });
    },
    [maxEvents]
  );

  // Handle real-time chat
  const handleChat = useCallback(
    (chatEvent: {
      id: number;
      user: { username: string; pfpUrl: string | null };
      message: string;
    }) => {
      addEvent({
        id: chatEvent.id,
        avatar: chatEvent.user.pfpUrl,
        content: chatEvent.message,
        type: "chat",
        username: chatEvent.user.username,
      });
    },
    [addEvent]
  );

  // Handle real-time joins
  const handleJoin = useCallback(
    (joinEvent: {
      id: number;
      user: { username: string; pfpUrl: string | null };
    }) => {
      addEvent({
        id: joinEvent.id,
        avatar: joinEvent.user.pfpUrl,
        content: `${joinEvent.user.username} joined the lobby`,
        type: "join",
        username: joinEvent.user.username,
      });
    },
    [addEvent]
  );

  // Subscribe to Supabase events
  useGameEvents({
    gameId,
    enabled: !!gameId,
    onChat: handleChat,
    onJoin: handleJoin,
  });

  // Fetch initial history
  useEffect(() => {
    if (!gameId) return;

    const fetchHistory = async () => {
      try {
        const res = await fetch(
          `/api/chat?gameId=${gameId}&limit=${maxEvents}`
        );
        if (!res.ok) throw new Error("Failed to fetch chat history");
        const data = await res.json();

        const historyEvents: Event[] = data.messages.map((msg: any) => ({
          id: msg.id,
          avatar: msg.user?.pfpUrl || null,
          content: msg.text || msg.message, // handle potential DB field name differences
          type: "chat",
          username: msg.user?.username || `User ${msg.userId}`,
        }));

        // Merge history with any real-time events that arrived while fetching
        setEvents((prev) => {
          const combined = [...historyEvents, ...prev];

          // Deduplicate based on ID and type
          const unique = combined.filter(
            (event, index, self) =>
              index ===
              self.findIndex((t) => t.id === event.id && t.type === event.type)
          );

          // Return only the last N events
          return unique.slice(-maxEvents);
        });
      } catch (err) {
        console.error("Error fetching chat history:", err);
      }
    };

    fetchHistory();
  }, [gameId, maxEvents]);

  return { events };
}
