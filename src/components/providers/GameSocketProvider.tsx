/**
 * GameSocketProvider - Context-based PartyKit Socket Management
 *
 * Manages PartyKit WebSocket lifecycle at the layout level.
 * Socket persists across all child page transitions.
 *
 * Architecture:
 * - Provider wraps the game layout
 * - Socket connects when gameId is available from URL
 * - Socket persists through /live, /result, etc. transitions
 * - Components consume via useGameSocket() hook
 */

"use client";

import {
    createContext,
    useContext,
    useRef,
    useEffect,
    useCallback,
    type ReactNode,
} from "react";
import { useParams, useRouter } from "next/navigation";
import PartySocket from "partysocket";
import sdk from "@farcaster/miniapp-sdk";
import { env } from "@/lib/env";
import { useGameStoreApi } from "@/components/providers/GameStoreProvider";

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
    gameId: string;
}

type IncomingMessage =
    | { type: "sync"; data: SyncData }
    | { type: "presence"; data: PresenceData }
    | { type: "chat"; data: ChatData }
    | { type: "event"; data: EventData }
    | { type: "answer"; data: { questionId: number; username: string; pfpUrl?: string | null; timestamp: number } }
    | { type: "cheer" }
    | { type: "gameStats"; data: GameStatsData }
    | { type: "answerResult"; data: { totalScore?: number; answeredCount?: number } }
    | { type: "gameEnd"; data: GameEndData };

// ==========================================
// CONTEXT
// ==========================================

interface GameSocketContextValue {
    sendChat: (text: string) => boolean;
    sendCheer: () => void;
    sendAnswer: (questionId: string, selected: number, timeMs: number) => void;
}

const GameSocketContext = createContext<GameSocketContextValue | null>(null);

// ==========================================
// PROVIDER
// ==========================================

interface GameSocketProviderProps {
    children: ReactNode;
}

export function GameSocketProvider({ children }: GameSocketProviderProps) {
    const params = useParams();
    const router = useRouter();
    const store = useGameStoreApi();

    // Get gameId from URL - supports /game/[gameId]/live, /game/[gameId]/result, etc.
    const gameId = params?.gameId as string | undefined;

    // Socket ref - persists across renders
    const socketRef = useRef<PartySocket | null>(null);
    const currentGameIdRef = useRef<string | null>(null);

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
                        break;

                    case "answer":
                        // Add answerer (store filters by currentQuestionId)
                        state.addAnswerer(String(msg.data.questionId), {
                            username: msg.data.username,
                            pfpUrl: msg.data.pfpUrl || null,
                            timestamp: msg.data.timestamp,
                        });
                        break;

                    case "cheer":
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
                        if (msg.data.answeredCount !== undefined) {
                            state.incrementAnswered();
                        }
                        break;

                    case "gameEnd":
                        router.push(`/game/${msg.data.gameId}/result`);
                        break;
                }
            } catch {
                // Ignore parse errors
            }
        },
        [store, router]
    );

    // Socket lifecycle effect
    useEffect(() => {
        // No gameId yet - no connection needed
        if (!gameId) {
            return;
        }

        // Same game already connected - do nothing
        if (socketRef.current && currentGameIdRef.current === gameId) {
            return;
        }

        // Different game - close old connection
        if (socketRef.current && currentGameIdRef.current !== gameId) {
            socketRef.current.close();
            socketRef.current = null;
            currentGameIdRef.current = null;
            store.getState().setConnected(false);
        }

        // Connect to new game
        let cancelled = false;

        async function connect() {
            // Get auth token
            let token = "";
            try {
                const res = await sdk.quickAuth.fetch("/api/v1/auth/party-token");
                if (res.ok && !cancelled) {
                    const data = await res.json();
                    token = data.token || "";
                }
            } catch {
                // Continue without token
            }

            if (cancelled) return;

            const socket = new PartySocket({
                host: env.partykitHost || "localhost:1999",
                room: `game-${gameId}`,
                query: { token },
            });

            socket.addEventListener("open", () => {
                store.getState().setConnected(true);
            });

            socket.addEventListener("close", () => {
                store.getState().setConnected(false);
            });

            socket.addEventListener("message", handleMessage);

            socketRef.current = socket;
            currentGameIdRef.current = gameId ?? null;
        }

        connect();

        // Cleanup - only on unmount or gameId change
        return () => {
            cancelled = true;
            // Note: We don't close socket here on unmount
            // because the layout persists - this cleanup only runs
            // when gameId actually changes (different game)
        };
    }, [gameId, store, handleMessage]);

    // Cleanup on provider unmount (leaving game section entirely)
    useEffect(() => {
        return () => {
            if (socketRef.current) {
                socketRef.current.close();
                socketRef.current = null;
                currentGameIdRef.current = null;
                store.getState().setConnected(false);
            }
        };
    }, [store]);

    // Send functions
    const sendChat = useCallback((text: string): boolean => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            try {
                socketRef.current.send(JSON.stringify({ type: "chat", text }));
                return true;
            } catch {
                return false;
            }
        }
        return false;
    }, []);

    const sendCheer = useCallback(() => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ type: "cheer" }));
        }
    }, []);

    const sendAnswer = useCallback(
        (questionId: string, selected: number, timeMs: number) => {
            if (socketRef.current?.readyState === WebSocket.OPEN) {
                socketRef.current.send(
                    JSON.stringify({
                        type: "answer",
                        data: { questionId, selected, timeMs },
                    })
                );
            }
        },
        []
    );

    return (
        <GameSocketContext.Provider value={{ sendChat, sendCheer, sendAnswer }}>
            {children}
        </GameSocketContext.Provider>
    );
}

// ==========================================
// HOOK
// ==========================================

/**
 * useGameSocket - Access socket send functions from any component
 * within the GameSocketProvider.
 *
 * Connection state is accessed via Zustand store (selectIsConnected).
 */
export function useGameSocket(): GameSocketContextValue {
    const context = useContext(GameSocketContext);
    if (!context) {
        throw new Error("useGameSocket must be used within GameSocketProvider");
    }
    return context;
}
