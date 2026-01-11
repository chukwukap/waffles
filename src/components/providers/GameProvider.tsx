/**
 * GameProvider - Pure Context-based game state management
 *
 * Manages:
 * - PartyKit WebSocket connection
 * - Game state (entry, stats, chat, etc.)
 * - Send functions (chat, answer, cheer)
 *
 * No Zustand - just React Context + useReducer
 */

"use client";

import {
    createContext,
    useContext,
    useRef,
    useEffect,
    useReducer,
    useCallback,
    type ReactNode,
    type Dispatch,
} from "react";
import { useParams, useRouter } from "next/navigation";
import PartySocket from "partysocket";
import sdk from "@farcaster/miniapp-sdk";
import { env } from "@/lib/env";
import type { Message, ChatItem } from "@shared/protocol";
import type { GameEntry } from "@prisma";



export interface RecentPlayer {
    username: string;
    pfpUrl: string | null;
    timestamp: number;
}

export type GameEntryData = Pick<
    GameEntry,
    "id" | "score" | "answered" | "paidAt" | "rank" | "prize" | "claimedAt"
> & {
    answeredQuestionIds: string[];
};

// ==========================================
// STATE
// ==========================================

interface GameState {
    // Core
    entry: GameEntryData | null;
    prizePool: number | null;
    playerCount: number | null;

    // Real-time
    connected: boolean;
    onlineCount: number;
    messages: ChatItem[];
    recentPlayers: RecentPlayer[];
    currentQuestionId: string | null;
    questionAnswerers: RecentPlayer[];
}

const initialState: GameState = {
    entry: null,
    prizePool: null,
    playerCount: null,
    connected: false,
    onlineCount: 0,
    messages: [],
    recentPlayers: [],
    currentQuestionId: null,
    questionAnswerers: [],
};

// ==========================================
// ACTIONS
// ==========================================

type Action =
    | { type: "SET_ENTRY"; payload: GameEntryData | null }
    | { type: "UPDATE_STATS"; payload: { prizePool?: number; playerCount?: number } }
    | { type: "SET_CONNECTED"; payload: boolean }
    | { type: "SET_ONLINE_COUNT"; payload: number }
    | { type: "SET_MESSAGES"; payload: ChatItem[] }
    | { type: "ADD_MESSAGE"; payload: ChatItem }
    | { type: "ADD_PLAYER"; payload: RecentPlayer }
    | { type: "SET_CURRENT_QUESTION"; payload: string | null }
    | { type: "ADD_ANSWERER"; payload: { questionId: string; player: RecentPlayer } }
    | { type: "INCREMENT_ANSWERED" }
    | { type: "RESET" };

function reducer(state: GameState, action: Action): GameState {
    switch (action.type) {
        case "SET_ENTRY":
            return { ...state, entry: action.payload };

        case "UPDATE_STATS":
            return {
                ...state,
                prizePool: action.payload.prizePool ?? state.prizePool,
                playerCount: action.payload.playerCount ?? state.playerCount,
            };

        case "SET_CONNECTED":
            return { ...state, connected: action.payload };

        case "SET_ONLINE_COUNT":
            return { ...state, onlineCount: action.payload };

        case "SET_MESSAGES":
            return { ...state, messages: action.payload };

        case "ADD_MESSAGE":
            return {
                ...state,
                messages: [...state.messages.slice(-99), action.payload],
            };

        case "ADD_PLAYER":
            return {
                ...state,
                recentPlayers: [
                    action.payload,
                    ...state.recentPlayers.filter(
                        (p) => p.username !== action.payload.username
                    ),
                ].slice(0, 20),
            };

        case "SET_CURRENT_QUESTION":
            return {
                ...state,
                currentQuestionId: action.payload,
                questionAnswerers: [],
            };

        case "ADD_ANSWERER":
            if (state.currentQuestionId !== action.payload.questionId) return state;
            return {
                ...state,
                questionAnswerers: [
                    action.payload.player,
                    ...state.questionAnswerers.filter(
                        (p) => p.username !== action.payload.player.username
                    ),
                ].slice(0, 10),
            };

        case "INCREMENT_ANSWERED":
            if (!state.entry) return state;
            return {
                ...state,
                entry: { ...state.entry, answered: state.entry.answered + 1 },
            };

        case "RESET":
            return initialState;

        default:
            return state;
    }
}

