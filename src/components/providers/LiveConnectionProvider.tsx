/**
 * Live Connection Provider
 *
 * Provides PartyKit WebSocket connection and send functions via Context.
 * Uses usePartySocket directly for a simpler architecture.
 */

"use client";

import {
    createContext,
    useContext,
    useCallback,
    type ReactNode,
} from "react";
import usePartySocket from "partysocket/react";
import sdk from "@farcaster/miniapp-sdk";
import { env } from "@/lib/env";
import { useGameStoreApi } from "@/components/providers/GameStoreProvider";

// ==========================================
// TYPES
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
    gameState: unknown;
    score: number;
    answers: Record<number, number>;
}

interface PresenceData {
    onlineCount: number;
    joined?: string;
    pfpUrl?: string | null;
    left?: string;
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

interface ReactionData {
    username: string;
    pfpUrl?: string | null;
    reactionType: string;
}

interface QuestionData {
    index: number;
    question: {
        id: number;
        text: string;
        options: string[];
        timeLimit: number;
    };
    startTime: number;
    endTime: number;
}

interface BreakData {
    endTime: number;
    nextIndex: number;
}

interface AnswerResultData {
    correct?: boolean;
    points?: number;
    totalScore?: number;
    answeredCount?: number;
    error?: string;
}

interface LeaderboardEntry {
    rank: number;
    username: string;
    score: number;
}

interface GameEndData {
    leaderboard: Array<{ fid: number; username: string; score: number }>;
}

type IncomingMessage =
    | { type: "sync"; data: SyncData }
    | { type: "presence"; data: PresenceData }
    | { type: "chat"; data: ChatData }
    | { type: "event"; data: EventData }
    | { type: "reaction"; data: ReactionData }
    | { type: "question"; data: QuestionData }
    | { type: "break"; data: BreakData }
    | { type: "answerResult"; data: AnswerResultData }
    | { type: "leaderboard"; data: LeaderboardEntry[] }
    | { type: "gameEnd"; data: GameEndData };

// ==========================================
// CONTEXT
// ==========================================

interface LiveConnectionContextValue {
    sendChat: (text: string) => boolean;
    sendEvent: (eventType: string, content: string) => void;
    sendReaction: (reactionType?: string) => void;
    sendAnswer: (questionId: number, selected: number, timeMs: number) => void;
}

const LiveConnectionContext = createContext<LiveConnectionContextValue | null>(null);

// ==========================================
// HOOK
// ==========================================

export function useLiveConnection(): LiveConnectionContextValue {
    const ctx = useContext(LiveConnectionContext);
    if (!ctx) {
        return {
            sendChat: () => false,
            sendEvent: () => { },
            sendReaction: () => { },
            sendAnswer: () => { },
        };
    }
    return ctx;
}

// ==========================================
// PROVIDER
// ==========================================

interface LiveConnectionProviderProps {
    gameId: number;
    enabled?: boolean;
    children: ReactNode;
}

export function LiveConnectionProvider({
    gameId,
    enabled = true,
    children,
}: LiveConnectionProviderProps) {
    const store = useGameStoreApi();

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
                            type: msg.data.eventType === "answer" ? "answer" : msg.data.eventType === "join" ? "join" : "achievement",
                            username: msg.data.username,
                            pfpUrl: msg.data.pfpUrl || null,
                            content: msg.data.content,
                            timestamp: msg.data.timestamp,
                        });
                        break;

                    case "reaction":
                        state.addReaction({
                            id: `reaction-${Date.now()}-${Math.random()}`,
                            username: msg.data.username,
                            pfpUrl: msg.data.pfpUrl || null,
                            type: msg.data.reactionType,
                            timestamp: Date.now(),
                        });
                        break;

                    case "question":
                        state.setQuestionIndex(msg.data.index);
                        state.setTimerTarget(msg.data.endTime);
                        state.setIsBreak(false);
                        state.setGameStarted(true);
                        break;

                    case "break":
                        state.setIsBreak(true);
                        state.setTimerTarget(msg.data.endTime);
                        break;

                    case "answerResult":
                        if (msg.data.totalScore !== undefined) {
                            state.updateScore(msg.data.totalScore);
                        }
                        if (msg.data.answeredCount !== undefined) {
                            state.incrementAnswered();
                        }
                        break;

                    case "leaderboard":
                        // Could add leaderboard state to store if needed
                        break;

                    case "gameEnd":
                        state.setGameComplete(true);
                        break;
                }
            } catch {
                // Ignore parse errors
            }
        },
        [store]
    );

    const ws = usePartySocket({
        host: env.partykitHost || "localhost:1999",
        room: `game-${gameId}`,
        query: async () => {
            try {
                const res = await sdk.quickAuth.fetch("/api/v1/auth/party-token");
                if (res.ok) {
                    const data = await res.json();
                    return { token: data.token || "" };
                }
            } catch {
                // Auth failed
            }
            return { token: "" };
        },
        onOpen() {
            store.getState().setConnected(true);
        },
        onClose() {
            store.getState().setConnected(false);
        },
        onMessage: handleMessage,
        startClosed: !enabled || !gameId,
    });

    const sendChat = useCallback(
        (text: string): boolean => {
            if (ws?.readyState === WebSocket.OPEN) {
                try {
                    ws.send(JSON.stringify({ type: "chat", text }));
                    return true;
                } catch {
                    return false;
                }
            }
            return false;
        },
        [ws]
    );

    const sendEvent = useCallback(
        (eventType: string, content: string) => {
            if (ws?.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: "event", data: { eventType, content } }));
            }
        },
        [ws]
    );

    const sendReaction = useCallback(
        (reactionType: string = "cheer") => {
            if (ws?.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: "reaction", reactionType }));
            }
        },
        [ws]
    );

    const sendAnswer = useCallback(
        (questionId: number, selected: number, timeMs: number) => {
            if (ws?.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: "answer", data: { questionId, selected, timeMs } }));
            }
        },
        [ws]
    );

    const value: LiveConnectionContextValue = {
        sendChat,
        sendEvent,
        sendReaction,
        sendAnswer,
    };

    return (
        <LiveConnectionContext.Provider value={value}>
            {children}
        </LiveConnectionContext.Provider>
    );
}
