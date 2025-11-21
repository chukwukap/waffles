import { useEffect, useRef, useState, useCallback } from "react";

// type EventType = "chat" | "join" | "connected" | "error";

interface ChatEvent {
  type: "chat";
  data: {
    id: number;
    userId: number;
    gameId: number;
    message: string;
    createdAt: string;
    user: {
      id: number;
      fid: number;
      username: string;
      pfpUrl: string | null;
    };
  };
}

interface JoinEvent {
  type: "join";
  data: {
    id: number;
    userId: number;
    gameId: number;
    joinedAt: string;
    user: {
      id: number;
      fid: number;
      username: string;
      pfpUrl: string | null;
    };
  };
}

type GameEvent =
  | ChatEvent
  | JoinEvent
  | { type: "connected" | "error"; message?: string }
  | { type: "stats"; data: { onlineCount: number } };

interface UseGameEventsOptions {
  gameId: number | null;
  enabled?: boolean;
  onChat?: (event: ChatEvent["data"]) => void;
  onJoin?: (event: JoinEvent["data"]) => void;
  onStats?: (data: { onlineCount: number }) => void;
}

/**
 * Hook for subscribing to real-time game events via Server-Sent Events
 */
export function useGameEvents({
  gameId,
  enabled = true,
  onChat,
  onJoin,
  onStats,
}: UseGameEventsOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!enabled || !gameId) {
      return;
    }

    // Create EventSource connection
    const eventSource = new EventSource(`/api/events?gameId=${gameId}`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const gameEvent: GameEvent = JSON.parse(event.data);

        switch (gameEvent.type) {
          case "connected":
            setIsConnected(true);
            break;
          case "chat":
            onChat?.(gameEvent.data);
            break;
          case "join":
            onJoin?.(gameEvent.data);
            break;
          case "stats":
            onStats?.(gameEvent.data);
            break;
          case "error":
            setError(gameEvent.message || "Unknown error");
            break;
        }
      } catch (err) {
        console.error("Error parsing SSE event:", err);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      setError("Connection error");
      // EventSource will automatically attempt to reconnect
    };

    // Cleanup
    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [gameId, enabled, onChat, onJoin, onStats]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    }
  }, []);

  return {
    isConnected,
    error,
    disconnect,
  };
}