// ==========================================
// CONTEXT
// ==========================================

interface GameContextValue {
    // State
    state: GameState;
    dispatch: Dispatch<Action>;

    // Send functions
    sendChat: (text: string) => boolean;
    sendAnswer: (questionIndex: number, answerIndex: number, timeMs: number) => void;
    sendCheer: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

// ==========================================
// PROVIDER
// ==========================================

interface GameProviderProps {
    children: ReactNode;
}

export function GameProvider({ children }: GameProviderProps) {
    const params = useParams();
    const router = useRouter();
    const [state, dispatch] = useReducer(reducer, initialState);

    const gameId = params?.gameId as string | undefined;
    const socketRef = useRef<PartySocket | null>(null);
    const currentGameIdRef = useRef<string | null>(null);

    // Message handler
    const handleMessage = useCallback(
        (event: MessageEvent) => {
            try {
                const msg = JSON.parse(event.data) as Message;

                switch (msg.type) {
                    case "sync":
                        dispatch({ type: "SET_ONLINE_COUNT", payload: msg.connected });
                        dispatch({ type: "SET_MESSAGES", payload: msg.chat });
                        break;

                    case "joined":
                        dispatch({
                            type: "ADD_PLAYER",
                            payload: {
                                username: msg.username,
                                pfpUrl: msg.pfp,
                                timestamp: Date.now(),
                            },
                        });
                        break;

                    case "connected":
                        dispatch({ type: "SET_ONLINE_COUNT", payload: msg.count });
                        break;

                    case "chat:new":
                        dispatch({
                            type: "ADD_MESSAGE",
                            payload: {
                                id: msg.id,
                                username: msg.username,
                                pfp: msg.pfp,
                                text: msg.text,
                                ts: msg.ts,
                            },
                        });
                        break;

                    case "stats":
                        dispatch({
                            type: "UPDATE_STATS",
                            payload: {
                                prizePool: msg.prizePool,
                                playerCount: msg.playerCount,
                            },
                        });
                        break;

                    case "answered":
                        dispatch({
                            type: "ADD_ANSWERER",
                            payload: {
                                questionId: String(msg.questionIndex),
                                player: {
                                    username: msg.username,
                                    pfpUrl: msg.pfp,
                                    timestamp: Date.now(),
                                },
                            },
                        });
                        break;

                    case "cheer":
                        import("@/app/(app)/(game)/game/_components/CheerOverlay").then(
                            ({ fireCheer }) => fireCheer(false)
                        );
                        break;

                    case "game:starting":
                        console.log(`[Socket] Game starting in ${msg.in} seconds`);
                        break;

                    case "game:live":
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
        [router]
    );

    // Socket lifecycle
    useEffect(() => {
        if (!gameId) return;

        if (socketRef.current && currentGameIdRef.current === gameId) {
            return;
        }

        if (socketRef.current && currentGameIdRef.current !== gameId) {
            socketRef.current.close();
            socketRef.current = null;
            currentGameIdRef.current = null;
            dispatch({ type: "SET_CONNECTED", payload: false });
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
                dispatch({ type: "SET_CONNECTED", payload: true });
            });

            socket.addEventListener("close", () => {
                dispatch({ type: "SET_CONNECTED", payload: false });
            });

            socket.addEventListener("message", handleMessage);

            socketRef.current = socket;
            currentGameIdRef.current = gameId ?? null;
        }

        connect();

        return () => {
            cancelled = true;
        };
    }, [gameId, handleMessage]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (socketRef.current) {
                socketRef.current.close();
                socketRef.current = null;
                currentGameIdRef.current = null;
                dispatch({ type: "SET_CONNECTED", payload: false });
            }
        };
    }, []);

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
        <GameContext.Provider
            value={{ state, dispatch, sendChat, sendAnswer, sendCheer }}
        >
            {children}
        </GameContext.Provider>
    );
}

// ==========================================
// HOOKS
// ==========================================

export function useGame(): GameContextValue {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error("useGame must be used within GameProvider");
    }
    return context;
}
