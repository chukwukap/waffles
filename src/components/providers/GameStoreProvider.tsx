/**
 * Game Store Provider
 *
 * SSR-safe Zustand store wrapper following Next.js App Router best practices.
 * Creates a per-request store instance using React Context + useRef pattern.
 *
 * @see https://docs.pmnd.rs/zustand/guides/nextjs
 */

"use client";

import {
    createContext,
    useContext,
    useRef,
    type ReactNode,
} from "react";
import { useStore } from "zustand";
import {
    createGameStore,
    type GameStore,
    type GameState,
    type GameEntryData,
} from "@/lib/game-store";

// ==========================================
// CONTEXT
// ==========================================

const GameStoreContext = createContext<GameStore | null>(null);

// ==========================================
// PROVIDER
// ==========================================

interface GameStoreProviderProps {
    children: ReactNode;
    initialEntry?: GameEntryData | null;
}

/**
 * GameStoreProvider - Wrap your app/layout with this provider.
 *
 * Creates a new store instance per request (SSR-safe).
 * Optionally accepts initial entry data from server.
 */
export function GameStoreProvider({
    children,
    initialEntry,
}: GameStoreProviderProps) {
    const storeRef = useRef<GameStore | null>(null);

    if (!storeRef.current) {
        storeRef.current = createGameStore();
        if (initialEntry !== undefined) {
            storeRef.current.setState({ entry: initialEntry });
        }
    }

    return (
        <GameStoreContext.Provider value={storeRef.current}>
            {children}
        </GameStoreContext.Provider>
    );
}

// ==========================================
// HOOKS
// ==========================================

/**
 * useGameStore - Main hook for accessing store state with selector.
 * 
 * Use separate calls for each value to optimize re-renders.
 * Import selectors from @/lib/game-store for consistency.
 * 
 * @example
 * import { selectScore, selectOnlineCount } from "@/lib/game-store";
 * const score = useGameStore(selectScore);
 * const onlineCount = useGameStore(selectOnlineCount);
 */
export function useGameStore<T>(selector: (state: GameState) => T): T {
    const store = useContext(GameStoreContext);
    if (!store) {
        throw new Error("useGameStore must be used within GameStoreProvider");
    }
    return useStore(store, selector);
}

/**
 * useGameStoreApi - Get direct store API for imperative access.
 * Use sparingly - prefer selectors for reactive updates.
 * 
 * @example
 * const store = useGameStoreApi();
 * store.getState().addEvent({...});
 */
export function useGameStoreApi(): GameStore {
    const store = useContext(GameStoreContext);
    if (!store) {
        throw new Error("useGameStoreApi must be used within GameStoreProvider");
    }
    return store;
}

// Legacy alias for backwards compatibility during migration
export const useGameStoreContext = useGameStore;
export const useGameStoreActions = () => {
    const store = useContext(GameStoreContext);
    if (!store) {
        throw new Error("useGameStoreActions must be used within GameStoreProvider");
    }
    return useStore(store, (s) => ({
        // Core
        setGame: s.setGame,
        setEntry: s.setEntry,
        // Live session
        setQuestions: s.setQuestions,
        submitAnswer: s.submitAnswer,
        advanceQuestion: s.advanceQuestion,
        setQuestionIndex: s.setQuestionIndex,
        setIsBreak: s.setIsBreak,
        setTimerTarget: s.setTimerTarget,
        setGameStarted: s.setGameStarted,
        setGameComplete: s.setGameComplete,
        // Real-time
        setConnected: s.setConnected,
        setOnlineCount: s.setOnlineCount,
        addMessage: s.addMessage,
        setMessages: s.setMessages,
        addEvent: s.addEvent,
        setEvents: s.setEvents,
        addReaction: s.addReaction,
        addPlayer: s.addPlayer,
        setRecentPlayers: s.setRecentPlayers,
        // Score
        updateScore: s.updateScore,
        incrementAnswered: s.incrementAnswered,
        // Reset
        reset: s.reset,
        resetLiveSession: s.resetLiveSession,
    }));
};
