import { useEffect, useState, useCallback, useRef } from "react";
import usePartySocket from "partysocket/react";
import { useUser } from "./useUser";
import sdk from "@farcaster/miniapp-sdk";

interface UserProfile {
  fid: number;
  username: string;
  pfpUrl: string | null;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: UserProfile;
  timestamp: number;
}

export interface GameEvent {
  type: "event";
  payload: {
    type: "answer" | "join";
    content: string;
    user: UserProfile;
  };
}

interface UsePartyGameOptions {
  gameId: string;
  enabled?: boolean;
}

export function usePartyGame({ gameId, enabled = true }: UsePartyGameOptions) {
  const { user, isLoading } = useUser();
  const [onlineCount, setOnlineCount] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [events, setEvents] = useState<GameEvent["payload"][]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const hasConnectedRef = useRef(false);

  // Fetch Auth Token
  useEffect(() => {
    if (!enabled || isLoading || !user) return;

    const fetchToken = async () => {
      try {
        const res = await sdk.quickAuth.fetch("/api/v1/auth/party-token");
        if (res.ok) {
          const data = await res.json();
          setAuthToken(data.token);
        } else {
          console.error("Failed to fetch party token");
        }
      } catch (e) {
        console.error("Error fetching party token", e);
      }
    };

    fetchToken();
  }, [enabled, isLoading, user]);

  // Determine if we're ready to connect
  const isReady = enabled && !!authToken && !!gameId;

  const socket = usePartySocket({
    host: process.env.NEXT_PUBLIC_PARTYKIT_HOST || "127.0.0.1:1999",
    room: `game-${gameId}`,
    query: { token: authToken ?? "" },
    // Start closed - we'll manually connect when ready
    startClosed: true,
    onOpen: () => setIsConnected(true),
    onClose: () => setIsConnected(false),
    onMessage: (event) => {
      try {
        const msg = JSON.parse(event.data);

        switch (msg.type) {
          case "sync":
            setOnlineCount(msg.payload.onlineCount);
            setMessages(msg.payload.history);
            break;
          case "presence":
            setOnlineCount(msg.payload.onlineCount);
            if (msg.payload.joined) {
              addEvent({
                type: "join",
                content: "joined the lobby",
                user: msg.payload.joined,
              });
            }
            break;
          case "chat":
            setMessages((prev) => [...prev, msg.payload].slice(-100));
            break;
          case "event":
            addEvent(msg.payload);
            break;
        }
      } catch (e) {
        console.error("Failed to parse WebSocket message", e);
      }
    },
  });

  // Connect when ready
  useEffect(() => {
    if (isReady && !hasConnectedRef.current) {
      hasConnectedRef.current = true;
      // Update the query with the real token before connecting
      socket.updateProperties({
        query: { token: authToken! },
      });
      socket.reconnect();
    }
  }, [isReady, authToken, socket]);

  // Disconnect on unmount or when disabled
  useEffect(() => {
    return () => {
      if (hasConnectedRef.current) {
        socket.close();
      }
    };
  }, [socket]);

  const addEvent = useCallback((eventPayload: GameEvent["payload"]) => {
    setEvents((prev) => [...prev, eventPayload].slice(-5));
  }, []);

  const sendChat = useCallback(
    (text: string) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: "chat",
            text,
          })
        );
      }
    },
    [socket]
  );

  const sendEvent = useCallback(
    (payload: unknown) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: "event",
            payload,
          })
        );
      }
    },
    [socket]
  );

  return {
    isConnected,
    onlineCount,
    messages,
    events,
    sendChat,
    sendEvent,
  };
}
