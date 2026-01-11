/**
 * GameSocketProvider - Context-based PartyKit Socket Management
 *
 * Manages PartyKit WebSocket lifecycle at the layout level.
 * Socket persists across all child page transitions.
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
import type { Message, ChatItem } from "@shared/protocol";

// ==========================================
// CONTEXT
// ==========================================

interface GameSocketContextValue {
    sendChat: (text: string) => boolean;
    sendCheer: () => void;
    sendAnswer: (questionIndex: number, answerIndex: number, timeMs: number) => void;
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

    const gameId = params?.gameId as string | undefined;

    const socketRef = useRef<PartySocket | null>(null);
    const currentGameIdRef = useRef<string | null>(null);

    // Message handler
    const handleMessage = useCallback(
        (event: MessageEvent) => {
            try {
                const msg = JSON.parse(event.data) as Message;
                const state = store.getState();

                switch (msg.type) {
                    // Sync on connect
                    case "sync":
                        state.setOnlineCount(msg.connected);
                        state.setMessages(
                            msg.chat.map((m: ChatItem) => ({
                                id: m.id,
                                username: m.username,
                                pfpUrl: m.pfp,
                                text: m.text,
                                timestamp: m.ts,
                            }))
                        );
                        break;

                    // Presence
                    case "joined":
                        state.addPlayer({
                            username: msg.username,
                            pfpUrl: msg.pfp,
                            timestamp: Date.now(),
                        });
                        state.addEvent({
                            id: `join-${Date.now()}`,
                            type: "join",
                            username: msg.username,
                            pfpUrl: msg.pfp,
                            content: "joined the game",
                            timestamp: Date.now(),
                        });
                        break;

                    case "connected":
                        state.setOnlineCount(msg.count);
                        break;

                    // Chat
                    case "chat:new":
                        state.addMessage({
                            id: msg.id,
                            username: msg.username,
                            pfpUrl: msg.pfp,
                            text: msg.text,
                            timestamp: msg.ts,
                        });
                        break;

                    // Stats
                    case "stats":
                        state.updateGameStats({
                            prizePool: msg.prizePool,
                            playerCount: msg.playerCount,
                        });
                        break;

                    // Social
                    case "answered":
                        state.addAnswerer(String(msg.questionIndex), {
                            username: msg.username,
                            pfpUrl: msg.pfp,
                            timestamp: Date.now(),
                        });
                        break;

                    case "cheer":
                        import("@/app/(app)/(game)/game/_components/CheerOverlay").then(
                            ({ fireCheer }) => fireCheer(false)
                        );
                        break;

                    // Game lifecycle
                    case "game:starting":
                        // Could show countdown UI
                        console.log(`[Socket] Game starting in ${msg.in} seconds`);
                        break;

                    case "game:live":
                        // Could trigger game UI refresh
                        console.log("[Socket] Game is now live");
                        break;

                    case "game:end":
                        router.push(`/game/${msg.gameId}/result`);
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
        if (!gameId) return;

        if (socketRef.current && currentGameIdRef.current === gameId) {
            return;
        }

        if (socketRef.current && currentGameIdRef.current !== gameId) {
            socketRef.current.close();
            socketRef.current = null;
            currentGameIdRef.current = null;
            store.getState().setConnected(false);
        }

        let cancelled = false;

        async function connect() {
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
                host: env.partykitHost,
                room: `game-${gameId}`,
                party: "main",
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

        return () => {
            cancelled = true;
        };
    }, [gameId, store, handleMessage]);

    // Cleanup on provider unmount
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
                const msg: Message = { type: "chat", text };
                socketRef.current.send(JSON.stringify(msg));
                return true;
            } catch {
                return false;
            }
        }
        return false;
    }, []);

    const sendCheer = useCallback(() => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            const msg: Message = { type: "cheer" };
            socketRef.current.send(JSON.stringify(msg));
        }
    }, []);

    const sendAnswer = useCallback(
        (questionIndex: number, answerIndex: number, timeMs: number) => {
            if (socketRef.current?.readyState === WebSocket.OPEN) {
                const msg: Message = {
                    type: "submit",
                    q: questionIndex,
                    a: answerIndex,
                    ms: timeMs,
                };
                socketRef.current.send(JSON.stringify(msg));
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

export function useGameSocket(): GameSocketContextValue {
    const context = useContext(GameSocketContext);
    if (!context) {
        throw new Error("useGameSocket must be used within GameSocketProvider");
    }
    return context;
}
