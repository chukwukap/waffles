import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { RealtimeChannel } from "@supabase/supabase-js";

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

interface UseGameEventsOptions {
  gameId: number | null;
  enabled?: boolean;
  onChat?: (event: ChatEvent["data"]) => void;
  onJoin?: (event: JoinEvent["data"]) => void;
  onStats?: (data: { onlineCount: number }) => void;
}

/**
 * Hook for subscribing to real-time game events via Supabase Realtime
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
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Keep latest callbacks in refs to avoid re-subscribing when they change
  const onChatRef = useRef(onChat);
  const onJoinRef = useRef(onJoin);
  const onStatsRef = useRef(onStats);

  useEffect(() => {
    onChatRef.current = onChat;
    onJoinRef.current = onJoin;
    onStatsRef.current = onStats;
  }, [onChat, onJoin, onStats]);

  useEffect(() => {
    if (!enabled || !gameId) {
      return;
    }

    const channel = supabase.channel(`game-${gameId}`);
    channelRef.current = channel;

    channel
      .on("broadcast", { event: "chat-event" }, (payload) => {
        onChatRef.current?.(payload.payload);
      })
      .on("broadcast", { event: "join-event" }, (payload) => {
        onJoinRef.current?.(payload.payload);
      })
      .on("broadcast", { event: "stats-event" }, (payload) => {
        onStatsRef.current?.(payload.payload);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
          setError(null);
        } else if (status === "CHANNEL_ERROR") {
          setIsConnected(false);
          setError("Connection error");
        }
      });

    // Cleanup
    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      setIsConnected(false);
    };
  }, [gameId, enabled]);

  const disconnect = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      setIsConnected(false);
    }
  }, []);

  return {
    isConnected,
    error,
    disconnect,
  };
}
