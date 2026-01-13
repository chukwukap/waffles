/**
 * GameProvider - Pure Context-based game state management
 *
 * Manages:
 * - PartyKit WebSocket connection (via usePartySocket)
 * - Game state (entry, stats, chat, etc.)
 * - Send functions (chat, answer, cheer)
 *
 */

"use client";

import {
    createContext,
    useContext,
    useEffect,
    useReducer,
    useCallback,
    type ReactNode,
    type Dispatch,
} from "react";
import { useRouter } from "next/navigation";
import usePartySocket from "partysocket/react";
import sdk from "@farcaster/miniapp-sdk";
import { env } from "@/lib/env";
import type { Message, ChatItem } from "@shared/protocol";
import type { GameEntry, Game } from "@prisma";
import { useUser } from "@/hooks/useUser";
import { WaffleLoader } from "@/components/ui/WaffleLoader";



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
    // Game data (from server)
    game: Game | null;

    // Core
    entry: GameEntryData | null;
    isLoadingEntry: boolean;
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
    game: null,
    entry: null,
    isLoadingEntry: true,
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
    | { type: "SET_LOADING_ENTRY"; payload: boolean }
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
            return { ...state, entry: action.payload, isLoadingEntry: false };

        case "SET_LOADING_ENTRY":
            return { ...state, isLoadingEntry: action.payload };

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
    refetchEntry: () => Promise<void>;
}

const GameContext = createContext<GameContextValue | null>(null);

// ==========================================
// PROVIDER
// ==========================================

interface GameProviderProps {
    children: ReactNode;
    game: Game | null;
    /** Initial recent players from server for immediate avatar display */
    initialRecentPlayers?: RecentPlayer[];
}

export function GameProvider({ children, game, initialRecentPlayers = [] }: GameProviderProps) {
    const router = useRouter();
    // Seed initial state with server-fetched recent players for immediate display
    const [state, dispatch] = useReducer(reducer, {
        ...initialState,
        game,
        recentPlayers: initialRecentPlayers,
    });

    const gameId = game?.id;

    // Message handler for WebSocket events
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
                console.error("Failed to parse message", event.data);
            }
        },
        [router]
    );

    // WebSocket connection using PartyKit's hook
    // - Auto-connects on mount, disconnects on unmount
    // - Auto-reconnects with exponential backoff
    // - Async query function fetches auth token for each connection
    // - startClosed=true when no gameId (don't connect without a game)
    const socket = usePartySocket({
        host: env.partykitHost,
        party: "main",
        room: gameId ? `game-${gameId}` : "none",
        startClosed: !gameId, // Don't connect if no gameId

        // Async query function - fetches auth token before connection
        query: async () => {
            try {
                const res = await sdk.quickAuth.fetch("/api/v1/auth/party-token");
                if (res.ok) {
                    const data = await res.json();
                    return { token: data.token || "" };
                }
            } catch {
                // Continue without token
            }
            return { token: "" };
        },

        // Lifecycle handlers
        onOpen() {
            dispatch({ type: "SET_CONNECTED", payload: true });
        },
        onClose() {
            dispatch({ type: "SET_CONNECTED", payload: false });
        },
        onMessage: handleMessage,
    });

    // Access Control Logic - Redirects if user doesn't have game access
    const { user, isLoading: isLoadingUser } = useUser();

    useEffect(() => {
        if (!isLoadingUser && (!user || !user.hasGameAccess || user.isBanned)) {
            router.replace("/redeem");
        }
    }, [user, isLoadingUser, router]);

    // Fetch User Entry
    const fetchEntry = useCallback(async () => {
        if (!gameId) return;

        dispatch({ type: "SET_LOADING_ENTRY", payload: true });

        try {
            const res = await sdk.quickAuth.fetch(`/api/v1/games/${gameId}/entry`);
            if (res.ok) {
                const data = await res.json();
                dispatch({
                    type: "SET_ENTRY",
                    payload: {
                        id: data.id,
                        score: data.score ?? 0,
                        answered: data.answered ?? 0,
                        answeredQuestionIds: data.answeredQuestionIds ?? [],
                        paidAt: data.paidAt ? new Date(data.paidAt) : null,
                        rank: data.rank ?? null,
                        prize: data.prize ?? null,
                        claimedAt: data.claimedAt ? new Date(data.claimedAt) : null,
                    },
                });
            } else if (res.status === 404) {
                dispatch({ type: "SET_ENTRY", payload: null });
            } else {
                throw new Error("Failed to fetch");
            }
        } catch (err) {
            console.error("Failed to fetch entry", err);
            dispatch({ type: "SET_LOADING_ENTRY", payload: false });
        }
    }, [gameId]);

    // Auto-fetch entry on mount/change
    useEffect(() => {
        fetchEntry();
    }, [fetchEntry]);

    // Send functions use socket directly
    const sendChat = useCallback(
        (text: string): boolean => {
            if (socket.readyState === WebSocket.OPEN) {
                try {
                    const msg: Message = { type: "chat", text };
                    socket.send(JSON.stringify(msg));
                    return true;
                } catch {
                    return false;
                }
            }
            return false;
        },
        [socket]
    );

    const sendCheer = useCallback(() => {
        if (socket.readyState === WebSocket.OPEN) {
            const msg: Message = { type: "cheer" };
            socket.send(JSON.stringify(msg));
        }
    }, [socket]);

    const sendAnswer = useCallback(
        (questionIndex: number, answerIndex: number, timeMs: number) => {
            if (socket.readyState === WebSocket.OPEN) {
                const msg: Message = {
                    type: "submit",
                    q: questionIndex,
                    a: answerIndex,
                    ms: timeMs,
                };
                socket.send(JSON.stringify(msg));
            }
        },
        [socket]
    );

    // Block rendering while directing or if access denied
    if (isLoadingUser) return <WaffleLoader />;
    if (!user || !user.hasGameAccess || user.isBanned) return null;

    return (
        <GameContext.Provider
            value={{ state, dispatch, sendChat, sendAnswer, sendCheer, refetchEntry: fetchEntry }}
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
